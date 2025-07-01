import { Request, Response } from "express";
import supabase from "../supabaseClient";
import { createQris, createDisbursement } from "../services/xendit";
import { nanoid } from "nanoid";

type DriverWithUser = {
  id: string;
  balance: number;
  user_id: string;
  users: {
    email: string;
  };
};

export const getTransactionByRide = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rideId = req.params.rideId;

  if (!rideId) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Missing ride ID",
      code: "MISSING_RIDE_ID",
    });
    return;
  }

  try {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !transaction) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Transaction not found for this ride",
        code: "TRANSACTION_NOT_FOUND",
      });
      return;
    }

    const now = new Date();
    const isQris = transaction.payment_method === "qris";
    const isExpired =
      transaction.status === "expired" ||
      (transaction.qr_expires_at && new Date(transaction.qr_expires_at) < now);

    if (isQris && isExpired) {
      // 🔁 Regenerate external_id
      const newExternalId = `ride_${rideId}_${nanoid(10)}`;

      const qrisRes = await createQris({
        externalId: newExternalId,
        amount: transaction.amount,
        currency: "IDR",
      });

      // 🔄 Update existing transaction
      const { data: updatedTx, error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "awaiting_payment",
          external_id: newExternalId,
          qr_string: qrisRes.qr_string,
          qr_reference_id: qrisRes.reference_id,
          qr_expires_at: qrisRes.expiry_date,
          completed_at: null,
          metadata: {
            ...transaction.metadata,
            regenerated_at: new Date().toISOString(),
          },
        })
        .eq("id", transaction.id)
        .select()
        .single();

      if (updateError || !updatedTx) {
        res.status(500).json({
          status: 500,
          error: "Failed to update transaction",
          message: updateError?.message,
          code: "QR_REGENERATION_FAILED",
        });
        return;
      }

      res.status(200).json({
        status: 200,
        message: "QR expired, regenerated successfully",
        data: updatedTx,
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "Transaction fetched successfully",
      data: transaction,
    });
    return;
  } catch (err) {
    console.error("Unexpected error in getTransactionByRide:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to get transaction",
      code: "INTERNAL_ERROR",
    });
    return;
  }
};

export const createTopupTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;
  const { amount } = req.body;

  if (!authId || !amount || amount <= 0) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Missing or invalid authId or amount.",
      code: "INVALID_INPUT",
    });
    return;
  }

  try {
    // 1. Lookup driver by auth_id
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (driverError || !driver) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Driver not found for provided auth ID.",
        code: "DRIVER_NOT_FOUND",
      });
      return;
    }

    const driverId = driver.id;
    const externalId = `topup_${driverId}_${nanoid(10)}`;

    // 2. Create QRIS via Xendit
    const qrisRes = await createQris({
      externalId,
      amount,
      currency: "IDR",
    });

    // 3. Insert transaction
    const { error: insertError } = await supabase.from("transactions").insert([
      {
        type: "topup",
        account_id: driverId,
        account_type: "driver",
        payment_method: "qris",
        amount,
        status: "awaiting_payment",
        currency: "IDR",
        qr_id: qrisRes.id,
        qr_string: qrisRes.qr_string,
        qr_reference_id: qrisRes.reference_id,
        qr_expires_at: qrisRes.expires_at,
        qr_metadata: qrisRes.metadata,
        remarks: "Top up via QRIS",
      },
    ]);

    if (insertError) {
      console.error("❌ Failed to insert topup transaction:", insertError);
      res.status(500).json({
        status: 500,
        error: "Transaction Error",
        message: insertError.message,
        code: "TOPUP_INSERT_FAILED",
      });
      return;
    }

    // 4. Respond with QR
    res.status(201).json({
      status: 201,
      message: "Top-up QR created successfully",
      code: "TOPUP_CREATED",
      data: {
        qr_id: qrisRes.id,
        qr_string: qrisRes.qr_string,
        expires_at: qrisRes.expires_at,
        amount,
      },
    });
  } catch (err) {
    console.error("❌ Top-up creation failed:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to create top-up transaction.",
      code: "TOPUP_FAILED",
    });
  }
};

export const requestDriverWithdrawal = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;
  const { amount } = req.body;

  if (!authId || !amount || amount <= 0) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Missing or invalid fields: amount, or unauthorized.",
      code: "MISSING_FIELDS",
    });
    return;
  }

  try {
    // 👤 Fetch driver and user email
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, balance, user_id, users(email)")
      .eq("auth_id", authId)
      .single<DriverWithUser>();

    if (driverError || !driver) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Driver not found",
        code: "DRIVER_NOT_FOUND",
      });
      return;
    }

    const email = driver.users?.email;
    if (!email) {
      res.status(400).json({
        status: 400,
        error: "Missing Email",
        message: "Driver must have a registered email to withdraw.",
        code: "EMAIL_REQUIRED",
      });
      return;
    }

    // 🧾 Check for existing pending withdrawal
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from("transactions")
      .select("id")
      .eq("account_id", driver.id)
      .eq("account_type", "driver")
      .eq("type", "withdrawal")
      .eq("status", "pending")
      .limit(1);

    if (pendingError) {
      throw new Error("Failed to check pending withdrawals.");
    }

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      res.status(409).json({
        status: 409,
        error: "Withdrawal Pending",
        message:
          "You already have a pending withdrawal. Please wait for it to complete before requesting another.",
        code: "WITHDRAWAL_ALREADY_PENDING",
      });
      return;
    }

    // 📊 Check balance using transaction summary RPC
    const { data: summary, error: rpcError } = await supabase.rpc(
      "driver_transaction_summary",
      { driver_id_input: driver.id }
    );

    if (rpcError || !summary) {
      res.status(500).json({
        status: 500,
        error: "Internal Server Error",
        message: "Failed to calculate driver balance.",
        code: "BALANCE_RECALC_FAILED",
      });
      return;
    }

    const { total_topup, total_payout, total_withdrawal } = summary;
    const actualBalance = total_topup + total_payout - total_withdrawal;

    if (actualBalance !== driver.balance) {
      res.status(409).json({
        status: 409,
        error: "Balance Mismatch",
        message:
          "Your balance appears inconsistent. Please contact admin for manual review.",
        code: "BALANCE_MISMATCH",
        data: {
          actualBalance,
          recordedBalance: driver.balance,
        },
      });
      return;
    }

    if (amount > actualBalance) {
      res.status(400).json({
        status: 400,
        error: "Insufficient Balance",
        message: "Requested amount exceeds your current balance.",
        code: "INSUFFICIENT_BALANCE",
      });
      return;
    }

    // 🏦 Get bank account
    const { data: bank, error: bankError } = await supabase
      .from("driver_bank_accounts")
      .select("*")
      .eq("driver_id", driver.id)
      .single();

    if (bankError || !bank) {
      res.status(404).json({
        status: 404,
        error: "No Bank Account",
        message: "Please add a bank account before withdrawing.",
        code: "BANK_ACCOUNT_NOT_FOUND",
      });
      return;
    }

    // 📄 Prepare disbursement external ID
    const trxId = `withdrawal_${driver.id}_${nanoid(10)}`;

    // 💸 Insert withdrawal transaction
    const trxPayload = {
      account_id: driver.id,
      account_type: "driver",
      type: "withdrawal",
      amount: -amount,
      status: "pending",
      payment_method: "bank_transfer",
      currency: "IDR",
      remarks: `Withdrawal to ${bank.channel_code} - ${bank.account_number}`,
      disbursement_external_id: trxId,
    };

    const { data: insertedTrx, error: trxError } = await supabase
      .from("transactions")
      .insert(trxPayload)
      .select("id")
      .single();

    if (trxError || !insertedTrx) {
      res.status(500).json({
        status: 500,
        error: "Transaction Failed",
        message: "Could not create withdrawal transaction.",
        code: "WITHDRAWAL_FAILED",
      });
      return;
    }

    // 🚀 Call Xendit disbursement
    await createDisbursement({
      transactionId: insertedTrx.id,
      externalId: trxId,
      amount,
      currency: "IDR",
      accountNumber: bank.account_number,
      bankCode: bank.channel_code,
      accountHolderName: bank.account_holder_name,
      description: `Driver withdrawal: ${bank.account_holder_name}`,
      email,
    });

    res.status(200).json({
      status: 200,
      message: "Withdrawal request submitted",
      code: "WITHDRAWAL_INITIATED",
    });
  } catch (err) {
    console.error("❌ Withdrawal error:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Unexpected error while processing withdrawal.",
      code: "INTERNAL_ERROR",
    });
  }
};

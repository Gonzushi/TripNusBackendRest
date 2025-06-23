import { Request, Response } from "express";
import supabase from "../supabaseClient";
import { createQris } from "../services/xendit";
import { nanoid } from "nanoid";

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

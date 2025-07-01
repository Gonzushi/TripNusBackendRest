import { Request, Response } from "express";
import supabase from "../supabaseClient";

/**
 * GET /bank-accounts
 * Retrieves the bank account details of the authenticated driver,
 * including channel_code metadata from disbursement_channels.
 */
export const getDriverBankAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;

  if (!authId) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "Missing authentication token",
      code: "UNAUTHORIZED",
    });
    return;
  }

  try {
    // 1. Get driver ID using authId
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (driverError || !driver) {
      res.status(404).json({
        status: 404,
        error: "Driver Not Found",
        message: "No driver found for this user",
        code: "DRIVER_NOT_FOUND",
      });
      return;
    }

    // 2. Get bank account info with disbursement channel join
    const { data: bankAccount, error: bankError } = await supabase
      .from("driver_bank_accounts")
      .select(
        "id, driver_id, channel_code, account_number, account_holder_name, created_at, updated_at, disbursement_channels(*)"
      )
      .eq("driver_id", driver.id)
      .single();

    if (bankError || !bankAccount) {
      res.status(404).json({
        status: 404,
        error: "Bank Account Not Found",
        message: "No bank account found for this driver",
        code: "BANK_ACCOUNT_NOT_FOUND",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "Bank account retrieved successfully",
      data: bankAccount,
    });
  } catch (err) {
    console.error("❌ Error fetching bank account:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Unexpected error while fetching bank account.",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /bank-accounts
 * Inserts or updates the authenticated driver's bank account details.
 */
export const insertDriverBankAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;
  const { channel_code, account_number, account_holder_name } = req.body;

  if (!authId) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "Missing authentication token",
      code: "UNAUTHORIZED",
    });
    return;
  }

  if (!channel_code || !account_number || !account_holder_name) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message:
        "Missing required fields: channel_code, account_number, or account_holder_name",
      code: "MISSING_FIELDS",
    });
    return;
  }

  try {
    // 1. Get driver ID using authId
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (driverError || !driver) {
      res.status(404).json({
        status: 404,
        error: "Driver Not Found",
        message: "No driver found for this user",
        code: "DRIVER_NOT_FOUND",
      });
      return;
    }

    // 2. Insert or update bank account
    const { data, error: upsertError } = await supabase
      .from("driver_bank_accounts")
      .upsert(
        {
          driver_id: driver.id,
          channel_code,
          account_number,
          account_holder_name,
        },
        { onConflict: "driver_id" }
      )
      .select("*")
      .single();

    if (upsertError) {
      res.status(500).json({
        status: 500,
        error: "Insert Failed",
        message: upsertError.message,
        code: "INSERT_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "Bank account saved successfully",
      data,
    });
  } catch (err) {
    console.error("❌ Error inserting bank account:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Unexpected error while inserting bank account.",
      code: "INTERNAL_ERROR",
    });
  }
};

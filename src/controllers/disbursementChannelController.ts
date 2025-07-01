import { Request, Response } from "express";
import supabase from "../supabaseClient";

/**
 * GET /driver-bank-accounts/channels
 * Returns a list of active bank disbursement channels, ordered by name
 */
export const getActiveBankChannels = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { data: channels, error } = await supabase
      .from("disbursement_channels")
      .select("channel_code, channel_name, channel_type")
      .eq("channel_type", "Bank")
      .eq("is_active", true)
      .order("channel_name", { ascending: true });

    if (error) {
      console.error("❌ Error fetching bank channels:", error.message);
      res.status(500).json({
        status: 500,
        error: "Internal Server Error",
        message: "Failed to retrieve bank channels",
        code: "FETCH_BANK_CHANNELS_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "Bank channels fetched successfully",
      data: channels,
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Unexpected error while fetching bank channels",
      code: "INTERNAL_ERROR",
    });
  }
};

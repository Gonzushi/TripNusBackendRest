// controllers/xenditController.ts
import { Request, Response } from "express";
import supabase from "../supabaseClient";
import { sendPushNotification } from "../services/notificationService";
import { publisher } from "../index";

export const handleXenditWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const callbackToken = req.headers["x-callback-token"];
  const data = req.body.data;

  if (callbackToken !== process.env.XENDIT_TEST_WEBHOOK_TOKEN) {
    res.sendStatus(401);
    return;
  }

  try {
    const { qr_id, status } = data;

    let transactionStatus: "completed" | "expired" | null = null;

    if (status === "SUCCEEDED") {
      transactionStatus = "completed";
    } else if (status === "EXPIRED") {
      transactionStatus = "expired";
    } else {
      res.sendStatus(200); // Ignore unsupported statuses like "ACTIVE"
      return;
    }

    // Get the transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("id, ride_id, type")
      .eq("qr_id", qr_id)
      .single();

    if (fetchError || !transaction) {
      console.error("🔴 Failed to fetch transaction:", fetchError?.message);
      res.status(404).send("Transaction not found");
      return;
    }

    // Update transaction
    const { error: updateTxError } = await supabase
      .from("transactions")
      .update({
        status: transactionStatus,
        completed_at:
          transactionStatus === "completed" ? new Date().toISOString() : null,
        type: transaction.type,
      })
      .eq("qr_id", qr_id);

    if (updateTxError) {
      console.error("🔴 Failed to update transaction:", updateTxError.message);
      res.status(500).send("Transaction update failed");
      return;
    }

    if (transactionStatus === "completed" && transaction.ride_id) {
      const { data: ride, error: rideFetchError } = await supabase
        .from("rides")
        .select("id, rider_id, driver_id")
        .eq("id", transaction.ride_id)
        .single();

      if (rideFetchError || !ride) {
        console.error(
          "🔴 Ride not found for transaction:",
          rideFetchError?.message
        );
        res.status(404).send("Ride not found");
        return;
      }

      // 1. Mark ride as completed
      const { error: rideUpdateError } = await supabase.rpc("ride_update", {
        p_ride_id: ride.id,
        p_status: "payment_successful",
        p_ended_at: new Date().toISOString(),
        p_driver_id: null,
        p_actual_payment_method: null,
        p_actual_dropoff_coords: null,
        p_actual_pickup_coords: null,
      });

      if (rideUpdateError) {
        console.error(
          "🔴 Failed to update ride status:",
          rideUpdateError.message
        );
      }

      // 2. Notify rider and driver
      const [{ data: rider }, { data: driver }] = await Promise.all([
        supabase
          .from("riders")
          .select("push_token")
          .eq("id", ride.rider_id)
          .single(),
        supabase
          .from("drivers")
          .select("push_token")
          .eq("id", ride.driver_id)
          .single(),
      ]);

      const messageData = {
        type: "PAYMENT_SUCCESSFUL",
        rideId: ride.id,
        status: "completed",
      };

      if (rider?.push_token) {
        await sendPushNotification(rider.push_token, {
          title: "Pembayaran berhasil",
          body: "Terima kasih telah menggunakan layanan kami!",
          data: messageData,
        });
      }

      if (driver?.push_token) {
        await sendPushNotification(driver.push_token, {
          title: "Pembayaran diterima",
          body: "Anda kini tersedia untuk pesanan baru.",
          data: messageData,
        });
      }

      // 3. Publish WebSocket messages
      await Promise.all([
        publisher.publish(
          `rider:${ride.rider_id}`,
          JSON.stringify(messageData)
        ),
        publisher.publish(
          `driver:${ride.driver_id}`,
          JSON.stringify(messageData)
        ),
      ]);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const simulateQrPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  let { qr_id } = req.params;
  let { amount } = req.body;

  try {
    if (!qr_id) {
      const { data: transaction, error } = await supabase
        .from("transactions")
        .select("qr_id, amount")
        .eq("status", "awaiting_payment")
        .eq("payment_method", "qris")
        .not("qr_id", "is", null)
        .limit(1)
        .single();

      if (error || !transaction?.qr_id) {
        res.status(400).json({
          status: 400,
          error: "Bad Request",
          message:
            "QR ID not provided and no eligible pending QRIS transaction found.",
          code: "NO_QR_ID_AVAILABLE",
        });
        return;
      }

      qr_id = transaction.qr_id;
      amount = transaction.amount;
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Invalid or missing 'amount' for simulation.",
        code: "INVALID_AMOUNT",
      });
      return;
    }

    const simulateRes = await fetch(
      `https://api.xendit.co/qr_codes/${qr_id}/payments/simulate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-version": "2022-07-31",
          Authorization:
            "Basic " +
            Buffer.from(process.env.XENDIT_TEST_API_KEY + ":").toString(
              "base64"
            ),
        },
        body: JSON.stringify({ amount }),
      }
    );

    const result = await simulateRes.json();

    if (!simulateRes.ok) {
      res.status(simulateRes.status).json({
        status: simulateRes.status,
        error: "Simulation Failed",
        message: result.message || "Unable to simulate QR payment.",
        code: "SIMULATE_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "QR payment simulated successfully",
      code: "SIMULATE_SUCCESS",
      data: result,
    });
  } catch (err) {
    console.error("❌ Simulate QR error:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Unexpected error while simulating QR payment.",
      code: "INTERNAL_ERROR",
    });
  }
};

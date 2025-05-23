import { Request, Response } from "express";
import midtransClient from "midtrans-client";

const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export const createGoPayPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { rideId, amount } = req.body;

  try {
    const parameter = {
      payment_type: "gopay",
      transaction_details: {
        order_id: `ride-${rideId}`,
        gross_amount: amount,
      },
      gopay: {
        enable_callback: true,
        callback_url: "yourapp://payment-success",
      },
    };

    const transaction = await coreApi.charge(parameter);

    res.status(200).json({
      message: "GoPay payment initiated",
      transaction,
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ message: "Payment initiation failed", error });
  }
};

export const refundGoPayPayment = async (req: Request, res: Response) => {
  const { orderId, amount, reason } = req.body;

  try {
    const refundResponse = await coreApi.transaction.refundDirect(orderId, {
      refund_key: `refund-${orderId}`,
      amount,
      reason,
    });

    res.status(200).json({
      message: "Refund successful",
      refundResponse,
    });
  } catch (error) {
    const status_code = (error as any)?.ApiResponse?.status_code || "unknown";
    const status_message =
      (error as any)?.ApiResponse?.status_message || "Refund failed";

    res.status(500).json({
      message: "Refund failed",
      status_code: status_code,
      status_message: status_message,
    });
  }
};

export const handleMidtransWebhook = async (req: Request, res: Response) => {
  const event = req.body;

  console.log("Midtrans Webhook Received:", event);
  // TODO: Update your database with payment status

  res.status(200).send("OK");
};

import supabase from "../supabaseClient";

export async function createQris({
  externalId,
  amount,
  currency = "IDR",
}: {
  externalId: string;
  amount: number;
  currency?: string;
}) {
  const isProduction = process.env.NODE_ENV === "production";

  const webhookUrl = isProduction
    ? "https://rest.trip-nus.com/xendit/webhook/qr-payment"
    : "https://a3e1-2001-448a-2098-4cc5-68a8-8434-1fd8-9133.ngrok-free.app/xendit/webhook/qr-payment";

  const res = await fetch("https://api.xendit.co/qr_codes", {
    method: "POST",
    headers: {
      "api-version": "2022-07-31",
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(process.env.XENDIT_TEST_API_KEY + ":").toString("base64"),
    },
    body: JSON.stringify({
      reference_id: externalId,
      external_id: externalId,
      type: "DYNAMIC",
      currency,
      amount,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {},
      webhook_url: webhookUrl,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create QR");
  }

  const json = await res.json();

  return json;
}

export async function createDisbursement({
  externalId,
  bankCode,
  accountNumber,
  accountHolderName,
  amount,
  description,
  currency = "IDR",
  email = "",
  isProduction = process.env.NODE_ENV === "production",
  transactionId,
  maxRetries = 3,
  retryDelayMs = 1000,
}: {
  externalId: string;
  bankCode: string; // becomes channel_code
  accountNumber: string;
  accountHolderName: string;
  amount: number;
  description: string;
  currency?: string;
  email?: string;
  isProduction?: boolean;
  transactionId: string;
  maxRetries?: number;
  retryDelayMs?: number;
}) {
  const url = `${
    isProduction ? "https://api.xendit.co" : "https://api.xendit.co"
  }/v2/payouts`;
  const authKey = isProduction
    ? process.env.XENDIT_PROD_API_KEY
    : process.env.XENDIT_TEST_API_KEY;

  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " + Buffer.from(authKey + ":").toString("base64"),
          "Idempotency-key": externalId,
        },
        body: JSON.stringify({
          reference_id: externalId,
          channel_code: bankCode,
          amount,
          currency,
          description,
          channel_properties: {
            account_holder_name: accountHolderName,
            account_number: accountNumber,
          },
          receipt_notification: email ? { email_to: [email] } : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Payout failed");
      }

      // ✅ Save payout/disbursement info to DB
      await supabase
        .from("transactions")
        .update({
          disbursement_id: result.id, // disb-xxxx
          disbursement_status: result.status, // ACCEPTED initially
        })
        .eq("id", transactionId);

      return result;
    } catch (err) {
      console.error(
        `Disbursement attempt ${attempt} failed:`,
        (err as Error).message
      );

      if (attempt >= maxRetries) {
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            disbursement_status: "FAILED",
          })
          .eq("id", transactionId);

        throw new Error("Disbursement permanently failed after retries.");
      }

      await new Promise((res) => setTimeout(res, retryDelayMs));
    }
  }
}

// services/xendit.ts
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
    ? "https://rest.trip-nus.com/xendit/webhook"
    : "https://a3e1-2001-448a-2098-4cc5-68a8-8434-1fd8-9133.ngrok-free.app/xendit/webhook";

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
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
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

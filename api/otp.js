const configured = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_VERIFY_SERVICE_SID
);

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!configured) return json(res, 503, { error: "SMS service is not configured. Add Twilio Verify environment variables in Vercel." });

  const { action, phone, code } = req.body || {};
  if (!/^\+[1-9]\d{7,14}$/.test(phone || "")) return json(res, 400, { error: "Enter a valid mobile number." });

  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const baseUrl = `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}`;
  const params = new URLSearchParams({ To: phone, Channel: "sms" });
  let endpoint = `${baseUrl}/Verifications`;

  if (action === "verify") {
    if (!/^\d{4,8}$/.test(code || "")) return json(res, 400, { error: "Enter the OTP sent to your phone." });
    endpoint = `${baseUrl}/VerificationCheck`;
    params.set("Code", code);
  } else if (action !== "request") {
    return json(res, 400, { error: "Invalid OTP action." });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return json(res, 502, { error: result.message || "The SMS provider rejected the request." });
  if (action === "verify" && result.status !== "approved") return json(res, 401, { error: "Invalid or expired OTP." });
  return json(res, 200, { ok: true });
};
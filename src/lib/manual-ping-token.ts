import { createHmac, timingSafeEqual } from "crypto";

interface ManualPingPayload {
  configId: string;
  userId: string;
}

function getSigningSecret() {
  const secret = process.env.ENCRYPTION_KEY || process.env.CRON_SECRET;

  if (!secret) {
    throw new Error("Missing signing secret");
  }

  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSigningSecret()).update(value).digest("base64url");
}

export function createManualPingToken(payload: ManualPingPayload) {
  const encodedPayload = encode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyManualPingToken(token: string): ManualPingPayload | null {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(encodedPayload)) as ManualPingPayload;

    if (!payload.configId || !payload.userId) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

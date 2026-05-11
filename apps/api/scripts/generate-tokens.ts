import { env } from "../src/env.ts";

const encoder = new TextEncoder();

async function importSecret(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function base64url(bytes: Uint8Array | ArrayBuffer): string {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of buf) str += String.fromCharCode(b);
  return btoa(str).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function sign(
  payload: Record<string, unknown>,
  key: CryptoKey,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64url(encoder.encode(JSON.stringify(payload)));
  const data = `${encodedHeader}.${encodedPayload}`;
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${base64url(sig)}`;
}

async function main(): Promise<void> {
  const key = await importSecret(env.JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);

  const tokenUser1 = await sign({ sub: "user1", iat: now }, key);
  const tokenUser2 = await sign({ sub: "user2", iat: now }, key);

  console.log("\nReparte — static JWT tokens");
  console.log("================================");
  console.log("user1:");
  console.log(tokenUser1);
  console.log("\nuser2:");
  console.log(tokenUser2);
  console.log(
    "\nSave each token in the corresponding device. They do not expire.",
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

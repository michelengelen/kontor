// Generate an AUTH_PASSWORD_HASH value for .env.
// Usage: npm run hash-password -- "your password"
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your password"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
console.log(`AUTH_PASSWORD_HASH=${salt.toString("hex")}:${hash.toString("hex")}`);

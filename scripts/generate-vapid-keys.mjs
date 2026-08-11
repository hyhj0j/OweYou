// One-off script, not run at build time: `node scripts/generate-vapid-keys.mjs`
// Prints a fresh VAPID key pair for Web Push, using Node's built-in crypto
// (no `web-push` package / network access needed). Put the public key in
// VITE_VAPID_PUBLIC_KEY (client env) and the private key in the
// `supabase secrets set VAPID_PRIVATE_KEY=...` for the notify-expense edge
// function (see supabase/functions/notify-expense). Never commit the
// private key -- it's the one thing that lets anyone forge push messages as
// this app.
import { generateKeyPairSync } from 'node:crypto'

function toBase64Url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const pubJwk = publicKey.export({ format: 'jwk' })
const privJwk = privateKey.export({ format: 'jwk' })

// Web Push wants the public key as the uncompressed SEC1 point (0x04 || X || Y).
const uncompressedPoint = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pubJwk.x, 'base64'),
  Buffer.from(pubJwk.y, 'base64'),
])

console.log('VITE_VAPID_PUBLIC_KEY=' + toBase64Url(uncompressedPoint))
console.log('VAPID_PRIVATE_KEY=' + toBase64Url(Buffer.from(privJwk.d, 'base64')))

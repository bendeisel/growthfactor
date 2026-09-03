// HighLevel hands an embedded app the current user's session by way of
// `window.exposeSessionDetails(appId)`, which resolves to a CryptoJS AES string
// encrypted with the app's shared secret. CryptoJS writes OpenSSL's
// "Salted__" envelope and derives the key with EVP_BytesToKey over MD5, so we
// reproduce that here and finish with WebCrypto AES-256-CBC.

import { md5 } from './md5.js';

const SALT_HEADER = 'Salted__';

export function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * OpenSSL EVP_BytesToKey with an MD5 digest and a single iteration.
 * @param {Uint8Array} password
 * @param {Uint8Array} salt
 * @param {number} keyLength
 * @param {number} ivLength
 */
export function evpBytesToKey(password, salt, keyLength = 32, ivLength = 16) {
  const target = keyLength + ivLength;
  const derived = new Uint8Array(target);
  let filled = 0;
  let previous = new Uint8Array(0);

  while (filled < target) {
    const input = new Uint8Array(previous.length + password.length + salt.length);
    input.set(previous, 0);
    input.set(password, previous.length);
    input.set(salt, previous.length + password.length);
    previous = md5(input);
    const take = Math.min(previous.length, target - filled);
    derived.set(previous.subarray(0, take), filled);
    filled += take;
  }

  return { key: derived.subarray(0, keyLength), iv: derived.subarray(keyLength, target) };
}

/**
 * Decrypts the payload returned by `exposeSessionDetails`.
 * Throws if the secret is wrong or the envelope is malformed, which is what
 * makes this usable as an authentication check.
 *
 * @param {string} encrypted base64 CryptoJS ciphertext
 * @param {string} sharedSecret the marketplace app's SSO key
 * @returns {Promise<object>} the decoded session, e.g. {userId, companyId, role, type, activeLocation, email}
 */
export async function decryptSession(encrypted, sharedSecret) {
  if (!encrypted || typeof encrypted !== 'string') throw new Error('Missing SSO payload');
  if (!sharedSecret) throw new Error('Missing GHL_SSO_KEY');

  const raw = base64ToBytes(encrypted.trim());
  if (raw.length <= 16) throw new Error('SSO payload too short');

  const header = new TextDecoder().decode(raw.subarray(0, 8));
  if (header !== SALT_HEADER) throw new Error('Unexpected SSO envelope');

  const salt = raw.subarray(8, 16);
  const ciphertext = raw.subarray(16);
  const { key, iv } = evpBytesToKey(new TextEncoder().encode(sharedSecret), salt);

  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['decrypt']);
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);
  } catch {
    throw new Error('SSO payload did not decrypt -- wrong shared secret?');
  }

  const text = new TextDecoder().decode(plaintext);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('SSO payload was not JSON');
  }
}

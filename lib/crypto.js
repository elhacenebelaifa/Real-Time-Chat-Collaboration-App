// Client-side E2E encryption using Web Crypto API
// Uses ECDH for key exchange and AES-GCM for message encryption

const CURVE = 'P-256';
const AES_ALGO = 'AES-GCM';
const AES_LENGTH = 256;

// Generate an ECDH key pair
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: CURVE },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
  return keyPair;
}

// Export public key as base64 string for transmission
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return bufferToBase64(exported);
}

// Import a public key from base64 string
export async function importPublicKey(base64Key) {
  const buffer = base64ToBuffer(base64Key);
  return window.crypto.subtle.importKey(
    'spki',
    buffer,
    { name: 'ECDH', namedCurve: CURVE },
    true,
    []
  );
}

// Export private key for backup (use with caution)
export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  return bufferToBase64(exported);
}

// Import private key from base64 string
export async function importPrivateKey(base64Key) {
  const buffer = base64ToBuffer(base64Key);
  return window.crypto.subtle.importKey(
    'pkcs8',
    buffer,
    { name: 'ECDH', namedCurve: CURVE },
    true,
    ['deriveKey', 'deriveBits']
  );
}

// Derive a shared AES key from own private key + other's public key
export async function deriveSharedKey(privateKey, otherPublicKey) {
  return window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: otherPublicKey },
    privateKey,
    { name: AES_ALGO, length: AES_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message with AES-GCM
export async function encryptMessage(plaintext, aesKey) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: AES_ALGO, iv },
    aesKey,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
  };
}

// Decrypt a message with AES-GCM
export async function decryptMessage(ciphertextBase64, ivBase64, aesKey) {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: AES_ALGO, iv },
    aesKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Generate a random AES key (for group chat room keys)
export async function generateRoomKey() {
  return window.crypto.subtle.generateKey(
    { name: AES_ALGO, length: AES_LENGTH },
    true, // extractable so it can be encrypted for each member
    ['encrypt', 'decrypt']
  );
}

// Export AES key as base64
export async function exportAESKey(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

// Import AES key from base64
export async function importAESKey(base64Key) {
  const buffer = base64ToBuffer(base64Key);
  return window.crypto.subtle.importKey(
    'raw',
    buffer,
    { name: AES_ALGO, length: AES_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

// Helper: ArrayBuffer to base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: base64 to ArrayBuffer
function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// IndexedDB helpers for key storage
const DB_NAME = 'chat-e2e-keys';
const STORE_NAME = 'keys';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveKeyToStore(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getKeyFromStore(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

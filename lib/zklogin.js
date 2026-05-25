'use client';

// Real Sui zkLogin flow utilities
// References: https://docs.sui.io/concepts/cryptography/zklogin

const PROVER_URL = process.env.NEXT_PUBLIC_PROVER_URL || 'https://prover-dev.mystenlabs.com/v1';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// ─── Ephemeral keypair ───────────────────────────────────────────────────────

export async function generateEphemeralKeypair() {
  const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
  const keypair = new Ed25519Keypair();
  const publicKey = keypair.getPublicKey().toBase64();
  // Store serialized keypair in sessionStorage so it survives the OAuth redirect
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('zklogin_ephemeral', JSON.stringify({
      schema: 'ED25519',
      privateKey: keypair.getSecretKey(),
    }));
    sessionStorage.setItem('zklogin_pubkey', publicKey);
  }
  return keypair;
}

export async function loadEphemeralKeypair() {
  if (typeof window === 'undefined') return null;
  try {
    const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
    const raw = sessionStorage.getItem('zklogin_ephemeral');
    if (!raw) return null;
    const { privateKey } = JSON.parse(raw);
    return Ed25519Keypair.fromSecretKey(privateKey);
  } catch {
    return null;
  }
}

// ─── Nonce + OAuth URL ───────────────────────────────────────────────────────

export async function buildGoogleOAuthURL({ maxEpoch, randomness, publicKey }) {
  const { generateNonce } = await import('@mysten/sui/zklogin');
  const nonce = generateNonce(publicKey, maxEpoch, randomness);

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('zklogin_randomness', randomness);
    sessionStorage.setItem('zklogin_maxEpoch', String(maxEpoch));
    sessionStorage.setItem('zklogin_nonce', nonce);
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + '/app',
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ─── JWT extraction from hash ────────────────────────────────────────────────

export function extractJWTFromHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get('id_token');
}

// ─── ZK proof from prover ────────────────────────────────────────────────────

export async function getZKProof({ jwt, extendedEphemeralPublicKey, maxEpoch, randomness, userSalt }) {
  const response = await fetch(PROVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jwt,
      extendedEphemeralPublicKey,
      maxEpoch,
      jwtRandomness: randomness,
      salt: userSalt,
      keyClaimName: 'sub',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Prover error ${response.status}: ${err}`);
  }

  return response.json();
}

// ─── Address derivation ──────────────────────────────────────────────────────

export async function deriveZKLoginAddress(jwt, userSalt) {
  const { jwtToAddress } = await import('@mysten/sui/zklogin');
  return jwtToAddress(jwt, userSalt);
}

// ─── User salt (deterministic from sub) ─────────────────────────────────────

export function getOrCreateUserSalt(sub) {
  if (typeof window === 'undefined') return '0';
  const key = `zklogin_salt_${sub}`;
  let salt = localStorage.getItem(key);
  if (!salt) {
    // Generate a random 16-byte salt as BigInt string
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    salt = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')).toString();
    localStorage.setItem(key, salt);
  }
  return salt;
}

// ─── Full zkLogin sign-in flow (called after OAuth redirect) ─────────────────

export async function completeZKLogin() {
  if (typeof window === 'undefined') return null;

  const jwt = extractJWTFromHash(window.location.hash);
  if (!jwt) return null;

  // Clear the hash to avoid reprocessing
  window.history.replaceState(null, '', window.location.pathname);

  // Decode JWT payload (no signature verification — prover does that)
  const [, payloadB64] = jwt.split('.');
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  const { sub, iss, aud, email } = payload;

  const userSalt = getOrCreateUserSalt(sub);
  const address = await deriveZKLoginAddress(jwt, userSalt);

  // Load ephemeral keypair and session data
  const keypair = await loadEphemeralKeypair();
  const randomness = sessionStorage.getItem('zklogin_randomness');
  const maxEpoch = sessionStorage.getItem('zklogin_maxEpoch');

  if (!keypair || !randomness || !maxEpoch) {
    throw new Error('zkLogin session data missing — please try again');
  }

  const extendedEphemeralPublicKey = keypair.getPublicKey().toSuiPublicKey();

  // Get ZK proof from prover
  const proof = await getZKProof({
    jwt,
    extendedEphemeralPublicKey,
    maxEpoch: Number(maxEpoch),
    randomness,
    userSalt,
  });

  const zkLoginData = {
    address,
    jwt,
    proof,
    userSalt,
    maxEpoch: Number(maxEpoch),
    randomness,
    keypair,
    email,
    sub,
    iss,
    aud,
    loginMethod: 'zklogin',
  };

  sessionStorage.setItem('zklogin_data', JSON.stringify({
    address, maxEpoch, randomness, userSalt, email, sub, iss, aud, loginMethod: 'zklogin',
    proof,
  }));

  return zkLoginData;
}

// ─── Initiate zkLogin (before OAuth redirect) ────────────────────────────────

export async function initiateZKLogin() {
  const { generateRandomness } = await import('@mysten/sui/zklogin');
  const { SuiClient } = await import('@mysten/sui/client');
  const { SUI_FULLNODE } = await import('./constants');

  const keypair = await generateEphemeralKeypair();
  const publicKey = keypair.getPublicKey();

  // Fetch current epoch from Sui testnet with fallback
  let currentEpoch;
  try {
    const client = new SuiClient({ url: SUI_FULLNODE });
    const state = await Promise.race([
      client.getLatestSuiSystemState(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);
    currentEpoch = Number(state.epoch);
  } catch {
    // Sui testnet: ~1 epoch per day. Reference: epoch ~600 on 2025-01-01.
    // Estimate current epoch from that anchor point.
    const REF_EPOCH = 600;
    const REF_MS = new Date('2025-01-01').getTime();
    currentEpoch = REF_EPOCH + Math.floor((Date.now() - REF_MS) / 86400000);
  }
  const maxEpoch = currentEpoch + 10;

  const randomness = generateRandomness();

  const oauthURL = await buildGoogleOAuthURL({ maxEpoch, randomness, publicKey });
  window.location.href = oauthURL;
}

// ─── Load persisted zkLogin session ──────────────────────────────────────────

export function loadZKLoginSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('zklogin_data');
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Sui epochs are not unix timestamps; just check if the session key exists
    if (!data.address) {
      sessionStorage.removeItem('zklogin_data');
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearZKLoginSession() {
  if (typeof window === 'undefined') return;
  ['zklogin_data', 'zklogin_ephemeral', 'zklogin_pubkey', 'zklogin_randomness', 'zklogin_maxEpoch', 'zklogin_nonce']
    .forEach(k => sessionStorage.removeItem(k));
}

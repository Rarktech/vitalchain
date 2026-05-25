'use client';

import { PROJECT_ATTRIBUTE } from './constants';

const ARKIV_PVK_KEY = 'arkiv_pvk_v1';

// ─── EVM keypair management ──────────────────────────────────────────────────

async function loadAccounts() {
  const { generatePrivateKey, privateKeyToAccount } = await import('@arkiv-network/sdk/accounts');
  return { generatePrivateKey, privateKeyToAccount };
}

async function autoFund(evmAddress) {
  try {
    await fetch('/api/faucet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: evmAddress }),
    });
    // Wait for faucet tx to finalize on Braga testnet (~2-3s blocks)
    await new Promise(r => setTimeout(r, 4000));
  } catch { /* silent */ }
}

export async function getOrCreateArkivKey(suiAddress) {
  if (typeof window === 'undefined') return null;
  const storageKey = `${ARKIV_PVK_KEY}_${suiAddress}`;
  let pvk = localStorage.getItem(storageKey);
  if (!pvk) {
    const { generatePrivateKey, privateKeyToAccount } = await loadAccounts();
    pvk = generatePrivateKey();
    localStorage.setItem(storageKey, pvk);
    const account = privateKeyToAccount(pvk);
    await autoFund(account.address);
  }
  return pvk;
}

export async function getArkivAddress(suiAddress) {
  const pvk = await getOrCreateArkivKey(suiAddress);
  if (!pvk) return null;
  const { privateKeyToAccount } = await loadAccounts();
  return privateKeyToAccount(pvk).address;
}

// Per-device keypair — stored by entity key after registration
export async function getOrCreateDeviceKey(deviceEntityKey) {
  if (typeof window === 'undefined') return null;
  const storageKey = `arkiv_device_pvk_${deviceEntityKey}`;
  let pvk = localStorage.getItem(storageKey);
  if (!pvk) {
    const { generatePrivateKey, privateKeyToAccount } = await loadAccounts();
    pvk = generatePrivateKey();
    localStorage.setItem(storageKey, pvk);
    const account = privateKeyToAccount(pvk);
    await autoFund(account.address);
  }
  return pvk;
}

export async function getDeviceAddress(deviceEntityKey) {
  const pvk = await getOrCreateDeviceKey(deviceEntityKey);
  if (!pvk) return null;
  const { privateKeyToAccount } = await loadAccounts();
  return privateKeyToAccount(pvk).address;
}

// ─── Client factories ─────────────────────────────────────────────────────────

async function getPublicClient() {
  const [{ createPublicClient, http }, { braga }] = await Promise.all([
    import('@arkiv-network/sdk'),
    import('@arkiv-network/sdk/chains'),
  ]);
  return createPublicClient({ chain: braga, transport: http() });
}

async function getWalletClient(pvk) {
  const [{ createWalletClient, http }, { braga }, { privateKeyToAccount }] = await Promise.all([
    import('@arkiv-network/sdk'),
    import('@arkiv-network/sdk/chains'),
    import('@arkiv-network/sdk/accounts'),
  ]);
  const account = privateKeyToAccount(pvk);
  const client = createWalletClient({ chain: braga, transport: http(), account });
  return { client, account };
}

// ─── Entity normalizer ────────────────────────────────────────────────────────
// Converts an Arkiv SDK Entity object to VitalChain's state.entities format.

export function normalizeEntity(entity) {
  let payload = {};
  try { if (entity.payload?.length) payload = entity.toJson(); } catch {}

  const attrs = entity.attributes || [];
  const attr = (key) => attrs.find(a => a.key === key)?.value;

  const createdAt = Number(attr('createdAt')) || Date.now();
  const expiresInDays = Number(attr('expiresInDays')) || 365;

  return {
    entityKey: entity.key,
    entityType: attr('entityType') || 'unknown',
    txHash: entity.key,
    $owner: entity.owner || '',
    $creator: entity.creator || '',
    createdAt,
    expiresAt: createdAt + expiresInDays * 86400000,
    expiresInDays,
    attributes: attrs,
    payload,
  };
}

// ─── Write operations ─────────────────────────────────────────────────────────

export async function arkivCreate(suiAddress, { entityType, attributes, payload, expiresInDays }) {
  const pvk = await getOrCreateArkivKey(suiAddress);
  if (!pvk) throw new Error('No Arkiv key available');

  const { client, account } = await getWalletClient(pvk);
  const { jsonToPayload } = await import('@arkiv-network/sdk/utils');

  const now = Date.now();
  const allAttrs = [
    { key: 'project', value: PROJECT_ATTRIBUTE },
    { key: 'entityType', value: entityType },
    { key: 'createdAt', value: now },
    { key: 'expiresInDays', value: expiresInDays },
    ...attributes,
  ];

  const { entityKey, txHash } = await client.createEntity({
    payload: jsonToPayload(payload),
    attributes: allAttrs,
    contentType: 'application/json',
    expiresIn: expiresInDays * 24 * 60 * 60,
  });

  return { entityKey, txHash, evmAddress: account.address, createdAt: now };
}

// Sign with a specific device private key (for biometric readings)
export async function arkivCreateWithDevicePvk(devicePvk, ownerEvmAddress, { entityType, attributes, payload, expiresInDays }) {
  const { client, account } = await getWalletClient(devicePvk);
  const { jsonToPayload } = await import('@arkiv-network/sdk/utils');

  const now = Date.now();
  const allAttrs = [
    { key: 'project', value: PROJECT_ATTRIBUTE },
    { key: 'entityType', value: entityType },
    { key: 'createdAt', value: now },
    { key: 'expiresInDays', value: expiresInDays },
    ...attributes,
  ];

  const { entityKey, txHash } = await client.createEntity({
    payload: jsonToPayload(payload),
    attributes: allAttrs,
    contentType: 'application/json',
    expiresIn: expiresInDays * 24 * 60 * 60,
  });

  // Transfer ownership to user's wallet so $owner = user
  try {
    await client.changeOwnership({ entityKey, newOwner: ownerEvmAddress });
  } catch { /* non-fatal — entity still works with device as owner */ }

  return { entityKey, txHash, evmAddress: account.address, createdAt: now };
}

export async function arkivDelete(suiAddress, entityKey) {
  const pvk = await getOrCreateArkivKey(suiAddress);
  if (!pvk) return;
  const { client } = await getWalletClient(pvk);
  await client.deleteEntity({ entityKey });
}

// ─── Read operations ──────────────────────────────────────────────────────────

export async function arkivLoadAll(suiAddress) {
  try {
    const evmAddress = await getArkivAddress(suiAddress);
    if (!evmAddress) return [];

    const { eq } = await import('@arkiv-network/sdk/query');
    const publicClient = await getPublicClient();

    const result = await publicClient
      .buildQuery()
      .where(eq('project', PROJECT_ATTRIBUTE))
      .ownedBy(evmAddress)
      .withAttributes(true)
      .withMetadata(true)
      .withPayload(true)
      .limit(200)
      .fetch();

    return result.entities.map(normalizeEntity);
  } catch (err) {
    console.warn('arkivLoadAll failed (using local cache):', err.message);
    return [];
  }
}

export async function arkivLoadByKey(entityKey) {
  try {
    const publicClient = await getPublicClient();
    const entity = await publicClient.getEntity(entityKey);
    if (!entity) return null;
    return normalizeEntity(entity);
  } catch {
    return null;
  }
}

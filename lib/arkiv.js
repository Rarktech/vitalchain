'use client';

import { PROJECT_ATTRIBUTE } from './constants';

// ─── Client factory (reads only) ─────────────────────────────────────────────

async function getPublicClient() {
  const [{ createPublicClient, http }, { braga }] = await Promise.all([
    import('@arkiv-network/sdk'),
    import('@arkiv-network/sdk/chains'),
  ]);
  return createPublicClient({ chain: braga, transport: http('/api/rpc') });
}

// ─── Entity normalizer ────────────────────────────────────────────────────────

export function normalizeEntity(entity) {
  let payload = {};
  try { if (entity.payload?.length) payload = entity.toJson(); } catch {}

  const attrs = entity.attributes || [];
  const attr = (key) => attrs.find(a => a.key === key)?.value;

  const createdAt = Number(attr('createdAt')) || Date.now();
  const expiresInDays = Number(attr('expiresInDays')) || 365;
  const suiOwner = attr('suiOwner');

  return {
    entityKey: entity.key,
    entityType: attr('entityType') || 'unknown',
    txHash: '',   // chain-fetched entities don't carry their original txHash
    $owner: suiOwner || entity.owner || '',
    $creator: entity.creator || '',
    createdAt,
    expiresAt: createdAt + expiresInDays * 86400000,
    expiresInDays,
    attributes: attrs,
    payload,
  };
}

// ─── Write operations (via server API) ───────────────────────────────────────

export async function arkivCreate(suiAddress, { entityType, attributes, payload, expiresInDays }) {
  const res = await fetch('/api/arkiv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', suiAddress, entityType, attributes, payload, expiresInDays }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Arkiv create failed (${res.status})`);
  }
  return res.json();
}

export async function arkivDelete(suiAddress, entityKey) {
  const res = await fetch('/api/arkiv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', suiAddress, entityKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Arkiv delete failed (${res.status})`);
  }
}

// ─── Read operations ──────────────────────────────────────────────────────────

export async function arkivLoadAll(suiAddress) {
  try {
    const { eq } = await import('@arkiv-network/sdk/query');
    const publicClient = await getPublicClient();

    const result = await publicClient
      .buildQuery()
      .where(eq('project', PROJECT_ATTRIBUTE))
      .where(eq('suiOwner', suiAddress))
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

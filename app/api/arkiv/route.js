import { NextResponse } from 'next/server';

const BRAGA_RPC = 'https://braga.hoodi.arkiv.network/rpc';
const PROJECT_ATTRIBUTE = 'vitalchain_ethns_arkiv_v1';

export async function POST(request) {
  const pvk = process.env.ARKIV_SERVER_PVK;
  if (!pvk) return NextResponse.json({ error: 'ARKIV_SERVER_PVK not configured' }, { status: 500 });

  const body = await request.json();
  const { action, suiAddress, entityType, attributes, payload, expiresInDays, entityKey } = body;

  const [{ createWalletClient, http }, { braga }, { privateKeyToAccount }] = await Promise.all([
    import('@arkiv-network/sdk'),
    import('@arkiv-network/sdk/chains'),
    import('@arkiv-network/sdk/accounts'),
  ]);

  const account = privateKeyToAccount(pvk);
  const client = createWalletClient({ chain: braga, transport: http(BRAGA_RPC), account });

  if (action === 'create') {
    const { jsonToPayload } = await import('@arkiv-network/sdk/utils');
    const now = Date.now();
    const allAttrs = [
      { key: 'project', value: PROJECT_ATTRIBUTE },
      { key: 'entityType', value: entityType },
      { key: 'suiOwner', value: suiAddress },
      { key: 'createdAt', value: now },
      { key: 'expiresInDays', value: expiresInDays },
      ...(attributes || []),
    ];
    try {
      const result = await client.createEntity({
        payload: jsonToPayload(payload || {}),
        attributes: allAttrs,
        contentType: 'application/json',
        expiresIn: expiresInDays * 24 * 60 * 60,
      });
      return NextResponse.json({ ...result, evmAddress: account.address, createdAt: now });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  if (action === 'delete') {
    try {
      await client.deleteEntity({ entityKey });
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

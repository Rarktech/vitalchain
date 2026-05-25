import { NextResponse } from 'next/server';

const BRAGA_FAUCET = 'https://braga.hoodi.arkiv.network/faucet/';

export async function POST(request) {
  try {
    const { address } = await request.json();
    const res = await fetch(BRAGA_FAUCET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    const text = await res.text();
    return NextResponse.json({ ok: res.ok, body: text });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

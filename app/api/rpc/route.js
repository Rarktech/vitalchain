import { NextResponse } from 'next/server';

const BRAGA_RPC = 'https://braga.hoodi.arkiv.network/rpc';

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(BRAGA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEMO_STEPS = [
  {
    num: '01', title: 'Sensor captures',
    sub: 'Device wallet signs a heart-rate reading at the source.',
    output: (data) => (
      <div>
        <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-geist-mono,"Geist Mono",monospace)', color: 'var(--accent)' }}>{data.bpm} <span style={{ fontSize: 13, color: 'var(--text-mute)' }}>bpm</span></div>
        <div style={{ marginTop: 6, color: 'var(--text-faint)', fontSize: 10 }}>$creator 0x9ae3…7c21</div>
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>Apex Watch S3 · 12:42 PM</div>
      </div>
    ),
  },
  {
    num: '02', title: 'Encrypt locally',
    sub: 'AES-GCM with a key derived from your wallet signature. Never leaves the browser.',
    output: (data) => (
      <div>
        <div style={{ fontSize: 10, wordBreak: 'break-all', lineHeight: 1.5, color: 'var(--text-mute)' }}>{data.ciphertext}</div>
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--accent)' }}>AES-GCM · 256-bit · 12-byte IV</div>
      </div>
    ),
  },
  {
    num: '03', title: 'Write to Arkiv',
    sub: 'createEntity with patient $owner and device $creator. Tx lands on Braga.',
    output: (data) => (
      <div style={{ fontSize: 10, lineHeight: 1.6 }}>
        <div><span style={{ color: 'var(--text-faint)' }}>tx</span> <span style={{ color: 'var(--accent)' }}>{data.txHash}</span></div>
        <div><span style={{ color: 'var(--text-faint)' }}>entity</span> {data.entityKey}</div>
        <div><span style={{ color: 'var(--text-faint)' }}>type</span> biometric_reading</div>
        <div><span style={{ color: 'var(--text-faint)' }}>project</span> vitalchain_…_v1</div>
        <div style={{ marginTop: 6, padding: '4px 6px', background: 'var(--accent-faint)', borderRadius: 4, fontSize: 9, color: 'var(--accent)', display: 'inline-block' }}>CONFIRMED · BLOCK +1</div>
      </div>
    ),
  },
  {
    num: '04', title: 'AI reads chain',
    sub: 'AI queries your readings, decrypts client-side, writes the analysis back as a new entity.',
    output: (data) => (
      <div style={{ fontSize: 11, lineHeight: 1.55 }}>
        <div style={{ color: 'var(--accent)' }}>› Trend over 30d</div>
        <div style={{ color: 'var(--text-mute)', marginTop: 4 }}>
          {data.aiPartial}
          <span style={{ display: 'inline-block', width: 6, height: 11, background: 'var(--accent)', marginLeft: 2, verticalAlign: '-2px', animation: 'cursor 1s steps(2) infinite' }}></span>
        </div>
        <div style={{ marginTop: 8 }}>
          <span className="chip accent" style={{ fontSize: 9, padding: '1px 6px' }}>TREND · IMPROVING</span>
        </div>
      </div>
    ),
  },
  {
    num: '05', title: 'Share with expiry',
    sub: 'data_share entity with expiresIn. Doctor sees it; Arkiv removes it after 7 days.',
    output: () => (
      <div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['07', '04', '23', '46'].map((n, i) => (
            <div key={i} style={{ background: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: 5, padding: '5px 6px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-geist-mono,"Geist Mono",monospace)', fontSize: 14, fontWeight: 500 }}>{n}</div>
              <div style={{ fontFamily: 'var(--font-geist-mono,"Geist Mono",monospace)', fontSize: 8, color: 'var(--text-faint)' }}>{['DAY', 'HR', 'MIN', 'SEC'][i]}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.4 }}>
          Entity auto-deletes at the protocol layer.<br />No server. No revoke endpoint.
        </div>
      </div>
    ),
  },
];

export default function Demo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [data, setData] = useState({
    bpm: 72, ciphertext: '7Hk2N9aB+vF…',
    txHash: '0x4f2c8a91…b317', entityKey: '0xa3d1…f02e', aiPartial: '',
  });

  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setStep(s => (s + 1) % (DEMO_STEPS.length + 1)), 3200);
    return () => clearInterval(i);
  }, [playing]);

  useEffect(() => {
    if (step === 0) setData(d => ({ ...d, bpm: 68 + Math.floor(Math.random() * 8) }));
    if (step === 1) {
      const fragments = ['7Hk2N9aB', '+vFp3Lwq', 'X8jD4Mre', 'sP1cZ7tY', '/iV0bH2K', 'gN5xQ9aR'];
      let acc = '', idx = 0;
      const grow = () => {
        if (idx >= fragments.length) return;
        acc += fragments[idx] + ' ';
        setData(d => ({ ...d, ciphertext: acc.trim() + '…' }));
        idx++; setTimeout(grow, 280);
      };
      setTimeout(grow, 200);
    }
    if (step === 2) {
      const r = (n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
      setData(d => ({ ...d, txHash: '0x' + r(8) + '…' + r(4), entityKey: '0x' + r(6) + '…' + r(4) }));
    }
    if (step === 3) {
      const aiText = 'Avg systolic dropped 4.2 mmHg over the past 30 days. Heart rate variability is steady. Recommend continuing current activity level.';
      let i = 0;
      const type = () => { if (i > aiText.length) return; setData(d => ({ ...d, aiPartial: aiText.slice(0, i) })); i += 3; setTimeout(type, 50); };
      setData(d => ({ ...d, aiPartial: '' }));
      setTimeout(type, 200);
    }
  }, [step]);

  return (
    <section className="demo-strip" id="demo">
      <div className="lsection" style={{ padding: '0 32px' }}>
        <div className="lsection-head reveal">
          <div className="lsection-tag">LIVE WALKTHROUGH</div>
          <h2 className="lsection-title">Watch one reading travel through<br />the whole system.</h2>
          <p className="lsection-sub">
            Five stages, one auto-loop. The same flow runs in the real app at{' '}
            <Link href="/app" style={{ color: 'var(--accent)' }}>VitalChain App</Link>.
          </p>
        </div>

        <div className="demo-track">
          <div className="demo-progress">
            {DEMO_STEPS.map((s, i) => (
              <span key={i} style={{ display: 'contents' }}>
                <div className={`demo-progress-step ${step >= i ? 'active' : ''}`}>{s.num}</div>
                {i < DEMO_STEPS.length - 1 && (
                  <div className="demo-progress-bar">
                    <div className="demo-progress-fill" style={{ width: step > i ? '100%' : step === i ? '60%' : '0%' }} />
                  </div>
                )}
              </span>
            ))}
            <div style={{ flex: 1 }} />
            <div className="demo-controls">
              <button className="btn xs" onClick={() => setPlaying(p => !p)}>
                {playing ? '❚❚ Pause' : '▶ Play'}
              </button>
              <button className="btn xs" onClick={() => { setStep(0); setData(d => ({ ...d, aiPartial: '', ciphertext: '7Hk2N9aB…' })); }}>
                ↺ Restart
              </button>
            </div>
          </div>

          <div className="demo-stage">
            {DEMO_STEPS.map((s, i) => (
              <div
                key={i}
                className={`demo-step ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`}
                onClick={() => { setPlaying(false); setStep(i); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="demo-step-num">{s.num} {step > i ? '✓ COMPLETE' : step === i ? '· RUNNING' : ''}</div>
                <div className="demo-step-title">{s.title}</div>
                <div className="demo-step-sub">{s.sub}</div>
                <div className="demo-step-output">{s.output(data)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes cursor { to { opacity: 0; } }`}</style>
    </section>
  );
}

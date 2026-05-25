'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Glyph from '@/components/ui/Glyph';

const HeartTrace = ({ width = 280, height = 80 }) => {
  const pathRef = useRef(null);
  const path = `M2 ${height / 2} L${width * 0.18} ${height / 2} L${width * 0.24} ${height * 0.3} L${width * 0.32} ${height * 0.85} L${width * 0.4} ${height * 0.18} L${width * 0.48} ${height / 2} L${width * 0.62} ${height / 2} L${width * 0.7} ${height * 0.32} L${width * 0.78} ${height * 0.78} L${width * 0.86} ${height * 0.22} L${width * 0.94} ${height / 2} L${width - 2} ${height / 2}`;

  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const length = p.getTotalLength();
    p.style.strokeDasharray = `${length}`;
    p.style.strokeDashoffset = `${length}`;
    const id = 'trace-anim-' + Math.random().toString(36).slice(2);
    const style = document.createElement('style');
    style.textContent = `@keyframes ${id} { from { stroke-dashoffset: ${length}; } to { stroke-dashoffset: 0; } } .${id} { animation: ${id} 2.4s linear infinite; }`;
    document.head.appendChild(style);
    p.classList.add(id);
    return () => style.remove();
  }, []);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="hr-grad" x1="0" x2="1">
          <stop offset="0" stopColor="oklch(0.82 0.17 145)" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="oklch(0.82 0.17 145)" stopOpacity="1" />
          <stop offset="1" stopColor="oklch(0.82 0.17 145)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path ref={pathRef} d={path} fill="none" stroke="url(#hr-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const CountdownCell = ({ num, label }) => (
  <div style={{
    background: 'var(--ink)', border: '1px solid var(--hairline)',
    borderRadius: 6, padding: '8px 6px', flex: 1, textAlign: 'center',
  }}>
    <div style={{ fontFamily: 'var(--font-geist-mono, "Geist Mono", monospace)', fontSize: 18, fontWeight: 500, fontFeatureSettings: '"tnum"' }}>
      {String(num).padStart(2, '0')}
    </div>
    <div style={{ fontFamily: 'var(--font-geist-mono, "Geist Mono", monospace)', fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>{label}</div>
  </div>
);

export default function Hero() {
  const [bpm, setBpm] = useState(72);
  const [now, setNow] = useState(Date.now());
  const expiresAt = useMemo(() => Date.now() + 7 * 86400000 + 4 * 3600000 + 23 * 60000, []);

  useEffect(() => {
    const t = setInterval(() => setBpm(b => Math.max(60, Math.min(82, b + Math.round((Math.random() - 0.5) * 4)))), 1400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const rem = Math.max(0, expiresAt - now);
  const d = Math.floor(rem / 86400000);
  const h = Math.floor((rem % 86400000) / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);

  return (
    <section className="lhero">
      <div className="hero-bg">
        <div className="hero-bg-grid"></div>
        <div className="hero-glow"></div>
      </div>

      <div className="lhero-grid">
        <div>
          <div className="lhero-eyebrow">
            <span className="dot"></span>
            LIVE ON SUI TESTNET · ZKLOGIN ENABLED
          </div>
          <h1 className="lhero-title">
            <span className="ln">Your health data.</span>
            <span className="ln">Your AI.</span>
            <span className="ln accent">Your chain.</span>
          </h1>
          <p className="lhero-sub">
            VitalChain is a web3-native health intelligence platform where every reading, every AI insight,
            and every share is an entity on the Arkiv blockchain — owned by your wallet, not by any platform,
            insurer, or tech company.
          </p>
          <div className="lhero-cta">
            <Link className="btn primary btn-lg" href="/app">
              <Glyph type="bolt" size={14} />
              Launch the app
            </Link>
            <button className="btn btn-lg" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              <Glyph type="activity" size={14} />
              See it work
            </button>
          </div>
          <div className="lhero-trust">
            <span>4 ENTITY TYPES</span>
            <span className="sep"></span>
            <span>AES-GCM ENCRYPTED</span>
            <span className="sep"></span>
            <span>MIT LICENSE</span>
            <span className="sep"></span>
            <span>NO SERVER REQUIRED</span>
          </div>
        </div>

        <div className="lhero-visual">
          <div className="hero-card primary">
            <div className="hero-card-head">
              <div className="row gap-sm" style={{ color: 'var(--accent)' }}>
                <Glyph type="heart_rate" size={14} />
                <span className="hero-card-label" style={{ color: 'var(--accent)' }}>HEART RATE · LIVE</span>
              </div>
              <span className="chip live accent" style={{ fontSize: 9, padding: '2px 6px' }}>STREAMING</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span className="hero-card-value">{bpm}</span>
              <span className="hero-card-unit">bpm</span>
            </div>
            <div className="hero-trace"><HeartTrace width={280} height={70} /></div>
            <div className="hero-card-meta">
              <span>$creator</span>
              <span className="accent">0x9ae3…7c21</span>
              <span style={{ marginLeft: 'auto' }}>device wallet</span>
            </div>
          </div>

          <div className="hero-card tx">
            <div className="hero-card-head">
              <span className="hero-card-label">TRANSACTION · SUI</span>
              <span className="chip accent" style={{ fontSize: 9, padding: '2px 6px' }}>CONFIRMED</span>
            </div>
            <div style={{ fontFamily: 'var(--font-geist-mono, "Geist Mono", monospace)', fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.6 }}>
              <div><span style={{ color: 'var(--text-faint)' }}>entity</span> <span className="accent">0x4f2c…a91d</span></div>
              <div><span style={{ color: 'var(--text-faint)' }}>type</span> biometric_reading</div>
              <div><span style={{ color: 'var(--text-faint)' }}>owner</span> <span style={{ color: 'var(--accent)' }}>you</span></div>
              <div><span style={{ color: 'var(--text-faint)' }}>expires</span> 365d</div>
            </div>
          </div>

          <div className="hero-card share">
            <div className="hero-card-head">
              <div className="row gap-sm"><Glyph type="share" size={12} /><span className="hero-card-label">DOCTOR SHARE</span></div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <CountdownCell num={d} label="d" />
              <CountdownCell num={h} label="h" />
              <CountdownCell num={m} label="m" />
              <CountdownCell num={s} label="s" />
            </div>
            <div style={{ fontFamily: 'var(--font-geist-mono, "Geist Mono", monospace)', fontSize: 10, color: 'var(--text-faint)', marginTop: 10, letterSpacing: '0.04em' }}>
              EXPIRES VIA expiresIn
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

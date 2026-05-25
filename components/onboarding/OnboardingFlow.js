'use client';

import { useState } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Spinner from '@/components/ui/Spinner';

const STEPS = [
  { id: 'identity', title: 'Welcome to VitalChain', subtitle: 'Step 1 of 3 — Identity' },
  { id: 'health', title: 'Health Baseline', subtitle: 'Step 2 of 3 — Optional' },
  { id: 'privacy', title: 'Your Privacy, Confirmed', subtitle: 'Step 3 of 3' },
];

const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'var(--surface-2)',
  border: '1px solid var(--hairline)', borderRadius: 8, color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em' };

const fieldWrap = { marginBottom: 16 };

export default function OnboardingFlow() {
  const { state, saveProfile, seedDemo } = useVC();
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadSample, setLoadSample] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');

  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  const toHeightCm = (val, unit) => {
    if (!val) return '';
    if (unit === 'cm') return val;
    // ft as decimal → cm
    return String(Math.round(parseFloat(val) * 30.48));
  };

  const toWeightKg = (val, unit) => {
    if (!val) return '';
    if (unit === 'kg') return val;
    return String(+(parseFloat(val) * 0.453592).toFixed(1));
  };

  const handleNext = () => {
    if (stepIdx === 0 && !name.trim()) return;
    setStepIdx(i => i + 1);
  };

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveProfile({
        name: name.trim(),
        dob,
        gender,
        heightCm: toHeightCm(heightCm, heightUnit),
        weightKg: toWeightKg(weightKg, weightUnit),
      });
      if (loadSample) {
        await seedDemo(state.wallet.address);
      }
    } catch (err) {
      console.error('Profile save failed:', err);
      setSaving(false);
    }
  };

  return (
    <div className="connect-page">
      <div className="connect-card" style={{ maxWidth: 480 }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= stepIdx ? 'var(--accent)' : 'var(--hairline-strong)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div className="connect-tag">{step.subtitle}</div>
        <div className="connect-title" style={{ fontSize: 'clamp(20px, 4vw, 28px)', marginBottom: 8 }}>{step.title}</div>

        {/* ── Step 1: Identity ── */}
        {stepIdx === 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>YOUR NAME *</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                Stored as a <span className="mono">user_profile</span> entity on Arkiv — owned by your wallet.
              </div>
            </div>

            <button
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', marginTop: 8, fontSize: 14, opacity: name.trim() ? 1 : 0.4 }}
              onClick={handleNext}
              disabled={!name.trim()}
            >
              Continue
              <Glyph type="chevron" size={14} />
            </button>
          </div>
        )}

        {/* ── Step 2: Health baseline ── */}
        {stepIdx === 1 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              This helps AI insights give you personalised context. All fields are optional — skip any you prefer not to share.
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>DATE OF BIRTH</label>
              <input style={inputStyle} type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>GENDER</label>
              <input style={inputStyle} type="text" placeholder="e.g. Male, Female, Non-binary…" value={gender} onChange={e => setGender(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>HEIGHT</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder={heightUnit === 'cm' ? '175' : '5.9'} value={heightCm} onChange={e => setHeightCm(e.target.value)} />
                  <button
                    onClick={() => setHeightUnit(u => u === 'cm' ? 'ft' : 'cm')}
                    style={{ padding: '0 10px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                  >
                    {heightUnit}
                  </button>
                </div>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>WEIGHT</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder={weightUnit === 'kg' ? '72' : '159'} value={weightKg} onChange={e => setWeightKg(e.target.value)} />
                  <button
                    onClick={() => setWeightUnit(u => u === 'kg' ? 'lbs' : 'kg')}
                    style={{ padding: '0 10px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                  >
                    {weightUnit}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center', padding: '11px 20px', fontSize: 13, color: 'var(--text-faint)' }} onClick={handleNext}>
                Skip for now
              </button>
              <button className="btn primary" style={{ flex: 2, justifyContent: 'center', padding: '11px 20px', fontSize: 14 }} onClick={handleNext}>
                Continue
                <Glyph type="chevron" size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Privacy summary ── */}
        {stepIdx === 2 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {[
                { icon: 'shield', title: 'AES-256-GCM encryption', body: 'Readings you mark as private are encrypted in your browser. Only your wallet address can derive the decryption key — no server ever sees plaintext.' },
                { icon: 'check', title: 'You own every entity', body: 'Every reading, device, and analysis is a wallet-owned entity on Arkiv. Your $owner address is the gatekeeper — revoke shares at any time.' },
                { icon: 'sparkle', title: 'No server storage', body: 'VitalChain stores nothing on its own servers. All data lives in localStorage, encrypted where you choose, with on-chain provenance anchored to your wallet.' },
              ].map(({ icon, title, body }) => (
                <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}>
                    <Glyph type={icon} size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample data toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 8, cursor: 'pointer', marginBottom: 14 }}>
              <input
                type="checkbox"
                checked={loadSample}
                onChange={e => setLoadSample(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Load 30 days of sample readings</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Pre-fills heart rate, blood pressure, SpO₂ and weight so you can explore all features right away</div>
              </div>
            </label>

            <button
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15, opacity: saving ? 0.7 : 1 }}
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? <><Spinner /> {loadSample ? 'Seeding vault…' : 'Setting up vault…'}</> : <>Start My Vault <Glyph type="bolt" size={14} /></>}
            </button>

            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.5 }} className="mono">
              BY CONTINUING YOU ACKNOWLEDGE THAT DATA IS STORED LOCALLY<br />AND ANCHORED ON SUI TESTNET VIA THE ARKIV PROTOCOL.
            </div>
          </div>
        )}

        {/* Back button for steps 2+ */}
        {stepIdx > 0 && !saving && (
          <button
            onClick={() => setStepIdx(i => i - 1)}
            style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'center' }}
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

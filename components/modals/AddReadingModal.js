'use client';

import { useState, useEffect } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

export default function AddReadingModal({ onClose, presetType }) {
  const { state, queryEntities, READING_TYPES, addReading } = useVC();
  const devices = queryEntities({ entityType: 'device', $owner: state.wallet.address });
  const [type, setType] = useState(presetType || 'heart_rate');
  const meta = READING_TYPES[type];
  const [deviceKey, setDeviceKey] = useState(devices[0]?.entityKey || '');
  const [p1, setP1] = useState(meta.defaults[0]);
  const [p2, setP2] = useState(meta.defaults[1] || '');
  const [note, setNote] = useState('');
  const [encrypt, setEncrypt] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(null);

  useEffect(() => {
    const m = READING_TYPES[type];
    setP1(m.defaults[0]);
    setP2(m.defaults[1] || '');
  }, [type]);

  const submit = async () => {
    if (!deviceKey) return;
    setSubmitting(true);
    if (encrypt) { setStep('encrypting'); await new Promise(r => setTimeout(r, 500)); }
    setStep('writing');
    await addReading({
      deviceKey,
      readingType: type,
      primaryValue: Number(p1),
      secondaryValue: p2 !== '' ? Number(p2) : null,
      note,
      encrypt,
    });
    setStep('done');
    await new Promise(r => setTimeout(r, 350));
    onClose();
  };

  if (devices.length === 0) {
    return (
      <Modal title="No devices registered" onClose={onClose} footer={<button className="btn primary" onClick={onClose}>OK</button>}>
        <div className="muted">Register a device first — readings need a device wallet as $creator.</div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Log biometric reading"
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={submitting || !deviceKey}>
            {submitting
              ? <><Spinner /> {step === 'encrypting' ? 'Encrypting AES-GCM' : step === 'writing' ? 'Writing to chain' : 'Done'}</>
              : <><Glyph type="plus" size={12} /> Write to chain</>}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label className="label">Reading type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {Object.entries(READING_TYPES).map(([k, m]) => (
              <button
                key={k}
                onClick={() => setType(k)}
                className="btn sm"
                style={{
                  justifyContent: 'flex-start',
                  borderColor: type === k ? 'var(--accent)' : 'var(--hairline-strong)',
                  color: type === k ? 'var(--accent)' : 'var(--text)',
                  background: type === k ? 'var(--accent-faint)' : 'var(--surface-2)',
                }}
              >
                <Glyph type={k} size={12} /> {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2-eq">
          <div className="field">
            <label className="label">{meta.primaryLabel} ({meta.unit})</label>
            <input type="number" step="0.1" className="input mono" value={p1} onChange={e => setP1(e.target.value)} />
          </div>
          {meta.secondaryLabel && (
            <div className="field">
              <label className="label">{meta.secondaryLabel}</label>
              <input type="number" step="0.1" className="input mono" value={p2} onChange={e => setP2(e.target.value)} />
            </div>
          )}
        </div>

        <div className="field">
          <label className="label">Device ($creator)</label>
          <select className="select" value={deviceKey} onChange={e => setDeviceKey(e.target.value)}>
            {devices.map(d => (
              <option key={d.entityKey} value={d.entityKey}>
                {d.payload?.name} — {d.$creator.slice(0, 10)}…
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Note (optional)</label>
          <textarea className="textarea input" rows="2" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. After 30-min walk" />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--hairline-strong)', borderRadius: 8, background: 'var(--ink)', cursor: 'pointer' }}>
          <input type="checkbox" checked={encrypt} onChange={e => setEncrypt(e.target.checked)} style={{ accentColor: 'oklch(0.82 0.17 145)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13 }}>Encrypt payload (AES-GCM)</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>Note + raw values encrypted in payload. Attributes (type, numeric value) stay public for queries.</div>
          </div>
          <Glyph type={encrypt ? 'lock' : 'unlock'} size={14} />
        </label>
      </div>
    </Modal>
  );
}

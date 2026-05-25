'use client';

import { useState } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import Empty from '@/components/ui/Empty';

export default function CreateShareModal({ onClose, preselectedKeys = [], onCreated }) {
  const { state, queryEntities, createShare, READING_TYPES } = useVC();
  const readings = queryEntities({ entityType: 'biometric_reading', $owner: state.wallet.address })
    .sort((a, b) => (b.attributes.find(x => x.key === 'recordedAt')?.value) - (a.attributes.find(x => x.key === 'recordedAt')?.value));
  const analyses = queryEntities({ entityType: 'ai_analysis', $owner: state.wallet.address });
  const [selected, setSelected] = useState(new Set(preselectedKeys));
  const [duration, setDuration] = useState(7);
  const [shareType, setShareType] = useState('doctor');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggle = (k) => {
    const s = new Set(selected);
    s.has(k) ? s.delete(k) : s.add(k);
    setSelected(s);
  };

  const submit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    const entity = await createShare({ entityKeys: Array.from(selected), shareType, durationDays: duration, recipientNote: note });
    setSubmitting(false);
    onCreated?.(entity);
    onClose();
  };

  const selectAll = () => setSelected(new Set([...readings.map(r => r.entityKey), ...analyses.map(a => a.entityKey)]));

  return (
    <Modal
      title="Create share"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={submitting || selected.size === 0}>
            {submitting ? <><Spinner /> Writing data_share</> : <><Glyph type="share" size={12} /> Create {duration}-day share</>}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
          A <span className="mono accent">data_share</span> entity is written with <span className="mono">expiresIn = {duration} days</span>.
          When the timer ends, Arkiv removes the entity at the protocol layer. There is no server-side delete.
        </div>

        <div className="grid-2-eq">
          <div className="field">
            <label className="label">Share with</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {['doctor', 'researcher', 'emergency'].map(t => (
                <button key={t} className="btn sm" onClick={() => setShareType(t)} style={{
                  borderColor: shareType === t ? 'var(--accent)' : 'var(--hairline-strong)',
                  color: shareType === t ? 'var(--accent)' : 'var(--text)',
                  background: shareType === t ? 'var(--accent-faint)' : 'var(--surface-2)',
                  textTransform: 'capitalize',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="label">Duration</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {[1, 7, 30].map(d => (
                <button key={d} className="btn sm" onClick={() => setDuration(d)} style={{
                  borderColor: duration === d ? 'var(--accent)' : 'var(--hairline-strong)',
                  color: duration === d ? 'var(--accent)' : 'var(--text)',
                  background: duration === d ? 'var(--accent-faint)' : 'var(--surface-2)',
                }}>{d} day{d > 1 ? 's' : ''}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label">Note to recipient</label>
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. For my appointment on Friday" />
        </div>

        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="label" style={{ margin: 0 }}>Entities to include ({selected.size} selected)</div>
            <div className="spacer" />
            <button className="btn xs ghost" onClick={selectAll}>Select all</button>
            <button className="btn xs ghost" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
          <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid var(--hairline)', borderRadius: 8 }}>
            {readings.map(r => {
              const type = r.attributes.find(a => a.key === 'readingType')?.value;
              const v1 = r.attributes.find(a => a.key === 'primaryValue')?.value;
              const v2 = r.attributes.find(a => a.key === 'secondaryValue')?.value;
              const at = r.attributes.find(a => a.key === 'recordedAt')?.value;
              const meta = READING_TYPES[type];
              const sel = selected.has(r.entityKey);
              return (
                <div key={r.entityKey} onClick={() => toggle(r.entityKey)} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 12, alignItems: 'center',
                  padding: '10px 14px', borderBottom: '1px solid var(--hairline)', cursor: 'pointer',
                  background: sel ? 'var(--accent-faint)' : 'transparent',
                }}>
                  <input type="checkbox" checked={sel} readOnly style={{ accentColor: 'oklch(0.82 0.17 145)' }} />
                  <div className="row gap-sm"><Glyph type={type} size={12} /> {meta?.label}</div>
                  <div className="mono" style={{ fontSize: 12 }}>{v1}{v2 != null && v2 !== '' ? `/${v2}` : ''} {meta?.unit}</div>
                  <div className="mono faint" style={{ fontSize: 11 }}>{new Date(at).toLocaleDateString()}</div>
                </div>
              );
            })}
            {readings.length === 0 && <Empty title="Nothing to share" />}
          </div>
        </div>
      </div>
    </Modal>
  );
}

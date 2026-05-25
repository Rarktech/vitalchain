'use client';

import { useState } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Empty from '@/components/ui/Empty';

function ReadingRow({ reading, onClick }) {
  const { READING_TYPES, relTime } = useVC();
  const type = reading.attributes.find(a => a.key === 'readingType')?.value;
  const v1 = reading.attributes.find(a => a.key === 'primaryValue')?.value;
  const v2 = reading.attributes.find(a => a.key === 'secondaryValue')?.value;
  const at = reading.attributes.find(a => a.key === 'recordedAt')?.value;
  const enc = reading.attributes.find(a => a.key === 'encrypted')?.value === 1;
  const meta = READING_TYPES[type];
  return (
    <div className="reading-row" onClick={onClick}>
      <div style={{ color: 'var(--text-mute)' }}><Glyph type={type} size={16} /></div>
      <div>
        <div className="reading-type">{meta?.label}</div>
        <div className="mono faint" style={{ fontSize: 11, marginTop: 2 }}>{reading.entityKey.slice(0, 10)}…</div>
      </div>
      <div className="reading-value">
        {v1}{v2 != null && v2 !== '' ? `/${v2}` : ''}<span className="reading-unit">{meta?.unit}</span>
      </div>
      <div>{enc ? <span className="chip warn"><Glyph type="lock" size={10} /> ENC</span> : <span className="chip"><Glyph type="unlock" size={10} /> PLAIN</span>}</div>
      <div className="reading-when">{relTime(at)} <Glyph type="chevron_right" size={11} /></div>
    </div>
  );
}

export default function VaultScreen({ navigate, openReading }) {
  const { state, queryEntities, READING_TYPES } = useVC();
  const [filter, setFilter] = useState('all');
  const readings = queryEntities({ entityType: 'biometric_reading', $owner: state.wallet.address })
    .sort((a, b) => (b.attributes.find(x => x.key === 'recordedAt')?.value) - (a.attributes.find(x => x.key === 'recordedAt')?.value));

  const filtered = filter === 'all' ? readings : readings.filter(r => r.attributes.find(a => a.key === 'readingType')?.value === filter);
  const typeFilters = Array.from(new Set(readings.map(r => r.attributes.find(a => a.key === 'readingType')?.value)));

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Health Vault</div>
          <div className="page-sub">Every reading is an entity on Arkiv. Open one to view $creator, $owner, encryption status, and the source transaction.</div>
        </div>
        <button className="btn primary" onClick={() => navigate('add')}>
          <Glyph type="plus" size={12} /> Log reading
        </button>
      </div>

      <div className="card">
        <div className="filter-row">
          <span className="muted mono" style={{ fontSize: 11 }}>FILTER</span>
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({readings.length})</button>
          {typeFilters.map(t => (
            <button key={t} className={`filter-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
              {READING_TYPES[t]?.label} ({readings.filter(r => r.attributes.find(a => a.key === 'readingType')?.value === t).length})
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <Empty title="No readings" sub="Log a reading to populate the vault" />
        ) : (
          filtered.map(r => <ReadingRow key={r.entityKey} reading={r} onClick={() => openReading(r.entityKey)} />)
        )}
      </div>
    </div>
  );
}

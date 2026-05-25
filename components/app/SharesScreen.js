'use client';

import { useState, useReducer, useEffect } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Hash from '@/components/ui/Hash';
import ExplorerLink from '@/components/ui/ExplorerLink';
import Empty from '@/components/ui/Empty';
import CreateShareModal from '@/components/modals/CreateShareModal';
import ShareSuccessModal from '@/components/modals/ShareSuccessModal';

function ShareCard({ share, onRevoke }) {
  const { fmtDate } = useVC();
  const expiresAt = share.expiresAt;
  const remaining = expiresAt - Date.now();
  const total = share.expiresInDays * 86400000;
  const pct = Math.max(0, Math.min(1, remaining / total));
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${share.entityKey}?key=${share.payload.accessKey}`
    : '';
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const tone = pct < 0.1 ? 'danger' : pct < 0.3 ? 'warn' : '';
  const shareType = share.attributes.find(a => a.key === 'shareType')?.value;
  const note = share.payload?.recipientNote;

  return (
    <div className="card">
      <div className="card-head">
        <div className="row gap-sm">
          <span className={`chip ${tone || 'accent'}`} style={{ textTransform: 'uppercase' }}>{shareType}</span>
          <div className="muted mono" style={{ fontSize: 11 }}>{share.payload?.entityKeys?.length || 0} entities</div>
        </div>
        <span className="chip live accent">ACTIVE</span>
      </div>
      <div className="card-body">
        {note && <div style={{ fontSize: 13, marginBottom: 14 }}>{note}</div>}
        <div className={`countdown ${tone}`}>
          <div className="countdown-unit"><div className="countdown-num">{String(Math.max(0, days)).padStart(2, '0')}</div><div className="countdown-label">days</div></div>
          <div className="countdown-unit"><div className="countdown-num">{String(Math.max(0, hours)).padStart(2, '0')}</div><div className="countdown-label">hrs</div></div>
          <div className="countdown-unit"><div className="countdown-num">{String(Math.max(0, mins)).padStart(2, '0')}</div><div className="countdown-label">min</div></div>
          <div className="countdown-unit"><div className="countdown-num">{String(Math.max(0, secs)).padStart(2, '0')}</div><div className="countdown-label">sec</div></div>
        </div>
        <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 999, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: tone === 'danger' ? 'oklch(0.7 0.2 25)' : tone === 'warn' ? 'var(--warn)' : 'var(--accent)', transition: 'width 500ms' }} />
        </div>
        <div className="muted mono" style={{ fontSize: 11, marginTop: 8 }}>EXPIRES {fmtDate(expiresAt)}</div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <input className="input mono" style={{ fontSize: 10 }} value={shareUrl} readOnly />
          <button className="btn sm" onClick={copy}>{copied ? <Glyph type="check" size={11} /> : <Glyph type="copy" size={11} />}</button>
        </div>
      </div>
      <div className="card-foot">
        <Hash value={share.entityKey} n={6} label="entity" />
        <div className="row gap-sm">
          <ExplorerLink entityKey={share.entityKey} />
          <button className="btn xs danger" onClick={onRevoke}><Glyph type="trash" size={11} /> Revoke</button>
        </div>
      </div>
    </div>
  );
}

export default function SharesScreen({ navigate }) {
  const { state, queryEntities, revokeShare } = useVC();
  const shares = queryEntities({ entityType: 'data_share', $owner: state.wallet.address });
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState(null);
  const [, force] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const t = setInterval(force, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Active shares</div>
          <div className="page-sub">Each share is an entity on Arkiv with <span className="mono accent">expiresIn</span> set to the duration you chose. The entity self-destructs at the protocol layer.</div>
        </div>
        <button className="btn primary" onClick={() => setShowCreate(true)}>
          <Glyph type="share" size={12} /> Create share
        </button>
      </div>

      {shares.length === 0 ? (
        <Empty
          icon="share"
          title="No active shares"
          sub="Create one to grant a doctor or researcher time-limited read access"
          action={<button className="btn primary" onClick={() => setShowCreate(true)}>Create share</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {shares.map(s => <ShareCard key={s.entityKey} share={s} onRevoke={() => revokeShare(s.entityKey)} />)}
        </div>
      )}

      {showCreate && <CreateShareModal onClose={() => setShowCreate(false)} onCreated={setSuccess} />}
      {success && <ShareSuccessModal entity={success} onClose={() => setSuccess(null)} navigate={navigate} />}
    </div>
  );
}

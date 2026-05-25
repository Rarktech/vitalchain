'use client';

import { useState, useReducer, useEffect } from 'react';
import { useVC } from '@/lib/store';
import { arkivLoadByKey } from '@/lib/arkiv';
import Glyph from '@/components/ui/Glyph';
import Hash from '@/components/ui/Hash';
import Empty from '@/components/ui/Empty';

export default function ShareRecipientView({ shareKey, accessKey }) {
  const { state, READING_TYPES, fmtDate } = useVC();
  const [, force] = useReducer(x => x + 1, 0);
  const [chainShare, setChainShare] = useState(null);
  const [chainEntities, setChainEntities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tick countdown every second
  useEffect(() => {
    const t = setInterval(force, 1000);
    return () => clearInterval(t);
  }, []);

  // Try local cache first, then fall back to chain query (enables cross-browser sharing)
  useEffect(() => {
    const localShare = state.entities[shareKey];
    if (localShare) {
      const localRefs = (localShare.payload?.entityKeys || []).map(k => state.entities[k]).filter(Boolean);
      setChainShare(localShare);
      setChainEntities(localRefs);
      setLoading(false);
      return;
    }
    // Not in local cache — query Arkiv chain (works cross-browser)
    arkivLoadByKey(shareKey).then(async (share) => {
      if (!share) { setLoading(false); return; }
      setChainShare(share);
      const keys = share.payload?.entityKeys || [];
      const entities = await Promise.all(keys.map(k => arkivLoadByKey(k)));
      setChainEntities(entities.filter(Boolean));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shareKey, state.entities]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="mono faint" style={{ fontSize: 12 }}>Fetching from Arkiv chain…</div>
        </div>
      </div>
    );
  }

  const share = chainShare;

  if (!share) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div className="card" style={{ maxWidth: 520, padding: 40, textAlign: 'center' }}>
          <Glyph type="lock" size={32} />
          <div style={{ fontSize: 18, marginTop: 14, fontWeight: 500 }}>Share expired or revoked</div>
          <div className="muted" style={{ marginTop: 6 }}>
            This share's <span className="mono accent">data_share</span> entity no longer exists on Arkiv. Enforced at the protocol layer.
          </div>
        </div>
      </div>
    );
  }

  if (share.payload.accessKey !== accessKey) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div className="card" style={{ maxWidth: 520, padding: 40, textAlign: 'center' }}>
          <Glyph type="lock" size={32} />
          <div style={{ fontSize: 18, marginTop: 14 }}>Invalid access key</div>
        </div>
      </div>
    );
  }

  const remaining = share.expiresAt - Date.now();
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const entities = chainEntities;
  const grantor = share.attributes.find(a => a.key === 'grantedBy')?.value;
  const shareType = share.attributes.find(a => a.key === 'shareType')?.value;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div className="brand-mark" style={{ width: 18, height: 18 }}></div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>VITALCHAIN · SHARED VIEW</span>
        </div>
        <div className="page-title">Patient health data</div>
        <div className="page-sub">
          Shared by <Hash value={grantor} /> as a <b style={{ color: 'var(--text)' }}>{shareType}</b> share.
          You don't need a wallet — the access key in your URL grants read access until the entity expires.
        </div>

        <div className="card mt-6">
          <div className="card-head">
            <div className="card-title">Access window — auto-expiry</div>
            <span className={`chip ${remaining < 3600000 ? 'warn' : 'accent'}`}>{remaining > 0 ? 'ACTIVE' : 'EXPIRED'}</span>
          </div>
          <div className="card-body">
            <div className="countdown">
              <div className="countdown-unit"><div className="countdown-num">{String(Math.max(0, days)).padStart(2, '0')}</div><div className="countdown-label">days</div></div>
              <div className="countdown-unit"><div className="countdown-num">{String(Math.max(0, hours)).padStart(2, '0')}</div><div className="countdown-label">hrs</div></div>
              <div className="countdown-unit"><div className="countdown-num">{String(Math.max(0, mins)).padStart(2, '0')}</div><div className="countdown-label">min</div></div>
              <div className="countdown-unit"><div className="countdown-num">{String(Math.max(0, secs)).padStart(2, '0')}</div><div className="countdown-label">sec</div></div>
            </div>
            <div className="muted mono" style={{ fontSize: 11, marginTop: 10 }}>
              UNTIL {fmtDate(share.expiresAt)} · ENFORCED BY ARKIV expiresIn
            </div>
            {share.payload.recipientNote && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
                "{share.payload.recipientNote}"
              </div>
            )}
          </div>
        </div>

        <div className="section-head"><div className="section-title">Shared entities ({entities.length})</div></div>
        <div className="card">
          {entities.map(e => {
            if (e.entityType === 'biometric_reading') {
              const type = e.attributes.find(a => a.key === 'readingType')?.value;
              const v1 = e.attributes.find(a => a.key === 'primaryValue')?.value;
              const v2 = e.attributes.find(a => a.key === 'secondaryValue')?.value;
              const at = e.attributes.find(a => a.key === 'recordedAt')?.value;
              const meta = READING_TYPES[type];
              return (
                <div key={e.entityKey} className="reading-row" style={{ cursor: 'default' }}>
                  <div><Glyph type={type} size={16} /></div>
                  <div>
                    <div className="reading-type">{meta?.label}</div>
                    <div className="mono faint" style={{ fontSize: 11, marginTop: 2 }}>signed by device {String(e.$creator).slice(0, 10)}…</div>
                  </div>
                  <div className="reading-value">{v1}{v2 != null && v2 !== '' ? `/${v2}` : ''}<span className="reading-unit">{meta?.unit}</span></div>
                  <div>{meta?.normal && (v1 >= meta.normal[0] && v1 <= meta.normal[1] ? <span className="pill ok">in range</span> : <span className="pill warn">out of range</span>)}</div>
                  <div className="reading-when mono">{fmtDate(at)}</div>
                </div>
              );
            }
            if (e.entityType === 'ai_analysis') {
              return (
                <div key={e.entityKey} style={{ padding: '16px 18px', borderBottom: '1px solid var(--hairline)' }}>
                  <div className="row gap-sm" style={{ marginBottom: 6 }}>
                    <Glyph type="sparkle" size={12} />
                    <span className="mono faint" style={{ fontSize: 11 }}>AI ANALYSIS · {e.payload?.trend?.toUpperCase()}</span>
                  </div>
                  <div className="insight-q" style={{ fontSize: 13, marginBottom: 8 }}>{e.payload?.question}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-mute)', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{
                    __html: (e.payload?.analysis || '')
                      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                      .replace(/^#{1,6}\s+(.+)$/gm, '<strong style="color:var(--text);display:block;margin-top:8px">$1</strong>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
                  }} />
                </div>
              );
            }
            return null;
          })}
          {entities.length === 0 && <Empty title="No entities" sub="The share is empty" />}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', color: 'var(--text-faint)', fontSize: 11 }} className="mono">
          ALL DATA SOURCED FROM ARKIV BRAGA · PROJECT vitalchain_ethns_arkiv_v1 · INDEPENDENTLY VERIFIABLE
        </div>
      </div>
    </div>
  );
}

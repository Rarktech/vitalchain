'use client';

import { useState } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Hash from '@/components/ui/Hash';
import ExplorerLink from '@/components/ui/ExplorerLink';
import Spinner from '@/components/ui/Spinner';
import Empty from '@/components/ui/Empty';

export default function ReadingDetail({ entityKey, onBack, onShare }) {
  const { state, READING_TYPES, fmtDate, decryptReading } = useVC();
  const entity = state.entities[entityKey];
  const [decrypted, setDecrypted] = useState(null);
  const [decrypting, setDecrypting] = useState(false);

  if (!entity) {
    return (
      <div>
        <div className="topbar"><div className="page-title">Reading not found</div></div>
        <Empty title="Entity removed or expired" />
      </div>
    );
  }

  const type = entity.attributes.find(a => a.key === 'readingType')?.value;
  const meta = READING_TYPES[type];
  const v1 = entity.attributes.find(a => a.key === 'primaryValue')?.value;
  const v2 = entity.attributes.find(a => a.key === 'secondaryValue')?.value;
  const at = entity.attributes.find(a => a.key === 'recordedAt')?.value;
  const enc = entity.attributes.find(a => a.key === 'encrypted')?.value === 1;
  const deviceKey = entity.attributes.find(a => a.key === 'deviceId')?.value;
  const device = state.entities[deviceKey];

  const decrypt = async () => {
    setDecrypting(true);
    await new Promise(r => setTimeout(r, 600));
    const payload = await decryptReading(entity);
    setDecrypted(payload);
    setDecrypting(false);
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <a className="muted" style={{ fontSize: 12, cursor: 'pointer' }} onClick={onBack}>← Health Vault</a>
          <div className="page-title" style={{ marginTop: 4 }}>
            <Glyph type={type} size={20} /> {meta?.label}
          </div>
          <div className="page-sub mono" style={{ fontSize: 12 }}>entity {entity.entityKey}</div>
        </div>
        <div className="row gap-sm">
          <button className="btn" onClick={() => onShare([entity.entityKey])}><Glyph type="share" size={12} /> Share</button>
          <ExplorerLink entityKey={entity.entityKey} label="View on explorer" />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Reading values</div>
            <span className={enc ? 'chip warn' : 'chip'}>
              {enc ? <><Glyph type="lock" size={10} /> ENCRYPTED PAYLOAD</> : <><Glyph type="unlock" size={10} /> PLAIN PAYLOAD</>}
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div className="mono" style={{ fontSize: 48, letterSpacing: '-0.02em', fontWeight: 500 }}>
                {v1}{v2 != null && v2 !== '' && <span style={{ color: 'var(--text-mute)' }}>/</span>}{v2 != null && v2 !== '' && v2}
              </div>
              <div className="mono muted" style={{ fontSize: 18 }}>{meta?.unit}</div>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{fmtDate(at)}</div>

            {meta?.normal && (
              <div style={{ marginTop: 18 }}>
                <div className="label" style={{ marginBottom: 6 }}>Normal range</div>
                <div className="row gap-sm">
                  <div className="mono" style={{ fontSize: 13 }}>{meta.normal[0]} — {meta.normal[1]} {meta.unit}</div>
                  {v1 >= meta.normal[0] && v1 <= meta.normal[1]
                    ? <span className="pill ok"><Glyph type="check" size={10} /> Within range</span>
                    : <span className="pill warn">Outside range</span>}
                </div>
              </div>
            )}

            <div className="hr" />
            <div className="label" style={{ marginBottom: 8 }}>Payload (raw from Arkiv)</div>
            {enc && !decrypted ? (
              <>
                <div className="enc-blob">{JSON.stringify({ encrypted: true, ciphertext: entity.payload.ciphertext.slice(0, 220) + '…' })}</div>
                <button className="btn sm mt-2" onClick={decrypt} disabled={decrypting}>
                  {decrypting ? <><Spinner /> Deriving key from wallet</> : <><Glyph type="unlock" size={12} /> Decrypt with wallet</>}
                </button>
              </>
            ) : (
              <div className="enc-blob">{JSON.stringify(decrypted || entity.payload, null, 2)}</div>
            )}
            {decrypted && <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>↑ Decrypted locally. Never sent to a server.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">On-chain metadata</div></div>
          <div className="card-body">
            <dl className="kv">
              <dt>Entity type</dt>
              <dd><span className="chip">biometric_reading</span></dd>
              <dt>$creator</dt>
              <dd>
                <Hash value={entity.$creator} />
                <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>{device?.payload?.name || 'Device wallet'} · immutable</div>
              </dd>
              <dt>$owner</dt>
              <dd>
                <Hash value={entity.$owner} />
                <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>Your wallet · mutable</div>
              </dd>
              <dt>Transaction</dt>
              <dd><Hash value={entity.txHash} n={8} /></dd>
              <dt>Created</dt>
              <dd className="mono" style={{ fontSize: 12 }}>{fmtDate(entity.createdAt)}</dd>
              <dt>Expires</dt>
              <dd className="mono" style={{ fontSize: 12 }}>{fmtDate(entity.expiresAt)} <span className="muted">· {entity.expiresInDays}d</span></dd>
            </dl>

            <div className="hr" />
            <div className="label" style={{ marginBottom: 8 }}>Attributes (public, queryable)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {entity.attributes.map((a, i) => (
                <span key={i} className="chip" style={{ fontSize: 10 }}>
                  <span className="muted">{a.key}</span>
                  <span style={{ marginLeft: 4 }}>{String(a.value).length > 16 ? String(a.value).slice(0, 16) + '…' : String(a.value)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

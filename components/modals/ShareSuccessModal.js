'use client';

import { useState } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Modal from '@/components/ui/Modal';
import Hash from '@/components/ui/Hash';

export default function ShareSuccessModal({ entity, onClose, navigate }) {
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${entity.entityKey}?key=${entity.payload.accessKey}`
    : '';
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal
      title="Share created"
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Close</button>
          <button className="btn primary" onClick={() => navigate('shares')}>View all shares</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="row gap-sm">
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-faint)', border: '1px solid oklch(0.82 0.17 145 / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Glyph type="check" size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>data_share entity written to chain</div>
            <Hash value={entity.entityKey} n={8} />
          </div>
        </div>

        <div className="field">
          <div className="label">Share URL</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input mono" style={{ fontSize: 11 }} value={shareUrl} readOnly />
            <button className="btn" onClick={copy}>
              {copied ? <><Glyph type="check" size={12} /> Copied</> : <><Glyph type="copy" size={12} /> Copy</>}
            </button>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>Doctor opens this URL — no wallet required. Access key in the URL query string.</div>
        </div>

        <div style={{ background: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '14px 16px' }}>
          <div className="row gap-sm" style={{ marginBottom: 8 }}>
            <Glyph type="lock" size={14} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>Auto-expiry at protocol layer</div>
          </div>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            After {entity.expiresInDays} day{entity.expiresInDays > 1 ? 's' : ''}, the data_share entity is removed by Arkiv.
            No revoke endpoint. No remember-to-delete. The TTL is the cryptographic enforcement.
          </div>
        </div>
      </div>
    </Modal>
  );
}

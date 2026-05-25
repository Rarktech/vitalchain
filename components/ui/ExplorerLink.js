'use client';

import { useVC } from '@/lib/store';
import Glyph from './Glyph';

export default function ExplorerLink({ entityKey, txHash, label = 'View on explorer' }) {
  const { EXPLORER_BASE } = useVC();
  const url = entityKey ? `${EXPLORER_BASE}/entity/${entityKey}` : `${EXPLORER_BASE}/tx/${txHash}`;
  return (
    <a className="btn xs ghost" href={url} target="_blank" rel="noreferrer"
      onClick={(e) => { e.preventDefault(); window.open(url, '_blank'); }}>
      <Glyph type="external" size={11} /> {label}
    </a>
  );
}

'use client';

import { useState } from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Hash from '@/components/ui/Hash';
import Toasts from '@/components/ui/Toasts';
import Dashboard from './Dashboard';
import VaultScreen from './VaultScreen';
import DevicesScreen from './DevicesScreen';
import InsightsScreen from './InsightsScreen';
import SharesScreen from './SharesScreen';
import VerifyScreen from './VerifyScreen';
import AddReadingModal from '@/components/modals/AddReadingModal';
import CreateShareModal from '@/components/modals/CreateShareModal';
import ShareSuccessModal from '@/components/modals/ShareSuccessModal';

const SIDEBAR = [
  { section: 'Main' },
  { id: 'dashboard', label: 'Dashboard', icon: 'activity' },
  { id: 'vault', label: 'Health Vault', icon: 'shield' },
  { id: 'devices', label: 'Devices', icon: 'device' },
  { section: 'Intelligence' },
  { id: 'insights', label: 'AI Insights', icon: 'sparkle' },
  { section: 'Sharing' },
  { id: 'shares', label: 'Active Shares', icon: 'share' },
  { section: 'Trust' },
  { id: 'verify', label: 'Independent Verify', icon: 'check' },
];

const accentMap = {
  'vital-green': { accent: 'oklch(0.82 0.17 145)', faint: 'oklch(0.82 0.17 145 / 0.08)', dim: 'oklch(0.82 0.17 145 / 0.16)' },
  'electric-cyan': { accent: 'oklch(0.82 0.16 200)', faint: 'oklch(0.82 0.16 200 / 0.08)', dim: 'oklch(0.82 0.16 200 / 0.16)' },
  'plasma-violet': { accent: 'oklch(0.78 0.18 295)', faint: 'oklch(0.78 0.18 295 / 0.08)', dim: 'oklch(0.78 0.18 295 / 0.16)' },
  'signal-amber': { accent: 'oklch(0.82 0.17 75)', faint: 'oklch(0.82 0.17 75 / 0.08)', dim: 'oklch(0.82 0.17 75 / 0.16)' },
};

export default function AppShell() {
  const { state, disconnectWallet } = useVC();

  const { data: balData } = useSuiClientQuery(
    'getBalance',
    { owner: state.wallet?.address, coinType: '0x2::sui::SUI' },
    { enabled: !!state.wallet?.address }
  );
  const suiBalance = balData
    ? (Number(balData.totalBalance) / 1e9).toFixed(4) + ' SUI'
    : '— SUI';
  const [page, setPage] = useState('dashboard');
  const [readingDetail, setReadingDetail] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showShareCreate, setShowShareCreate] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accent, setAccent] = useState('vital-green');

  const navigate = (p) => {
    if (p === 'add') { setShowAdd(true); return; }
    setPage(p);
    setReadingDetail(null);
    setSidebarOpen(false);
  };

  const openReading = (key) => setReadingDetail(key);

  const applyAccent = (name) => {
    setAccent(name);
    const c = accentMap[name] || accentMap['vital-green'];
    document.documentElement.style.setProperty('--accent', c.accent);
    document.documentElement.style.setProperty('--accent-faint', c.faint);
    document.documentElement.style.setProperty('--accent-dim', c.dim);
  };

  const counts = state.wallet ? {
    vault: Object.values(state.entities).filter(e => e.entityType === 'biometric_reading' && e.$owner === state.wallet.address).length,
    devices: Object.values(state.entities).filter(e => e.entityType === 'device' && e.$owner === state.wallet.address).length,
    insights: Object.values(state.entities).filter(e => e.entityType === 'ai_analysis' && e.$owner === state.wallet.address).length,
    shares: Object.values(state.entities).filter(e => e.entityType === 'data_share' && e.$owner === state.wallet.address).length,
  } : {};

  let content;
  if (readingDetail) {
    const ReadingDetail = require('./ReadingDetail').default;
    content = <ReadingDetail entityKey={readingDetail} onBack={() => setReadingDetail(null)} onShare={(keys) => setShowShareCreate(keys)} />;
  } else if (page === 'dashboard') content = <Dashboard navigate={navigate} />;
  else if (page === 'vault') content = <VaultScreen navigate={navigate} openReading={openReading} />;
  else if (page === 'devices') content = <DevicesScreen navigate={navigate} />;
  else if (page === 'insights') content = <InsightsScreen navigate={navigate} />;
  else if (page === 'shares') content = <SharesScreen navigate={navigate} />;
  else if (page === 'verify') content = <VerifyScreen />;

  return (
    <div className="app">
      {/* Mobile header */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <div className="brand">
          <div className="brand-mark"></div>
          <div className="brand-name">VitalChain</div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand" style={{ paddingBottom: 8 }}>
          <div className="brand-mark"></div>
          <div>
            <div className="brand-name">VitalChain</div>
            <div className="brand-tag mono">Sui Testnet · v1</div>
          </div>
        </div>

        <div className="nav">
          {SIDEBAR.map((item, i) => item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <Glyph type={item.icon} size={14} />
              <span>{item.label}</span>
              {counts[item.id] != null && counts[item.id] > 0 && (
                <span className="nav-meta">{counts[item.id]}</span>
              )}
            </div>
          ))}
        </div>

        <div className="spacer" />

        {/* Accent switcher */}
        <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.keys(accentMap).map(name => (
            <button
              key={name}
              title={name}
              onClick={() => applyAccent(name)}
              style={{
                width: 16, height: 16, borderRadius: '50%', border: accent === name ? '2px solid var(--text)' : '2px solid transparent',
                background: accentMap[name].accent, cursor: 'pointer', padding: 0,
              }}
            />
          ))}
        </div>

        {state.wallet && (
          <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--hairline)', margin: '0 0 8px' }}>
            <div className="muted" style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Connected wallet</div>
            <div className="row gap-sm" style={{ marginTop: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}></div>
              <Hash value={state.wallet.address} n={6} />
            </div>
            <div className="muted mono" style={{ fontSize: 11, marginTop: 6 }}>{suiBalance}</div>
            <button className="btn xs ghost" style={{ marginTop: 8, width: '100%', justifyContent: 'flex-start' }} onClick={disconnectWallet}>
              Disconnect
            </button>
          </div>
        )}
      </aside>

      <main className="main">
        {content}
      </main>

      {showAdd && <AddReadingModal onClose={() => setShowAdd(false)} />}
      {showShareCreate && <CreateShareModal onClose={() => setShowShareCreate(null)} preselectedKeys={showShareCreate} onCreated={setShareSuccess} />}
      {shareSuccess && <ShareSuccessModal entity={shareSuccess} onClose={() => setShareSuccess(null)} navigate={navigate} />}

      <Toasts />
    </div>
  );
}

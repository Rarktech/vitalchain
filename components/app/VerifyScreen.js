'use client';

import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Hash from '@/components/ui/Hash';
import ExplorerLink from '@/components/ui/ExplorerLink';

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function VerifyScreen() {
  const { state, PROJECT_ATTRIBUTE, EXPLORER_BASE, BRAGA_CHAIN_ID, queryEntities } = useVC();
  const counts = {
    device: queryEntities({ entityType: 'device' }).length,
    biometric_reading: queryEntities({ entityType: 'biometric_reading' }).length,
    ai_analysis: queryEntities({ entityType: 'ai_analysis' }).length,
    data_share: queryEntities({ entityType: 'data_share' }).length,
  };

  const codeBlock = (s) => s
    .replace(/\b(import|from|const|await|new|function|return|let|if|else)\b/g, '<span class="kw">$1</span>')
    .replace(/'([^']*)'/g, "<span class=\"str\">'$1'</span>")
    .replace(/\b(\d+)\b/g, '<span class="num">$1</span>')
    .replace(/(\/\/.*$)/gm, '<span class="com">$1</span>');

  const snippet1 = `import { createPublicClient, http } from '@arkiv-network/sdk';
import { braga } from '@arkiv-network/sdk/chains';
import { eq, gte } from '@arkiv-network/sdk/query';

const c = createPublicClient({ chain: braga, transport: http() });

// Query all biometric readings owned by patient, last 30 days
const r = await c.buildQuery()
  .where([
    eq('project', '${PROJECT_ATTRIBUTE}'),
    eq('entityType', 'biometric_reading'),
    gte('recordedAt', Date.now() - 30 * 86400000),
  ])
  .ownedBy('${state.wallet?.address}')
  .orderBy('recordedAt', 'number', 'desc')
  .withPayload(true).withAttributes(true)
  .limit(30).fetch();

console.log(r.entities);`;

  const snippet2 = `// Query AI analyses created by AI orchestrator,
// owned by the patient (proves $owner = patient, not AI vendor)
const a = await c.buildQuery()
  .where([
    eq('project', '${PROJECT_ATTRIBUTE}'),
    eq('entityType', 'ai_analysis'),
  ])
  .ownedBy('${state.wallet?.address}')
  .createdBy('${state.aiOrchestrator}')
  .orderBy('generatedAt', 'number', 'desc')
  .limit(10).fetch();`;

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Independent verify</div>
          <div className="page-sub">VitalChain is not the source of truth — Arkiv is. Anyone with the queries below can confirm every entity exists without our app, our server, or our consent.</div>
        </div>
        <ExplorerLink label="Open Braga explorer" />
      </div>

      <div className="stat-grid">
        <Stat label="Device entities" value={counts.device} />
        <Stat label="Biometric readings" value={counts.biometric_reading} />
        <Stat label="AI analyses" value={counts.ai_analysis} />
        <Stat label="Data shares" value={counts.data_share} />
      </div>

      <div className="card mt-6">
        <div className="card-head"><div className="card-title">Network configuration</div></div>
        <div className="card-body">
          <dl className="kv">
            <dt>Chain ID</dt><dd className="mono">{BRAGA_CHAIN_ID}</dd>
            <dt>RPC</dt><dd className="mono">https://braga.hoodi.arkiv.network/rpc</dd>
            <dt>Explorer</dt><dd className="mono">{EXPLORER_BASE}</dd>
            <dt>PROJECT_ATTRIBUTE</dt><dd><span className="chip accent mono">{PROJECT_ATTRIBUTE}</span></dd>
            <dt>Patient wallet ($owner)</dt><dd><Hash value={state.wallet?.address} /></dd>
            <dt>AI orchestrator ($creator on ai_analysis)</dt><dd><Hash value={state.aiOrchestrator} /></dd>
          </dl>
        </div>
      </div>

      <div className="section-head"><div className="section-title">Query 1 — Read your readings without VitalChain</div></div>
      <pre className="code" dangerouslySetInnerHTML={{ __html: codeBlock(snippet1) }} />

      <div className="section-head"><div className="section-title">Query 2 — Verify AI analyses with two-creator model</div></div>
      <pre className="code" dangerouslySetInnerHTML={{ __html: codeBlock(snippet2) }} />

      <div className="card mt-6" style={{ padding: '18px 22px' }}>
        <div className="row gap-sm" style={{ marginBottom: 8 }}><Glyph type="shield" size={14} /><div style={{ fontWeight: 500 }}>Why this matters</div></div>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          Run the snippets above against the Braga RPC from any environment. The data is the same — because the data is not ours.
          We are an interface to the chain, not the keeper of the records.
        </div>
      </div>
    </div>
  );
}

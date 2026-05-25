'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Glyph from '@/components/ui/Glyph';

function useReveal(sel) {
  useEffect(() => {
    const els = document.querySelectorAll(sel);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } }),
      { threshold: 0.2 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sel]);
}

export function Pillars() {
  useReveal('#features .pillar');
  return (
    <section className="lsection" id="features">
      <div className="lsection-head reveal in">
        <div className="lsection-tag">THE THREE PROMISES</div>
        <h2 className="lsection-title">Three architectural commitments<br />that platforms can't match.</h2>
        <p className="lsection-sub">
          Apple owns your heart rate. Fitbit owns your sleep. Your GP owns your records.
          VitalChain inverts this with three structural guarantees baked into the chain itself.
        </p>
      </div>
      <div className="pillars">
        <div className="pillar reveal">
          <div className="pillar-glyph"><Glyph type="device" size={20} /></div>
          <div className="pillar-tag">DePIN</div>
          <h3 className="pillar-title">Devices sign their own data.</h3>
          <p className="pillar-sub">
            Each device has its own wallet. The device wallet is the immutable <span className="mono accent">$creator</span> of every reading it produces — cryptographic provenance that a platform can't fake or rewrite.
          </p>
          <ul className="pillar-bullets">
            <li>Per-device wallet identity</li>
            <li>Tamper-evident at the chain level</li>
            <li>Insurance & research grade</li>
          </ul>
        </div>
        <div className="pillar reveal">
          <div className="pillar-glyph"><Glyph type="lock" size={20} /></div>
          <div className="pillar-tag">PRIVACY</div>
          <h3 className="pillar-title">Encrypted before it leaves the browser.</h3>
          <p className="pillar-sub">
            AES-GCM with a 256-bit key derived from your wallet signature. Public attributes stay queryable for ranges; the actual values are sealed in ciphertext.
          </p>
          <ul className="pillar-bullets">
            <li>PBKDF2 100k iterations · SHA-256</li>
            <li>Web Crypto, no server in the loop</li>
            <li>Structure public, content private</li>
          </ul>
        </div>
        <div className="pillar reveal">
          <div className="pillar-glyph"><Glyph type="sparkle" size={20} /></div>
          <div className="pillar-tag">AI</div>
          <h3 className="pillar-title">AI reads the chain, writes it back.</h3>
          <p className="pillar-sub">
            The AI orchestrator queries your readings, generates an analysis, and writes a new <span className="mono accent">ai_analysis</span> entity owned by your wallet — not by the AI vendor.
          </p>
          <ul className="pillar-bullets">
            <li>Insights as wallet-owned entities</li>
            <li>Live Arkiv queries every session</li>
            <li>Portable across AI providers</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Numbers() {
  useReveal('.bignum');
  return (
    <section className="lsection tight">
      <div className="bignums">
        {[
          { value: '4', label: 'Entity types', sub: 'Device · Reading · Analysis · Share' },
          { value: '256bit', label: 'AES-GCM keys', sub: 'PBKDF2 100k iterations', special: true },
          { value: '11', label: 'Health silos avg.', sub: 'that VitalChain replaces' },
          { value: '∞', label: 'Apps can read it', sub: 'createPublicClient · open spec' },
        ].map((item, i) => (
          <div key={i} className="bignum reveal">
            <div className="bignum-value accent">
              {item.special ? <>256<span style={{ fontSize: 24, color: 'var(--text-mute)' }}>bit</span></> : item.value}
            </div>
            <div className="bignum-label">{item.label}</div>
            <div className="bignum-sub">{item.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EntityModel() {
  useReveal('#arkiv .entity-card');
  useReveal('#arkiv .reveal');
  return (
    <section className="lsection" id="arkiv">
      <div className="lsection-head reveal">
        <div className="lsection-tag">ARKIV ARCHITECTURE</div>
        <h2 className="lsection-title">Four entities. One namespace.<br />Every value typed for queries.</h2>
        <p className="lsection-sub">
          Every entity is stamped with <span className="mono accent">project = vitalchain_ethns_arkiv_v1</span>, then filtered by entity type. Numeric attributes stay plaintext so range queries work; the rest is encrypted payload.
        </p>
      </div>
      <div className="entity-grid">
        {[
          { icon: 'device', name: 'Device', desc: 'A physical or virtual monitor. Self-owned wallet acts as $creator for every reading it signs.', rows: [['$creator', 'device wallet', true], ['$owner', 'device wallet', true], ['expiresIn', '365 days', false], ['payload', 'name, model, fw', false]] },
          { icon: 'activity', name: 'BiometricReading', desc: 'One entity per measurement. Device is $creator; patient is $owner.', rows: [['$creator', 'device wallet', false], ['$owner', 'patient wallet', true], ['attributes', 'type, value, recordedAt', false], ['payload', 'AES-GCM ciphertext', false]] },
          { icon: 'sparkle', name: 'AIAnalysis', desc: 'Insight written by the AI orchestrator after reading your data. Owned by you.', rows: [['$creator', 'AI orchestrator', false], ['$owner', 'patient wallet', true], ['attributes', 'model, trend, readingCount', false], ['payload', 'question, analysis, recs', false]] },
          { icon: 'share', name: 'DataShare', desc: 'Time-limited grant. Self-destructs at the Arkiv protocol layer — not by server policy.', rows: [['$owner', 'patient wallet', true], ['expiresIn', '1 / 7 / 30 days', true], ['attributes', 'shareType, durationDays', false], ['payload', 'entity keys + accessKey', false]] },
        ].map((card) => (
          <div key={card.name} className="entity-card reveal">
            <div className="row gap-sm" style={{ marginBottom: 12, color: 'var(--accent)' }}>
              <Glyph type={card.icon} size={14} />
              <span className="entity-card-name">{card.name}</span>
            </div>
            <p className="entity-card-desc">{card.desc}</p>
            {card.rows.map(([k, v, accent]) => (
              <div key={k} className="entity-row">
                <span className="entity-row-key">{k}</span>
                <span className={`entity-row-val ${accent ? 'accent' : ''}`}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Problem() {
  useReveal('#how .silo, #how .you-own, #how .reveal');
  return (
    <section className="lsection" id="how">
      <div className="lsection-head reveal">
        <div className="lsection-tag">THE PROBLEM</div>
        <h2 className="lsection-title">Today, your health data is everywhere<br />except in your hands.</h2>
        <p className="lsection-sub">
          The average person's health record spans 11 disconnected systems. Switch providers, lose history. Move countries, lose history. Want an AI to see the whole picture? Impossible — every silo is walled.
        </p>
      </div>
      <div className="problem">
        <div className="problem-vis">
          {[
            { label: 'Hospital EHR', style: { top: '0%', left: '10%' } },
            { label: 'Apple Health', style: { top: '12%', right: '8%' } },
            { label: 'Fitbit', style: { top: '30%', left: '4%' } },
            { label: 'MyFitnessPal', style: { top: '42%', right: '18%' } },
            { label: 'Pharmacy app', style: { top: '60%', left: '14%' } },
            { label: 'Withings cloud', style: { top: '72%', right: '4%' } },
            { label: 'GP portal', style: { top: '88%', left: '24%' } },
          ].map(({ label, style }) => (
            <div key={label} className="silo reveal" style={style}>{label}</div>
          ))}
        </div>
        <div>
          <h3 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 16px' }}>One wallet. Every reading. Forever.</h3>
          <p style={{ color: 'var(--text-mute)', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
            VitalChain doesn't ask the silos to cooperate. It replaces them. Your device writes directly to Arkiv with your wallet as <span className="mono accent">$owner</span>. Every health app that wants in must query the chain — and any AI you trust can read the same data.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
            {[
              { k: 'Portable', v: 'No export. No download. It is already yours.' },
              { k: 'Provenance', v: 'Each reading is signed by the device that made it.' },
              { k: 'Composable', v: 'Open namespace — any app can read with createPublicClient.' },
              { k: 'Auditable', v: 'Every entity has a tx hash. Anyone can verify.' },
            ].map(item => (
              <div key={item.k} className="row gap-sm reveal" style={{ padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
                <Glyph type="check" size={14} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.k}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>{item.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Verify() {
  useReveal('#verify .reveal');
  return (
    <section className="lsection" id="verify">
      <div className="lsection-head reveal">
        <div className="lsection-tag">DON'T TRUST. VERIFY.</div>
        <h2 className="lsection-title">VitalChain is not the source<br />of truth. Arkiv is.</h2>
        <p className="lsection-sub">
          The snippets below run from any environment — Node, browser, your own dApp. They return the exact data you see in our UI, because the data was never ours. We're an interface to the chain.
        </p>
      </div>
      <div className="verify-code reveal">
        <div className="verify-code-head">
          <div className="verify-code-dots">
            <span className="verify-code-dot"></span>
            <span className="verify-code-dot"></span>
            <span className="verify-code-dot"></span>
          </div>
          <span className="verify-code-name">verify.ts · run anywhere with @arkiv-network/sdk</span>
        </div>
        <div className="verify-code-body" dangerouslySetInnerHTML={{
          __html: `<span class="kw">import</span> { <span class="fn">createPublicClient</span>, <span class="fn">http</span> } <span class="kw">from</span> <span class="str">'@arkiv-network/sdk'</span>;
<span class="kw">import</span> { braga } <span class="kw">from</span> <span class="str">'@arkiv-network/sdk/chains'</span>;
<span class="kw">import</span> { <span class="fn">eq</span>, <span class="fn">gte</span> } <span class="kw">from</span> <span class="str">'@arkiv-network/sdk/query'</span>;

<span class="kw">const</span> client = <span class="fn">createPublicClient</span>({ chain: braga, transport: <span class="fn">http</span>() });

<span class="com">// Pull the patient's last 30 days of biometric readings —</span>
<span class="com">// no auth, no API key, no VitalChain server in the path.</span>
<span class="kw">const</span> result = <span class="kw">await</span> client.<span class="fn">buildQuery</span>()
  .<span class="fn">where</span>([
    <span class="fn">eq</span>(<span class="str">'project'</span>, <span class="str">'vitalchain_ethns_arkiv_v1'</span>),
    <span class="fn">eq</span>(<span class="str">'entityType'</span>, <span class="str">'biometric_reading'</span>),
    <span class="fn">gte</span>(<span class="str">'recordedAt'</span>, <span class="fn">Date</span>.<span class="fn">now</span>() - <span class="num">30</span> * <span class="num">86400000</span>),
  ])
  .<span class="fn">ownedBy</span>(patientWallet)
  .<span class="fn">orderBy</span>(<span class="str">'recordedAt'</span>, <span class="str">'number'</span>, <span class="str">'desc'</span>)
  .<span class="fn">withPayload</span>(<span class="kw">true</span>).<span class="fn">withAttributes</span>(<span class="kw">true</span>)
  .<span class="fn">limit</span>(<span class="num">30</span>).<span class="fn">fetch</span>();

console.<span class="fn">log</span>(result.entities); <span class="com">// the same entities as in the app</span>`
        }} />
      </div>
    </section>
  );
}

export function Compare() {
  useReveal('#compare .reveal');
  const rows = [
    ['Theme coverage', 'AI + Privacy + DePIN', 'AI only, or AI + Privacy'],
    ['Entity types', '4 distinct, richly related', '2 minimal types'],
    ['Ownership model', 'Device $creator + Patient $owner', 'Platform holds $owner'],
    ['AI integration', 'Live AI reads chain, writes back', 'AI never reads stored data'],
    ['Privacy', 'AES-GCM client-side + public attrs', 'None, or metadata-only'],
    ['Demo watchability', 'Live sensor + AI + share countdown', 'Static memory list'],
  ];
  return (
    <section className="lsection" id="compare">
      <div className="lsection-head reveal">
        <div className="lsection-tag">VS THE FIELD</div>
        <h2 className="lsection-title">Built for the only architecture<br />that hits all three themes.</h2>
        <p className="lsection-sub">
          Most challenge entries pick one theme. VitalChain demonstrates the full hybrid — DePIN, Privacy, and AI — in a single coherent product. Every cell below is a working part of the app.
        </p>
      </div>
      <div className="cmp-table reveal">
        <div className="cmp-row head">
          <div className="cmp-cell head">Dimension</div>
          <div className="cmp-cell head">VitalChain</div>
          <div className="cmp-cell head">Typical entry</div>
        </div>
        {rows.map((r, i) => (
          <div className="cmp-row" key={i}>
            <div className="cmp-cell">{r[0]}</div>
            <div className="cmp-cell us">{r[1]}</div>
            <div className="cmp-cell them">{r[2]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Stack() {
  useReveal('#stack .reveal');
  return (
    <section className="lsection" id="stack">
      <div className="lsection-head reveal">
        <div className="lsection-tag">STACK</div>
        <h2 className="lsection-title">Built fast. Built right.</h2>
      </div>
      <div className="stack-grid">
        {[
          ['Frontend', 'Next.js 15 · App Router'],
          ['Blockchain', 'Sui Testnet · zkLogin'],
          ['Wallet', '@mysten/dapp-kit'],
          ['Crypto', 'Web Crypto · AES-GCM'],
          ['AI', 'Claude Haiku · claude-haiku-4-5'],
          ['Charts', 'SVG Sparklines'],
          ['Network', 'Sui Testnet · PROVER_URL'],
          ['License', 'MIT'],
        ].map(([k, v]) => (
          <div key={k} className="stack-item reveal">
            <div className="stack-item-label">{k}</div>
            <div className="stack-item-value">{v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinalCTA() {
  useReveal('#cta .reveal');
  return (
    <section className="lsection" id="cta">
      <div className="cta-final reveal">
        <div style={{ fontFamily: 'var(--font-geist-mono,"Geist Mono",monospace)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 24, textTransform: 'uppercase' }}>
          ETHNS × ARKIV CHALLENGE
        </div>
        <h2>Open the app. Connect your wallet.<br />Own your health.</h2>
        <p>
          Demo data is seeded automatically on first connect — three devices, sixty readings, real on-chain entities. You'll be analysing your "health" with the AI in under a minute.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn primary btn-lg" href="/app">
            <Glyph type="bolt" size={14} />
            Launch VitalChain
          </Link>
          <a className="btn btn-lg" href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }); }}>
            Read the architecture
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="lfooter">
      <div className="row gap-sm">
        <div className="brand-mark"></div>
        <span style={{ fontSize: 13, fontWeight: 500 }}>VitalChain</span>
        <span style={{ color: 'var(--text-faint)', fontSize: 12, marginLeft: 8 }}>Your health data. Your AI. Your chain.</span>
      </div>
      <div className="lfooter-meta">
        MIT · SUI TESTNET · vitalchain_ethns_arkiv_v1
      </div>
    </footer>
  );
}

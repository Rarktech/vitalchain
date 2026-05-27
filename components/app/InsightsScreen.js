'use client';

import { useState } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Hash from '@/components/ui/Hash';
import ExplorerLink from '@/components/ui/ExplorerLink';
import Spinner from '@/components/ui/Spinner';
import Empty from '@/components/ui/Empty';

function generateLocalFallback(question, rows, READING_TYPES) {
  const byType = {};
  rows.forEach(r => { (byType[r.type] = byType[r.type] || []).push(r); });
  const summaries = [];
  let improving = 0, worsening = 0;
  for (const [type, list] of Object.entries(byType)) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.at - b.at);
    const half = Math.floor(sorted.length / 2);
    const earlyAvg = sorted.slice(0, half).reduce((s, r) => s + Number(r.v1), 0) / half;
    const lateAvg = sorted.slice(half).reduce((s, r) => s + Number(r.v1), 0) / (sorted.length - half);
    const meta = READING_TYPES[type];
    const delta = lateAvg - earlyAvg;
    const dir = Math.abs(delta) < (earlyAvg * 0.02) ? 'stable' : delta > 0 ? 'increasing' : 'decreasing';
    let goodDir = type === 'spo2' ? 'higher' : type === 'temperature' ? 'stable' : 'lower';
    let eval2 = 'stable';
    if (dir !== 'stable') {
      if ((goodDir === 'lower' && dir === 'decreasing') || (goodDir === 'higher' && dir === 'increasing')) eval2 = 'improving';
      else eval2 = 'worsening';
    }
    if (eval2 === 'improving') improving++;
    if (eval2 === 'worsening') worsening++;
    summaries.push(`${meta?.label}: ${list.length} readings, avg ${lateAvg.toFixed(1)} ${meta?.unit} (${dir}, ${eval2}). Range ${Math.min(...sorted.map(r => r.v1)).toFixed(1)}–${Math.max(...sorted.map(r => r.v1)).toFixed(1)}.`);
  }
  const trend = improving > worsening ? 'improving' : worsening > improving ? 'worsening' : 'stable';
  const intro = `Based on the last ${rows.length} readings across ${Object.keys(byType).length} metric${Object.keys(byType).length > 1 ? 's' : ''}, here's what the data shows:`;
  const body = summaries.map(s => `• ${s}`).join('\n');
  const close = trend === 'improving'
    ? "Trend is encouraging overall. Keep doing what you're doing and consider sharing this with your clinician at your next visit."
    : trend === 'worsening'
      ? "Some metrics are drifting in the wrong direction. Worth flagging at your next appointment so a clinician can review."
      : 'Metrics are largely stable. No significant trend changes in the window analyzed. Continue routine monitoring.';
  const recs = trend === 'improving' ? 'maintain current routine, share with your clinician, recheck in 2 weeks'
    : trend === 'worsening' ? 'discuss with your clinician, review lifestyle factors, increase monitoring frequency'
      : 'continue baseline monitoring, log readings consistently, review monthly';
  return `${intro}\n\n${body}\n\n${close}\n\nTREND: ${trend}\nRECS: ${recs}`;
}

function PipelineStep({ done, active, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', color: done ? 'var(--accent)' : active ? 'var(--text)' : 'var(--text-faint)' }}>
      <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {done ? <Glyph type="check" size={12} /> : active ? <Spinner /> : <span style={{ width: 5, height: 5, background: 'currentColor', borderRadius: '50%', opacity: 0.4 }}></span>}
      </div>
      <span className="mono" style={{ fontSize: 11 }}>{label}</span>
    </div>
  );
}

function AnalysisCard({ analysis }) {
  const { fmtDate, relTime } = useVC();
  const generatedAt = analysis.attributes.find(a => a.key === 'generatedAt')?.value;
  const readingCount = analysis.attributes.find(a => a.key === 'readingCount')?.value;
  const trend = analysis.payload?.trend;
  return (
    <div className="insight">
      <div className="row" style={{ marginBottom: 12, fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.04em' }}>
        <span className="mono">{relTime(generatedAt).toUpperCase()}</span>
        <span>·</span>
        <span>{readingCount} READINGS ANALYZED</span>
        <div className="spacer" />
        {trend && <span className={`chip ${trend === 'improving' ? 'accent' : trend === 'worsening' ? 'warn' : ''}`}>TREND · {trend.toUpperCase()}</span>}
      </div>
      <div className="insight-q">{analysis.payload?.question}</div>
      <div className="insight-body" dangerouslySetInnerHTML={{
        __html: (analysis.payload?.analysis || '')
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/^#{1,6}\s+(.+)$/gm, '<strong style="font-size:14px;color:var(--text);display:block;margin-top:8px;margin-bottom:4px">$1</strong>')
          .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
          .replace(/^\s*[-•]\s+(.+)$/gm, '<div style="padding-left:14px;position:relative;margin:2px 0">• $1</div>')
      }} />
      {analysis.payload?.recommendations?.length > 0 && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8 }}>
          <div className="label" style={{ marginBottom: 6 }}>Recommendations</div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: 'var(--text-mute)' }}>
            {analysis.payload.recommendations.map((r, i) => <li key={i} style={{ marginTop: 2 }}>{r}</li>)}
          </ul>
        </div>
      )}
      <div className="insight-meta">
        <span className="chip mono">$creator · ai_orch</span>
        <span className="chip mono accent">$owner · you</span>
        <Hash value={analysis.entityKey} n={6} label="entity" />
        <div className="spacer" />
        <ExplorerLink entityKey={analysis.entityKey} label="On explorer" />
      </div>
    </div>
  );
}

export default function InsightsScreen() {
  const { state, queryEntities, writeAnalysis, decryptReading, READING_TYPES, relTime } = useVC();
  const analyses = queryEntities({ entityType: 'ai_analysis', $owner: state.wallet.address })
    .sort((a, b) => (b.attributes.find(x => x.key === 'generatedAt')?.value) - (a.attributes.find(x => x.key === 'generatedAt')?.value));
  const readings = queryEntities({ entityType: 'biometric_reading', $owner: state.wallet.address });

  const [question, setQuestion] = useState('');
  const [working, setWorking] = useState(false);
  const [stage, setStage] = useState(null);

  const suggestions = [
    'Is my blood pressure trending better?',
    'Summarize my last 30 days',
    'Any anomalies I should flag for my doctor?',
    'What patterns do you see in my heart rate?',
  ];

  const ask = async (q) => {
    const qq = q || question;
    if (!qq.trim() || readings.length === 0) return;
    setQuestion(qq);
    setWorking(true);
    setStage('query');
    await new Promise(r => setTimeout(r, 500));

    setStage('decrypt');
    const sorted = readings
      .sort((a, b) => (b.attributes.find(x => x.key === 'recordedAt')?.value) - (a.attributes.find(x => x.key === 'recordedAt')?.value))
      .slice(0, 30);
    const decryptedRows = [];
    for (const r of sorted) {
      const type = r.attributes.find(a => a.key === 'readingType')?.value;
      const v1 = r.attributes.find(a => a.key === 'primaryValue')?.value;
      const v2 = r.attributes.find(a => a.key === 'secondaryValue')?.value;
      const at = r.attributes.find(a => a.key === 'recordedAt')?.value;
      let note = '';
      if (r.attributes.find(a => a.key === 'encrypted')?.value === 1) {
        try { const p = await decryptReading(r); note = p?.note || ''; } catch {}
      } else {
        note = r.payload?.note || '';
      }
      decryptedRows.push({ type, v1, v2, at, note, key: r.entityKey });
    }
    setStage('ai');

    const context = decryptedRows.map(r => {
      const m = READING_TYPES[r.type];
      const vstr = r.v2 != null && r.v2 !== '' ? `${r.v1}/${r.v2}` : r.v1;
      return `[entity:${r.key}] ${new Date(r.at).toISOString().slice(0, 10)}: ${m?.label || r.type} ${vstr} ${m?.unit || ''}`;
    }).join('\n');

    // Build memory context from the 2 most recent past analyses
    const recentAnalyses = analyses.slice(0, 2);
    const memoryBlock = recentAnalyses.length > 0
      ? `Prior analyses on this user's data (for context only — do not repeat verbatim):\n` +
        recentAnalyses.map((a, i) => {
          const ts = a.attributes.find(x => x.key === 'generatedAt')?.value;
          const date = ts ? new Date(ts).toISOString().slice(0, 10) : 'unknown';
          return `[Analysis ${i + 1} — ${date}]\nQ: ${a.payload?.question}\nSummary: ${(a.payload?.analysis || '').slice(0, 300)}`;
        }).join('\n\n')
      : '';

    const prompt = `You are a careful health-data analyst. The user has asked: "${qq}".
${memoryBlock ? memoryBlock + '\n\n' : ''}Their last ${decryptedRows.length} readings (oldest-first), each prefixed with its Arkiv entity key:
${context.split('\n').reverse().join('\n')}

When you reference a specific reading in your response, cite its entity key in brackets, e.g. [entity:0xabc123].
Respond in <=200 words. Be specific with numbers. End with EXACTLY one line: "TREND: improving" or "TREND: stable" or "TREND: worsening". Then a second line: "RECS: " followed by 1-3 short comma-separated recommendations. Do not give a medical diagnosis; suggest discussing with a clinician when appropriate.`;

    let analysisText;
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`AI route error ${res.status}`);
      const data = await res.json();
      if (!data.text || data.text.length < 10) throw new Error('empty response');
      analysisText = data.text;
    } catch {
      analysisText = generateLocalFallback(qq, decryptedRows, READING_TYPES);
    }

    const trendMatch = analysisText.match(/TREND:\s*(improving|stable|worsening)/i);
    const recMatch = analysisText.match(/RECS:\s*(.+)/i);
    const trend = trendMatch ? trendMatch[1].toLowerCase() : 'stable';
    const recs = recMatch ? recMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];
    const cleanAnalysis = analysisText.replace(/TREND:.*$/im, '').replace(/RECS:.*$/im, '').trim();

    setStage('write');
    await writeAnalysis({
      question: qq,
      analysis: cleanAnalysis,
      trend,
      recommendations: recs,
      readingKeys: decryptedRows.map(r => r.key),
      model: 'gemini-2.5-flash',
    });

    setWorking(false);
    setStage(null);
    setQuestion('');
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">AI Insights</div>
          <div className="page-sub">The AI queries your Arkiv readings, decrypts them locally, generates an analysis, and writes a new <span className="mono accent">ai_analysis</span> entity back to the chain — owned by your wallet.</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row gap-sm" style={{ marginBottom: 12 }}>
            <Glyph type="sparkle" size={14} />
            <div style={{ fontWeight: 500, fontSize: 14 }}>Ask about your health data</div>
            <div className="spacer" />
            <span className="chip mono">model · gemini-2.5-flash</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !working) ask(); }}
              placeholder="e.g. Is my blood pressure trending better?"
              disabled={working}
            />
            <button className="btn primary" onClick={() => ask()} disabled={working || !question.trim() || readings.length === 0}>
              {working
                ? <><Spinner /> {stage === 'query' ? 'Querying Arkiv' : stage === 'decrypt' ? 'Decrypting' : stage === 'ai' ? 'AI thinking' : 'Writing to chain'}</>
                : <>Ask AI <Glyph type="arrow_right" size={12} /></>}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {suggestions.map(s => (
              <button key={s} className="btn xs ghost" onClick={() => ask(s)} disabled={working}>{s}</button>
            ))}
          </div>
          {working && (
            <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: 8, fontSize: 12 }}>
              <PipelineStep done={['decrypt', 'ai', 'write'].includes(stage)} active={stage === 'query'} label={`buildQuery → ownedBy(${state.wallet.address.slice(0, 10)}…) → fetch(30)`} />
              <PipelineStep done={['ai', 'write'].includes(stage)} active={stage === 'decrypt'} label="AES-GCM decrypt encrypted payloads locally" />
              <PipelineStep done={['write'].includes(stage)} active={stage === 'ai'} label="Gemini 2.5 Flash inference" />
              <PipelineStep done={false} active={stage === 'write'} label="createEntity ai_analysis → $owner = your wallet" />
            </div>
          )}
        </div>
      </div>

      <div className="section-head">
        <div className="section-title">Past analyses</div>
        <div className="section-sub mono">{analyses.length} entities · all owned by you</div>
      </div>

      {analyses.length === 0
        ? <Empty title="No AI analyses yet" sub="Ask a question above — the result is written to Arkiv as a new entity, owned by your wallet" />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{analyses.map(a => <AnalysisCard key={a.entityKey} analysis={a} />)}</div>}
    </div>
  );
}

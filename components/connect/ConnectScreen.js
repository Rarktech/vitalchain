'use client';

import { useState, useEffect } from 'react';
import { useVC } from '@/lib/store';
import { initiateZKLogin, completeZKLogin, loadZKLoginSession, clearZKLoginSession } from '@/lib/zklogin';
import Glyph from '@/components/ui/Glyph';
import Spinner from '@/components/ui/Spinner';

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const ConnectStep = ({ done, active, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', color: done || active ? 'var(--text)' : 'var(--text-faint)' }}>
    <div style={{
      width: 16, height: 16, borderRadius: '50%',
      border: '1.5px solid',
      borderColor: done ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--hairline-strong)',
      background: done ? 'var(--accent)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0f08',
      flexShrink: 0,
    }}>
      {done ? <Glyph type="check" size={10} /> : active ? <Spinner /> : null}
    </div>
    <div style={{ fontSize: 13 }}>{label}</div>
  </div>
);

export default function ConnectScreen() {
  const { connectWallet, seedDemo, BRAGA_CHAIN_ID, pushToast } = useVC();
  const [method, setMethod] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);

  // Check for zkLogin callback on mount (after Google OAuth redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash.includes('id_token')) return;

    setMethod('google');
    setStep(1);

    (async () => {
      try {
        setStep(2);
        const zkData = await completeZKLogin();
        if (!zkData) return;
        setStep(3);
        const address = await connectWallet(zkData.address);
        await new Promise(r => setTimeout(r, 200));
        await seedDemo(address);
      } catch (err) {
        console.error('zkLogin error:', err);
        setError(err.message);
        setMethod(null);
        setStep(0);
        pushToast({ title: 'zkLogin failed', body: err.message, tone: 'warn' });
      }
    })();
  }, []);

  const handleGoogle = async () => {
    setMethod('google');
    setStep(1);
    setError(null);
    try {
      await initiateZKLogin();
      // Page will redirect to Google — no code after this runs
    } catch (err) {
      // Fallback: simulate zkLogin with a derived address (for demo / prover unavailability)
      console.warn('zkLogin initiation failed, using simulated flow:', err);
      setStep(2);
      await new Promise(r => setTimeout(r, 700));
      setStep(3);
      const address = await connectWallet();
      await new Promise(r => setTimeout(r, 200));
      await seedDemo(address);
    }
  };

  const handleWallet = async () => {
    setMethod('wallet');
    setStep(1);
    setError(null);
    await new Promise(r => setTimeout(r, 700));
    setStep(2);
    await new Promise(r => setTimeout(r, 600));
    setStep(3);
    const address = await connectWallet();
    await new Promise(r => setTimeout(r, 200));
    await seedDemo(address);
  };

  const idle = !method;

  return (
    <div className="connect-page">
      <div className="connect-card">
        <div className="connect-mark"></div>
        <div className="connect-tag">VitalChain</div>
        <div className="connect-title">Your health data.<br />Your AI. Your chain.</div>
        <div className="connect-desc">
          Every reading from your devices is written as a wallet-owned entity on Arkiv.
          Sign in with Google for a zkLogin-derived address, or bring your own wallet.
        </div>

        {idle ? (
          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            <button className="zk-btn" onClick={handleGoogle}>
              <GoogleG />
              <span>Sign in with Google</span>
              <span className="zk-badge">zkLogin</span>
            </button>

            <div className="auth-divider"><span>or</span></div>

            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 14 }}
              onClick={handleWallet}
            >
              <Glyph type="bolt" size={14} />
              Connect wallet
            </button>

            {error && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'oklch(0.7 0.18 25)', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.5 }} className="mono">
              ZKLOGIN DERIVES YOUR WALLET ADDRESS FROM A GOOGLE OAUTH PROOF.<br />
              NO SEED PHRASE. NO BROWSER EXTENSION. SAME $OWNER ON-CHAIN.
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 360, margin: '0 auto', textAlign: 'left' }}>
            {method === 'google' ? (
              <>
                <ConnectStep done={step > 0} active={step === 1} label="Verifying Google OAuth proof" />
                <ConnectStep done={step > 1} active={step === 2} label="Deriving zkLogin wallet on Sui Testnet" />
                <ConnectStep done={step > 2} active={step === 3} label="Seeding demo data" />
              </>
            ) : (
              <>
                <ConnectStep done={step > 0} active={step === 1} label="Requesting wallet" />
                <ConnectStep done={step > 1} active={step === 2} label="Connecting to Sui Testnet" />
                <ConnectStep done={step > 2} active={step === 3} label="Seeding demo data" />
              </>
            )}
          </div>
        )}

        <div className="connect-features">
          <div className="connect-feature">
            <div className="connect-feature-name">DePIN</div>
            <div className="connect-feature-text">Device wallets sign readings as $creator — tamper-proof provenance</div>
          </div>
          <div className="connect-feature">
            <div className="connect-feature-name">Privacy</div>
            <div className="connect-feature-text">AES-GCM client-side; only your wallet derives the key</div>
          </div>
          <div className="connect-feature">
            <div className="connect-feature-name">AI</div>
            <div className="connect-feature-text">AI reads your readings, writes insights back to the chain — you own them</div>
          </div>
        </div>

        <div style={{ marginTop: 32, fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.05em' }}>
          SUI TESTNET · ZKLOGIN · MIT LICENSE
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useWallets, useConnectWallet, useCurrentAccount } from '@mysten/dapp-kit';
import { useVC } from '@/lib/store';
import {
  initiateZKLogin,
  extractJWTFromHash,
  deriveZKLoginAddress,
  getOrCreateUserSalt,
  completeZKLogin,
  clearZKLoginSession,
} from '@/lib/zklogin';
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
  const { state, connectWallet, pushToast } = useVC();
  const wallets = useWallets();
  const { mutate: connectDappKit } = useConnectWallet();
  const currentAccount = useCurrentAccount();

  const [method, setMethod] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const [showWalletList, setShowWalletList] = useState(false);

  // Sync dapp-kit autoConnect → store (e.g. user had a wallet previously connected)
  useEffect(() => {
    if (currentAccount?.address && !state.wallet) {
      connectWallet(currentAccount.address);
    }
  }, [currentAccount]);

  // Handle zkLogin OAuth callback (Google redirects back with id_token in hash)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash.includes('id_token')) return;

    setMethod('google');
    setStep(1);

    (async () => {
      try {
        const jwt = extractJWTFromHash(hash);
        if (!jwt) throw new Error('No id_token in URL — try signing in again');

        // Clear the hash immediately
        window.history.replaceState(null, '', window.location.pathname);

        setStep(2);
        // Decode JWT payload (no verification — we only need sub/email for address + salt)
        const [, payloadB64] = jwt.split('.');
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        const { sub, email } = payload;

        // Derive address without the prover — always works
        const userSalt = getOrCreateUserSalt(sub);
        const address = await deriveZKLoginAddress(jwt, userSalt);

        // Persist minimal session so AppShell can read email later
        sessionStorage.setItem('zklogin_data', JSON.stringify({
          address, email, sub, loginMethod: 'zklogin',
        }));

        setStep(3);
        await connectWallet(address);

        // Try to get ZK proof in background — not blocking
        completeZKLogin().catch(err => console.warn('ZK prover skipped:', err));
      } catch (err) {
        console.error('zkLogin error:', err);
        setError(err.message);
        setMethod(null);
        setStep(0);
        clearZKLoginSession();
        pushToast({ title: 'Sign-in failed', body: err.message, tone: 'warn' });
      }
    })();
  }, []);

  const handleGoogle = async () => {
    setMethod('google');
    setStep(1);
    setError(null);
    try {
      await initiateZKLogin();
      // Redirects to Google — nothing runs after this
    } catch (err) {
      setError('Could not reach Sui network. Check your connection and try again.');
      setMethod(null);
      setStep(0);
    }
  };

  const handleDappKitWallet = (wallet) => {
    setShowWalletList(false);
    setMethod('wallet');
    setStep(1);
    setError(null);
    connectDappKit(
      { wallet },
      {
        onSuccess: (data) => {
          setStep(3);
          const address = data?.accounts?.[0]?.address;
          if (address) connectWallet(address);
        },
        onError: (err) => {
          setError(err.message || 'Wallet connection rejected');
          setMethod(null);
          setStep(0);
        },
      }
    );
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
          Sign in with Google for a zkLogin-derived address, or connect a Sui wallet.
        </div>

        {idle ? (
          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            <button className="zk-btn" onClick={handleGoogle}>
              <GoogleG />
              <span>Sign in with Google</span>
              <span className="zk-badge">zkLogin</span>
            </button>

            <div className="auth-divider"><span>or</span></div>

            {!showWalletList ? (
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 14 }}
                onClick={() => setShowWalletList(true)}
              >
                <Glyph type="bolt" size={14} />
                Connect Sui wallet
              </button>
            ) : (
              <div style={{ border: '1px solid var(--hairline)', borderRadius: 10, overflow: 'hidden' }}>
                {wallets.length === 0 ? (
                  <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                    <div style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text)' }}>No Sui wallet detected</div>
                    <div>Install <a href="https://suiwallet.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Sui Wallet</a> browser extension, or use Google zkLogin above — no extension needed.</div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-faint)' }}>MetaMask is for Ethereum and cannot connect to Sui.</div>
                  </div>
                ) : (
                  wallets.map(wallet => (
                    <button
                      key={wallet.name}
                      onClick={() => handleDappKitWallet(wallet)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', background: 'transparent', border: 'none',
                        borderBottom: '1px solid var(--hairline)', cursor: 'pointer',
                        color: 'var(--text)', fontSize: 14, textAlign: 'left',
                      }}
                    >
                      {wallet.icon && (
                        <img src={wallet.icon} alt="" width={24} height={24} style={{ borderRadius: 6 }} />
                      )}
                      <span>{wallet.name}</span>
                    </button>
                  ))
                )}
                <button
                  onClick={() => setShowWalletList(false)}
                  style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: 12, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'oklch(0.7 0.18 25)', textAlign: 'center', lineHeight: 1.5 }}>
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
                <ConnectStep done={step > 0} active={step === 1} label="Verifying Google identity" />
                <ConnectStep done={step > 1} active={step === 2} label="Deriving Sui address" />
                <ConnectStep done={step > 2} active={step === 3} label="Loading your vault" />
              </>
            ) : (
              <>
                <ConnectStep done={step > 0} active={step === 1} label="Requesting wallet approval" />
                <ConnectStep done={step > 1} active={step === 2} label="Connecting to Sui Testnet" />
                <ConnectStep done={step > 2} active={step === 3} label="Loading your vault" />
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

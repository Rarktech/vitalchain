'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Glyph from '@/components/ui/Glyph';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={`lnav ${scrolled ? 'scrolled' : ''}`}>
      <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
        <div className="brand-mark"></div>
        <div>
          <div className="brand-name">VitalChain</div>
          <div className="brand-tag mono">Sui · v1</div>
        </div>
      </Link>

      <div className={`lnav-links ${mobileOpen ? 'mobile-open' : ''}`}>
        <a className="lnav-link" onClick={() => scrollTo('how')}>How it works</a>
        <a className="lnav-link" onClick={() => scrollTo('features')}>Features</a>
        <a className="lnav-link" onClick={() => scrollTo('arkiv')}>Arkiv</a>
        <a className="lnav-link" onClick={() => scrollTo('verify')}>Verify</a>
        <a className="lnav-link" onClick={() => scrollTo('compare')}>Compare</a>
      </div>

      <div className="lnav-cta">
        <a className="btn ghost" href="https://github.com" target="_blank" rel="noreferrer">View on GitHub</a>
        <Link className="btn primary" href="/app">
          Launch app <Glyph type="arrow_right" size={12} />
        </Link>
      </div>

      <button
        className="lnav-hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        <span></span><span></span><span></span>
      </button>

      {mobileOpen && (
        <div className="lnav-mobile-menu">
          <a className="lnav-link" onClick={() => scrollTo('how')}>How it works</a>
          <a className="lnav-link" onClick={() => scrollTo('features')}>Features</a>
          <a className="lnav-link" onClick={() => scrollTo('arkiv')}>Arkiv</a>
          <a className="lnav-link" onClick={() => scrollTo('verify')}>Verify</a>
          <a className="lnav-link" onClick={() => scrollTo('compare')}>Compare</a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, padding: '0 16px 16px' }}>
            <Link className="btn primary" href="/app" onClick={() => setMobileOpen(false)}>
              Launch app <Glyph type="arrow_right" size={12} />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

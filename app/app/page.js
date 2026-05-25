'use client';

import { useEffect } from 'react';
import { useVC } from '@/lib/store';
import ConnectScreen from '@/components/connect/ConnectScreen';
import AppShell from '@/components/app/AppShell';
import Toasts from '@/components/ui/Toasts';

export default function AppPage() {
  const { state } = useVC();

  if (!state.wallet) {
    return (
      <>
        <ConnectScreen />
        <Toasts />
      </>
    );
  }

  return <AppShell />;
}

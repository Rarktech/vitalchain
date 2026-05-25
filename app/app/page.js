'use client';

import { useVC } from '@/lib/store';
import ConnectScreen from '@/components/connect/ConnectScreen';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import AppShell from '@/components/app/AppShell';
import Toasts from '@/components/ui/Toasts';

export default function AppPage() {
  const { state } = useVC();

  if (!state.wallet) return (<><ConnectScreen /><Toasts /></>);
  if (!state.profile) return (<><OnboardingFlow /><Toasts /></>);
  return <AppShell />;
}

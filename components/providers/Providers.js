'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { VCProvider } from '@/lib/store';

const queryClient = new QueryClient();

const networks = {
  testnet: { url: getJsonRpcFullnodeUrl('testnet') },
  mainnet: { url: getJsonRpcFullnodeUrl('mainnet') },
  devnet: { url: getJsonRpcFullnodeUrl('devnet') },
};

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <VCProvider>
            {children}
          </VCProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

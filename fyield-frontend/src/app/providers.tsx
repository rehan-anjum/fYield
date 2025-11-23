'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { defineChain } from 'viem';

export const flareTestnet = defineChain({
  id: 114,
  name: 'Flare Testnet Coston2',
  network: 'flare-coston2',
  nativeCurrency: {
    decimals: 18,
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
  },
  rpcUrls: {
    default: {
      http: ['https://coston2-api.flare.network/ext/C/rpc'],
    },
  },
  blockExplorers: {
    default: { name: 'FlareBlockScout', url: 'https://coston2-explorer.flare.network' },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmiapjhvr010gl10c4g1h2012"
      config={{
        loginMethods: ['wallet'],
        embeddedWallets: {
          createOnLogin: 'off',
        },
        defaultChain: flareTestnet,
        supportedChains: [flareTestnet],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

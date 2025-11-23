'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

function shortenAddress(addr?: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function Vault() {
  const router = useRouter();
  const { wallets } = useWallets();
  const { logout } = usePrivy();

  const address = wallets[0]?.address;
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    try {
      setIsOpen(false);
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center relative bg-[#FFFCED]">

      {/* 🔥 Top-right wallet pill */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center gap-2 rounded-lg border bg-white/80 backdrop-blur px-3 py-1 shadow-sm hover:bg-white transition"
          >
            <img
              src="https://cryptologos.cc/logos/flare-flr-logo.png"
              alt="Flare"
              className="w-3 h-3"
            />
            <span className="text-xs font-medium">
              {address ? shortenAddress(address) : 'No wallet'}
            </span>
            <span
              className={`text-xs transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            >
              ▾
            </span>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border bg-white shadow-lg py-2 text-sm">
              <Link
                href="/yield/dashboard" // change this route if your dashboard lives somewhere else
                className="block px-3 py-2 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Existing vault UI */}
      <div className="flex flex-col items-center">
      <Link href="/" className="inline-block">
        <h1 className="text-5xl font-bold tracking-tight mb-6 text-center cursor-pointer hover:opacity-80 transition">
          fYield
          <img
            src="https://i.imgur.com/PLrFoiD.png"
            alt="icon"
            className="inline-block w-6 h-6 align-super ml-1 mb-1"
          />
        </h1>
      </Link>
        <Card className="w-[420px] overflow-hidden gap-2 relative pb-0">
          <CardHeader className="z-10">
            <CardTitle className="text-2xl font-semibold">
              Select an available vault
            </CardTitle>
            <CardDescription>
              Select a vault with good yield or a preferred asset.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 flex flex-col gap-3">
            {/* Vault Option — Aave */}
            <Link href="/yield/deposit">
              <button className="w-full rounded-2xl border p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex flex-col">
                  {/* Top row: USDC icon + USDC text */}
                  <div className="flex items-center gap-2">
                    <img
                      src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029"
                      className="w-9 h-9"
                      alt="USDC"
                    />
                    <span className="text-xl font-semibold">USDC</span>
                  </div>

                  {/* Bottom row: Aave Vault */}
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <img
                      src="https://cryptologos.cc/logos/aave-aave-logo.svg?v=029"
                      className="w-4 h-4"
                      alt="Aave"
                    />
                    <span className="text-sm text-gray-600">Aave Vault</span>
                  </div>
                </div>

                {/* Right side APR */}
                <div className="text-right mr-1">
                  <span className="text-xl font-semibold">4.15%</span>
                  <p className="text-xs text-gray-500">APR</p>
                </div>
              </button>
            </Link>

            {/* Vault Option — Curve */}
            <button className="w-full rounded-2xl border p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex flex-col">
                {/* Top row: USDC icon + label */}
                <div className="flex items-center gap-2">
                  <img
                    src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029"
                    className="w-9 h-9"
                    alt="USDC"
                  />
                  <span className="text-xl font-semibold">USDC</span>
                </div>

                {/* Bottom row: Curve Vault */}
                <div className="flex items-center gap-2 mt-2 ml-1">
                  <img
                    src="https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg?v=029"
                    className="w-4 h-4"
                    alt="Curve"
                  />
                  <span className="text-sm text-gray-600">Curve Vault</span>
                </div>
              </div>

              {/* Right side APR */}
              <div className="text-right mr-1">
                <span className="text-xl font-semibold">4.00%</span>
                <p className="text-xs text-gray-500">APR</p>
              </div>
            </button>
          </CardContent>
        </Card>

        <div className="absolute bottom-0 left-0 mb-4 ml-4 text-sm text-gray-500">
          <span>
            <b>Built</b> with ❤️ by Rehan & Ali
          </span>
        </div>
        <div className="absolute bottom-0 right-0 mb-4 mr-4 text-sm text-gray-500">
          <span>
            <b>Powered</b> by
            <img
                  src="https://wp.logos-download.com/wp-content/uploads/2024/09/Flare_FLR_Logo_full.png"
                  alt="icon"
                  className="inline-block w-12 h-4 ml-1 mb-1"
              />
          </span>
        </div>
      </div>
    </div>
  );
}

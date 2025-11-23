'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function shortenAddress(addr?: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// 🔥 Coston2 RPC
const COSTON2_RPC = 'https://coston2-api.flare.network/ext/C/rpc';
const coston2Provider = new ethers.JsonRpcProvider(COSTON2_RPC);

// FXRP token address on Coston2
const FXRP_ADDRESS = '0x0b6A3645c240605887a5532109323A3E12273dc7';

// Minimal ERC20 ABI for ethers (balanceOf, decimals)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { wallets } = useWallets();
  const { logout } = usePrivy();

  const address = wallets[0]?.address;

  // FXRP balance state
  const [fxrpBalance, setFxrpBalance] = useState<number | null>(null);
  const [fxrpDecimals, setFxrpDecimals] = useState<number>(6);

  // Wallet pill dropdown
  const [isOpen, setIsOpen] = useState(false);

  // 🔢 Mocked values for now (USDC in vault, APY, rewards, vFXRP)
  const mockVaultUsdc = 123.45;
  const mockVaultAPY = 4.15;
  const mockVaultRewards = 0.789;
  const mockVaultVFXRP = 98.76;

  useEffect(() => {
    const loadBalance = async () => {
      try {
        if (!address) {
          setFxrpBalance(null);
          return;
        }

        const token = new ethers.Contract(FXRP_ADDRESS, ERC20_ABI, coston2Provider);

        const [raw, tokenDecimals] = await Promise.all([
          token.balanceOf(address),
          token.decimals().catch(() => 6),
        ]);

        const formatted = Number(ethers.formatUnits(raw, tokenDecimals));
        setFxrpBalance(formatted);
        setFxrpDecimals(Number(tokenDecimals));
      } catch (err) {
        console.error('Failed to load FXRP balance:', err);
        setFxrpBalance(null);
      }
    };

    loadBalance();
  }, [address]);

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

  // 🧪 Withdraw button stub for now
  const handleWithdraw = () => {
    // TODO: add Privy + vault withdraw logic here
    console.log('Withdraw clicked');
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
                href="/yield/dashboard"
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

      {/* Main content */}
      <div className="flex flex-col items-center w-full max-w-3xl px-4 gap-6">
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

        {/* Your Deposits */}
        <Card className="w-full overflow-hidden gap-2 relative">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Your Deposits
            </CardTitle>
            <CardDescription>
              Overview of your position in the Aave USDC vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {/* Left: vault + balances */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029"
                      className="w-9 h-9"
                      alt="USDC"
                    />
                    <span className="text-xl font-semibold">USDC</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <img
                      src="https://cryptologos.cc/logos/aave-aave-logo.svg?v=029"
                      className="w-4 h-4"
                      alt="Aave"
                    />
                    <span className="text-sm text-gray-600">Aave Vault</span>
                  </div>
                </div>

                <div className="h-12 w-px bg-gray-200" />

                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-500">Deposited</p>
                  <p className="text-lg font-semibold">
                    {mockVaultUsdc.toFixed(2)} USDC
                  </p>
                  <p className="text-xs text-gray-500">
                    vFXRP: {mockVaultVFXRP.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Right: APY + rewards + withdraw */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-col items-end">
                  <p className="text-xs text-gray-500">APY</p>
                  <p className="text-lg font-semibold">
                    {mockVaultAPY.toFixed(2)}%
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-xs text-gray-500">Available rewards</p>
                  <p className="text-sm font-semibold">
                    {mockVaultRewards.toFixed(4)} USDC
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="mt-1 rounded-full px-4 py-1.5 text-xs font-medium text-black border hover:bg-gray-50 transition"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets You Can Supply */}
        <Card className="w-full overflow-hidden gap-2 relative">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Assets You Can Supply
            </CardTitle>
            <CardDescription>
              Supply FXRP to earn yield in the Aave USDC vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {/* Left: FXRP + vault */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://i.imgur.com/odxaoA8.png"
                      alt="FXRP"
                      className="w-9 h-9"
                    />
                    <span className="text-xl font-semibold">FXRP</span>
                  </div>
                </div>

                <div className="h-12 w-px bg-gray-200" />

                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-500">Available FXRP</p>
                  <p className="text-lg font-semibold">
                    {fxrpBalance != null ? fxrpBalance.toFixed(4) : '--'} FXRP
                  </p>
                </div>
              </div>

              {/* Right: APY + Deposit */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-col items-end">
                  <p className="text-xs text-gray-500">APY</p>
                  <p className="text-lg font-semibold">
                    {mockVaultAPY.toFixed(2)}%
                  </p>
                </div>

                <Link href="/yield/vault">
                  <button
                    type="button"
                    className="mt-1 rounded-full px-4 py-1.5 text-xs font-medium text-white bg-black hover:opacity-90 transition"
                  >
                    Deposit
                  </button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
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

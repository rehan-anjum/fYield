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

// 🔥 Coston2 RPC (for FXRP wallet balance)
const COSTON2_RPC = 'https://coston2-api.flare.network/ext/C/rpc';
const coston2Provider = new ethers.JsonRpcProvider(COSTON2_RPC);

// FXRP token address on Coston2
const FXRP_ADDRESS = '0x0b6A3645c240605887a5532109323A3E12273dc7';

// FlareVault contract address (same as in your deposit page)
const VAULT_CONTRACT_ADDRESS = '0x35E40975983E19781305e25552047679DF159d89';

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

// FlareVault ABI bits we need: getUserBalance + requestWithdraw
// (deposit lives in the vault page already)
const VAULT_ABI = [
  {
    name: 'getUserBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'requestWithdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [],
  },
];

// Hardcoded APY for now
const VAULT_APY = 4.15;

export default function Dashboard() {
  const router = useRouter();
  const { wallets } = useWallets();
  const { logout } = usePrivy();

  const address = wallets[0]?.address;

  // FXRP balance state (wallet)
  const [fxrpBalance, setFxrpBalance] = useState<number | null>(null);
  const [fxrpDecimals, setFxrpDecimals] = useState<number>(6);

  // Wallet pill dropdown
  const [isOpen, setIsOpen] = useState(false);

  // 🔢 User stats from backend
  const [usdcLent, setUsdcLent] = useState<string | null>(null);
  const [vFxrpBalance, setVFxrpBalance] = useState<string | null>(null);
  const [earnedYield, setEarnedYield] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Withdraw UX state
  const [withdrawStatus, setWithdrawStatus] = useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Load FXRP wallet balance
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

  // Load user stats from backend: http://localhost:8000/user/:address
  useEffect(() => {
    const fetchStats = async () => {
      if (!address) {
        setUsdcLent(null);
        setVFxrpBalance(null);
        setEarnedYield(null);
        return;
      }

      try {
        setStatsLoading(true);
        setStatsError(null);

        const res = await fetch(`http://localhost:8000/user/${address}`);
        if (!res.ok) {
          throw new Error(`Backend error: ${res.status}`);
        }

        const data: {
          usdcLent: string;
          vFxrpBalance: string;
          earnedYield: string;
        } = await res.json();

        setUsdcLent(data.usdcLent);
        setVFxrpBalance(data.vFxrpBalance);
        setEarnedYield(data.earnedYield);
      } catch (err: any) {
        console.error('Failed to fetch user stats:', err);
        setStatsError('Failed to load vault stats');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
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

  const formatOrDash = (value: string | null, decimals: number) => {
    if (value == null || value === '') return '--';
    const num = Number(value);
    if (Number.isNaN(num)) return '--';
    return num.toFixed(decimals);
  };

  // 🧪 Withdraw all vFXRP (requestWithdraw)
  const handleWithdraw = async () => {
    const wallet = wallets[0];

    if (!wallet || !address) {
      setWithdrawError('Connect a wallet with Privy first.');
      return;
    }

    if (!vFxrpBalance || vFxrpBalance === '' || Number(vFxrpBalance) <= 0) {
      setWithdrawError('No vFXRP balance to withdraw.');
      return;
    }

    if (!VAULT_CONTRACT_ADDRESS) {
      setWithdrawError('Vault contract address not configured.');
      return;
    }

    try {
      setWithdrawError(null);
      setWithdrawStatus('pending');

      // vFXRP uses 6 decimals in your script
      const withdrawAmount = ethers.parseUnits(vFxrpBalance, 6);
      console.log('Withdrawing vFXRP:', vFxrpBalance, '→', withdrawAmount.toString());

      // EIP-1193 provider (MetaMask via Privy) -> ethers v6 BrowserProvider -> signer
      const eip1193 = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(eip1193);
      const signer = await ethersProvider.getSigner();

      const vaultWithSigner = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_ABI,
        signer
      );

      console.log('Requesting withdrawal...');
      const withdrawTx = await vaultWithSigner.requestWithdraw(withdrawAmount);
      await withdrawTx.wait();
      console.log('Withdrawal request submitted!');

      setWithdrawStatus('success');

      // Optimistically zero out local vFXRP + vault shares
      setVFxrpBalance('0');
      setUsdcLent('0');
    } catch (err) {
      console.error('Withdraw transaction failed:', err);
      setWithdrawStatus('error');
      setWithdrawError('Withdrawal failed. Please try again.');
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
          <h1 className="text-5xl font-bold tracking-tight text-center cursor-pointer hover:opacity-80 transition">
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
                    {statsLoading
                      ? 'Loading...'
                      : `${formatOrDash(usdcLent, 2)} USDC`}
                  </p>
                  <p className="text-xs text-gray-500">
                    vFXRP: {formatOrDash(vFxrpBalance, 4)}
                  </p>
                  {statsError && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {statsError}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: APY + rewards + withdraw */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-col items-end">
                  <p className="text-xs text-gray-500">APY</p>
                  <p className="text-lg font-semibold">
                    {VAULT_APY.toFixed(2)}%
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-xs text-gray-500">Available rewards</p>
                  <p className="text-sm font-semibold">
                    {statsLoading
                      ? 'Loading...'
                      : `${formatOrDash(earnedYield, 4)} USDC`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={withdrawStatus === 'pending'}
                  className="mt-1 rounded-full px-4 py-1.5 text-xs font-medium text-black border hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawStatus === 'idle' && 'Withdraw'}
                  {withdrawStatus === 'pending' && 'Requesting withdraw...'}
                  {withdrawStatus === 'success' && 'Withdraw requested ✅'}
                  {withdrawStatus === 'error' && 'Retry withdraw'}
                </button>
                {withdrawError && (
                  <p className="text-[10px] text-red-500 mt-1 text-right">
                    {withdrawError}
                  </p>
                )}
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

              {/* Right: Deposit */}
              <div className="flex flex-col items-end gap-2">
                <Link href="/yield/vault">
                  <button
                    type="button"
                    className="rounded-full px-4 py-1.5 text-xs font-medium text-white bg-black hover:opacity-90 transition"
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
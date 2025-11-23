'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from "react";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { getXRPPrice } from "../../utils/price";
import { ethers } from 'ethers';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function shortenAddress(addr?: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// 🔥 Coston2 RPC
const COSTON2_RPC = "https://coston2-api.flare.network/ext/C/rpc";
const coston2Provider = new ethers.JsonRpcProvider(COSTON2_RPC);

// FlareVault contract address (where FXRP is deposited)
const VAULT_CONTRACT_ADDRESS = "0xa16f5Ff80631a2A9ECB7fd2D113c6eAb2B2a3660";

// FXRP token address on Coston2
const FXRP_ADDRESS = "0x0b6A3645c240605887a5532109323A3E12273dc7";

// Minimal ERC20 ABI for ethers (balanceOf, decimals, approve)
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

// FlareVault ABI: matches your Hardhat script: vault.deposit(uint256 amount)
const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  // optional, if you ever want to read it:
  {
    name: "getUserBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

export default function vault() {
    const router = useRouter();
  const { wallets } = useWallets();

  const [fxrpBalance, setFxrpBalance] = useState<number | null>(null);
  const [fxrpDecimals, setFxrpDecimals] = useState<number>(6); // FXRP uses 6 in your script
  const [fxrpPrice, setFxrpPrice] = useState(0);
  const [usdcAmount, setUsdcAmount] = useState(0);

  const address = wallets[0]?.address;

  // load XRP/FXRP price once (FTSO)
  React.useEffect(() => {
    async function loadPrice() {
      const price = await getXRPPrice();
      setFxrpPrice(price);
    }
    loadPrice();
  }, []);

  // load FXRP balance from Coston2 using ethers + JsonRpcProvider
  React.useEffect(() => {
    const loadBalance = async () => {
      try {
        if (!address) {
          setFxrpBalance(null);
          return;
        }

        console.log("Reading FXRP balance on Coston2 for:", address);

        const token = new ethers.Contract(FXRP_ADDRESS, ERC20_ABI, coston2Provider);

        const [raw, tokenDecimals] = await Promise.all([
          token.balanceOf(address),
          token.decimals().catch(() => 6), // default to 6 like your script
        ]);

        console.log("Token decimals:", tokenDecimals);
        console.log("Raw FXRP balance:", raw.toString());

        const formatted = Number(ethers.formatUnits(raw, tokenDecimals));
        console.log("Formatted FXRP balance:", formatted);

        setFxrpBalance(formatted);
        setFxrpDecimals(Number(tokenDecimals));
      } catch (err) {
        console.error("Failed to load FXRP balance:", err);
        setFxrpBalance(null);
      }
    };

    loadBalance();
  }, [address]);

  // UI state
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const parsedAmount = Number(amount) || 0;

  // ensure amount never exceeds balance if balance changes (e.g. refresh, new wallet)
  React.useEffect(() => {
    if (fxrpBalance == null) return;
    const num = Number(amount);
    if (Number.isNaN(num)) return;
    if (num > fxrpBalance) {
      setAmount(fxrpBalance.toString());
    }
  }, [fxrpBalance]);

  // pure math: FXRP → USDC using loaded price
  React.useEffect(() => {
    if (!amount) {
      setUsdcAmount(0);
      return;
    }

    const num = Number(amount);
    if (Number.isNaN(num)) {
      setUsdcAmount(0);
      return;
    }

    if (!fxrpPrice) {
      setUsdcAmount(0);
      return;
    }

    const fxrpFloat = num;
    const usdcFloat = fxrpFloat * fxrpPrice;

    setUsdcAmount(usdcFloat);
  }, [amount, fxrpPrice]);

  const handleMin = () => {
    setAmount("0");
    setErrorMessage("");
  };

  const handleMax = () => {
    setAmount((fxrpBalance ?? 0).toString());
    setErrorMessage("");
  };

  // 🔥 EXACT FLOW FROM YOUR SCRIPT:
  // 1) fxrp.approve(FLARE_VAULT_ADDRESS, depositAmount)
  // 2) vault.deposit(depositAmount)
  const handleDeposit = async () => {
    const wallet = wallets[0];

    if (!wallet || !address) {
      setErrorMessage("Connect a wallet with Privy first.");
      return;
    }

    if (parsedAmount <= 0) {
      setErrorMessage("Enter a valid amount.");
      return;
    }
    if (parsedAmount > (fxrpBalance ?? 0)) {
      setErrorMessage("Amount exceeds your FXRP balance.");
      return;
    }

    if (!VAULT_CONTRACT_ADDRESS) {
      setErrorMessage("Vault contract address not configured.");
      return;
    }

    try {
      setErrorMessage("");
      setTxStatus("pending");

      // Same as: const depositAmount = ethers.parseUnits("1", 6);
      const amountInUnits = ethers.parseUnits(amount, fxrpDecimals);

      // EIP-1193 provider (MetaMask via Privy) -> ethers v6 BrowserProvider -> signer
      const eip1193 = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(eip1193);
      const signer = await ethersProvider.getSigner();

      // Contracts "connected" to signer = your `fxrpWithSigner` and `vaultWithSigner`
      const fxrpWithSigner = new ethers.Contract(FXRP_ADDRESS, ERC20_ABI, signer);
      const vaultWithSigner = new ethers.Contract(VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer);

      // 1️⃣ Approve FXRP spending by vault
      console.log("Approving FXRP...");
      const approveTx = await fxrpWithSigner.approve(VAULT_CONTRACT_ADDRESS, amountInUnits);
      await approveTx.wait();
      console.log("Approve tx confirmed:", approveTx.hash);

      // 2️⃣ Deposit into vault: vault.deposit(amount)
      console.log("Depositing FXRP into vault...");
      const depositTx = await vaultWithSigner.deposit(amountInUnits);
      const receipt = await depositTx.wait();
      console.log("Deposit tx confirmed:", receipt?.hash);

      setTxStatus("success");

      // Optimistically reduce balance
      setFxrpBalance((prev) => (prev != null ? prev - parsedAmount : prev));
    } catch (err) {
      console.error("Deposit transaction failed:", err);
      setTxStatus("error");
      setErrorMessage("Transaction failed. Please try again.");
    }
  };

  const maxBalance = fxrpBalance ?? 0;

  const { logout } = usePrivy();

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
    <div className="h-screen w-screen flex items-center justify-center bg-[#FFFCED]">

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
              Deposit FXRP to the vault
            </CardTitle>
            <CardDescription>
              Deposit available FXRP to this vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-4">

            {/* Wallet + FXRP balance box */}
            <div className="w-full rounded-2xl border p-4 flex items-center justify-between bg-gray-50">
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-xs text-gray-500">Connected wallet</p>
                  <p className="font-mono text-sm">{shortenAddress(address)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">FXRP balance</p>
                  <p className="text-lg font-semibold">
                    {maxBalance.toFixed(4)} FXRP
                  </p>
                </div>
              </div>

              <img
                src="https://i.imgur.com/odxaoA8.png"
                alt="FXRP"
                className="w-18 h-18"
              />
            </div>

            {/* FXRP input section */}
            <div className="w-full rounded-2xl border p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">Amount to deposit</p>
                <p className="text-xs text-gray-500">
                  Balance: {maxBalance.toFixed(4)} FXRP
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMin}
                  className="px-3 py-1 rounded-full border text-xs font-medium hover:bg-gray-50"
                  disabled={txStatus === "pending"}
                >
                  Min
                </button>

                <div className="flex-1 flex items-center rounded-xl border px-3 py-2 bg-white w-1/2">
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => {
                      const rawValue = e.target.value;

                      // allow clearing input
                      if (rawValue === "") {
                        setAmount("");
                        setErrorMessage("");
                        if (txStatus !== "idle") setTxStatus("idle");
                        return;
                      }

                      let num = Number(rawValue);
                      if (Number.isNaN(num) || num < 0) {
                        num = 0;
                      }

                      // 🔒 HARD CLAMP to available balance
                      if (num > maxBalance) {
                        num = maxBalance;
                      }

                      setAmount(num.toString());
                      setErrorMessage("");
                      if (txStatus !== "idle") setTxStatus("idle");
                    }}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-right text-lg outline-none -ml-5"
                  />
                  <span className="text-sm font-medium text-gray-700 ml-1">
                    FXRP
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleMax}
                  className="px-3 py-1 rounded-full border text-xs font-medium hover:bg-gray-50"
                  disabled={txStatus === "pending"}
                >
                  Max
                </button>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
              )}
            </div>

            {/* USDC preview + Deposit CTA */}
            <div className="w-full rounded-2xl border p-4 flex flex-col gap-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-xs text-gray-500">You will deposit</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold">
                      {usdcAmount ? usdcAmount.toFixed(4) : "0.0000"}
                    </span>
                    <span className="text-sm text-gray-700">USDC</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    into the Aave USDC vault
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029"
                      alt="USDC"
                      className="w-7 h-7"
                    />
                    <img
                      src="https://cryptologos.cc/logos/aave-aave-logo.svg?v=029"
                      alt="Aave"
                      className="w-5 h-5"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    1 FXRP ≈ {fxrpPrice} USDC
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeposit}
                disabled={txStatus === "pending" || parsedAmount <= 0}
                className="mt-2 w-full rounded-full px-4 py-2 text-sm font-medium text-white bg-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {txStatus === "idle" && "Deposit to Aave vault"}
                {txStatus === "pending" && "Approving & depositing..."}
                {txStatus === "success" && "Deposited ✅"}
                {txStatus === "error" && "Retry deposit"}
              </button>

              {txStatus === "pending" && (
                <p className="text-xs text-gray-500 text-center">
                  Confirm the transactions in your wallet…
                </p>
              )}

              {txStatus === "success" && (
                <p className="text-xs text-emerald-600 text-center">
                  FXRP deposited to the vault.
                </p>
              )}
            </div>

          </CardContent>
        </Card>

        <div className="absolute bottom-0 left-0 mb-4 ml-4 text-sm text-gray-500">
          <span><b>Built</b> with ❤️ by Rehan & Ali</span>
        </div>
        <div className="absolute bottom-0 right-0 mb-4 mr-4 text-sm text-gray-500">
          <span><b>Powered</b> by 
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
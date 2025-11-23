'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  
  const handleRedirect = () => {
    router.push('/yield/connect');
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#FFFCED] text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 text-black">
          fYield
          <img
            src="https://i.imgur.com/PLrFoiD.png"
            alt="icon"
            className="inline-block w-10 h-10 align-super ml-1 mb-3"
          />
          <br />
          <span className="text-[#c90208]">Access to yield made easy</span>
        </h1>

        {/* 🌐 Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 text-left">

          {/* Total TVL */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
              Total TVL
            </p>

            {/* Big Total */}
            <p className="text-3xl font-bold text-gray-900 mb-4">
              $2,222,221
            </p>

            <div className="space-y-4">
              {/* Aave */}
              <div className="flex items-center justify-between text-gray-800">
                <div className="flex items-center gap-2">
                  <img
                    src="https://cryptologos.cc/logos/aave-aave-logo.svg?v=029"
                    alt="Aave"
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Aave Vault</span>
                </div>
                <span className="text-sm font-semibold">
                  $1,234,567
                </span>
              </div>

              <div className="h-px bg-gray-200" />

              {/* Curve */}
              <div className="flex items-center justify-between text-gray-800">
                <div className="flex items-center gap-2">
                  <img
                    src="https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg?v=029"
                    alt="Curve"
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Curve Vault</span>
                </div>
                <span className="text-sm font-semibold">
                  $987,654
                </span>
              </div>
            </div>
          </div>

          {/* Max USDC Liquidity */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
              Max USDC Liquidity
            </p>

            {/* Big Total */}
            <p className="text-3xl font-bold text-gray-900 mb-4">
              3,500,000 USDC
            </p>

            <div className="space-y-4">
              {/* Aave */}
              <div className="flex items-center justify-between text-gray-800">
                <div className="flex items-center gap-2">
                  <img
                    src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029"
                    alt="USDC"
                    className="w-5 h-5"
                  />
                  <img
                    src="https://cryptologos.cc/logos/aave-aave-logo.svg?v=029"
                    alt="Aave"
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Aave Vault</span>
                </div>
                <span className="text-sm font-semibold">
                  2,000,000
                </span>
              </div>

              <div className="h-px bg-gray-200" />

              {/* Curve */}
              <div className="flex items-center justify-between text-gray-800">
                <div className="flex items-center gap-2">
                  <img
                    src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029"
                    alt="USDC"
                    className="w-5 h-5"
                  />
                  <img
                    src="https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg?v=029"
                    alt="Curve"
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Curve Vault</span>
                </div>
                <span className="text-sm font-semibold">
                  1,500,000
                </span>
              </div>
            </div>
          </div>

          {/* Yield Earned */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
              Yield Earned
            </p>

            {/* Big Total */}
            <p className="text-3xl font-bold text-emerald-600 mb-4">
              +22,221 USDC
            </p>

            <div className="space-y-4">
              {/* Aave */}
              <div className="flex items-center justify-between text-gray-800">
                <div className="flex items-center gap-2">
                  <img
                    src="https://cryptologos.cc/logos/aave-aave-logo.svg?v=029"
                    alt="Aave"
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Aave Vault</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  +12,345 USDC
                </span>
              </div>

              <div className="h-px bg-gray-200" />

              {/* Curve */}
              <div className="flex items-center justify-between text-gray-800">
                <div className="flex items-center gap-2">
                  <img
                    src="https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg?v=029"
                    alt="Curve"
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Curve Vault</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  +9,876 USDC
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-700 mb-10">
          fYield is a seamless cross-chain yield routing platform that channels Flare’s FAssets into leading EVM yield providers for automated, optimized, and fully interoperable returns.
        </p>

        {/* Get Started */}
        <Button
          onClick={handleRedirect}
          className="relative group px-8 py-6 text-lg text-white bg-black hover:bg-gray-800 transition rounded-xl"
        >
          <span className="relative z-10">Get started</span>
          <div className="absolute inset-0 bg-black/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
        </Button>

      </div>
    </div>
  );
}

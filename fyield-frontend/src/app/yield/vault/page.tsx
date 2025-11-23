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

export default function vault() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6 text-center">
          fYield
          <img
            src="https://i.imgur.com/PLrFoiD.png"
            alt="icon"
            className="inline-block w-6 h-6 align-super ml-1 mb-1"
          />
        </h1>
        <Card className="w-[420px] overflow-hidden gap-2 relative pb-0">
            <CardHeader className="z-10">
                <CardTitle className="text-2xl font-semibold">Select an available vault</CardTitle>
                <CardDescription>
                Select a vault with good yield or a preferred asset.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-4 flex flex-col gap-3">

                {/* Vault Option — Aave */}
                <Link href="/start/deposit">
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
                    <span className="text-xl font-semibold">3.94%</span>
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
                    <span className="text-xl font-semibold">4.12%</span>
                    <p className="text-xs text-gray-500">APR</p>
                </div>
                </button>

            </CardContent>
        </Card>


        <div className="absolute bottom-0 left-0 mb-4 ml-4 text-sm text-gray-500">
          <span><b>Built</b> with ❤️ by Rehan & Ali</span>
        </div>
        <div className="absolute bottom-0 right-0 mb-4 mr-4 text-sm text-gray-500">
          <span><b>Powered</b> by 
            <img
                  src="https://i.imgur.com/PLrFoiD.png"
                  alt="icon"
                  className="inline-block w-4 h-4 ml-1 mb-1"
              />
          </span>
        </div>
      </div>
    </div>
  );
}

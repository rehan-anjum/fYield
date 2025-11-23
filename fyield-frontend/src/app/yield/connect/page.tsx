'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function CardWithForm() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const router = useRouter();

  // Auto-redirect after login + wallet creation
  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      router.push('/yield/vault'); // redirect after wallet is ready
    }
  }, [ready, authenticated, user?.wallet?.address, router]);

  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <span className="text-xl">Loading authentication...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#FFFCED]">
      <div className="flex flex-col items-center mb-20">
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


        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-2xl">
              {authenticated
                ? `Welcome ${user?.email?.address || 'User'}`
                : 'Sign up with Wallet'}
            </CardTitle>
            <CardDescription>
              {authenticated
                ? 'Setting up your wallet...'
                : 'Login to continue using fYield.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {!authenticated ? (
              <Button onClick={login}>Login with Wallet</Button>
            ) : (
              <Button variant="outline" onClick={logout}>
                Cancel Login
              </Button>
            )}
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

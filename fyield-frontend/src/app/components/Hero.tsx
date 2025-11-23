'use client';
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";

export default function Hero() {
    const router = useRouter();
  
    const handleRedirect = () => {
      router.push('/start/connect'); // Replace with your actual route
    };

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
          fYield
          <img
          src="https://i.imgur.com/PLrFoiD.png"
          alt="icon"
          className="inline-block w-10 h-10 align-super ml-1 mb-3"
        />
          <br />
          <span className="text-[#c90208]">Access to yield made easy</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10">
        fYield is a seamless cross-chain yield routing platform that seamlessly channels Flare’s FAssets into leading EVM yield providers for automated, optimized, and fully interoperable returns.
        </p>
        <Button onClick={handleRedirect} className="relative group px-8 py-6 text-lg hover:opacity-90">
          <span className="relative z-10">Get started</span>
          <div className="absolute inset-0 bg-white/20 blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
        </Button>
      </div>
    </div>
  )
}

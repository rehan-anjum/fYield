"use client";

import { ethers } from "ethers";

// Coston2 public RPC
const COSTON2_RPC = "https://coston2-api.flare.network/ext/C/rpc";

// Flare Contract Registry on Coston2
const FLARE_CONTRACT_REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

// Minimal ABI for the Contract Registry
const REGISTRY_ABI = [
  {
    inputs: [{ name: "_name", type: "string" }],
    name: "getContractAddressByName",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

// Minimal ABI for the FTSO Registry
const FTSO_REGISTRY_ABI = [
  {
    inputs: [{ name: "_symbol", type: "string" }],
    name: "getCurrentPriceWithDecimals",
    outputs: [
      { name: "_price", type: "uint256" },
      { name: "_timestamp", type: "uint256" },
      { name: "_decimals", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// ethers provider
const provider = new ethers.JsonRpcProvider(COSTON2_RPC);

/**
 * Fetch XRP/USD price (testXRP on Coston2) from Flare FTSO using ethers v6.
 * Returns price rounded to 4 decimals.
 */
export async function getXRPPrice(): Promise<number> {
  try {
    // 1) Registry → get FtsoRegistry address
    const registry = new ethers.Contract(
      FLARE_CONTRACT_REGISTRY,
      REGISTRY_ABI,
      provider
    );

    const ftsoRegistryAddress = await registry.getContractAddressByName(
      "FtsoRegistry"
    );

    // 2) FTSO Registry → fetch price
    const ftsoRegistry = new ethers.Contract(
      ftsoRegistryAddress,
      FTSO_REGISTRY_ABI,
      provider
    );

    const symbol = "testXRP";

    const result = await ftsoRegistry.getCurrentPriceWithDecimals(symbol);

    // ethers v6 tuple = object with numeric keys
    const rawPrice = result[0];
    const timestamp = Number(result[1]);
    const decimals = Number(result[2]);

    const priceUSD = Number(rawPrice) / 10 ** decimals;

    // Round to 4 decimals
    const rounded = Number(priceUSD.toFixed(4));

    console.log(
      `FTSO ${symbol} price: ${priceUSD} → rounded: ${rounded} (decimals=${decimals}, ts=${timestamp})`
    );

    return rounded;
  } catch (err) {
    console.error("Error fetching XRP price from FTSO (ethers):", err);
    return 1.0;
  }
}

/**
 * Convert FXRP (6 decimals) → USDC using XRP price
 */
export function fxrpToUSDC(fxrpAmount: number, xrpPrice: number): number {
  const fxrpFloat = fxrpAmount / 1e6;
  const usdcFloat = fxrpFloat * xrpPrice;

  console.log(
    `Converted ${fxrpFloat} FXRP → ${usdcFloat} USDC @ $${xrpPrice}`
  );

  return usdcFloat;
}

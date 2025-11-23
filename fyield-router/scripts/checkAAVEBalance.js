const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Checking AAVEManager balances");
    
    const managerAddress = process.env.MAINNET_MANAGER_ADDRESS;
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    
    const manager = await ethers.getContractAt("AAVEManager", managerAddress, provider);
    
    const usdcBalance = await manager.getUSDCBalance();
    const aaveBalance = await manager.getAAVEBalance();
    const totalSupplied = await manager.totalSupplied();
    
    console.log(`\nAAVEManager: ${managerAddress}`);
    console.log(`USDC balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
    console.log(`AAVE balance (aUSDC): ${ethers.formatUnits(aaveBalance, 6)} USDC`);
    console.log(`Total supplied: ${ethers.formatUnits(totalSupplied, 6)} USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

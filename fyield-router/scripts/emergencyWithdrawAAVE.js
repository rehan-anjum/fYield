const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Checking and withdrawing from AAVE");
    
    const managerAddress = process.env.MAINNET_MANAGER_ADDRESS;
    
    // Get owner wallet
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    const owner = new ethers.Wallet(process.env.AAVE_DEPLOYER_PRIVATE_KEY, provider);
    
    console.log(`Manager: ${managerAddress}`);
    console.log(`Owner: ${owner.address}`);
    
    // Get manager contract
    const manager = await ethers.getContractAt("AAVEManager", managerAddress, owner);
    
    // Check balances
    const usdcBalance = await manager.getUSDCBalance();
    console.log(`\nManager USDC balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
    
    const aaveBalance = await manager.getAAVEBalance();
    console.log(`Manager AAVE balance (aUSDC): ${ethers.formatUnits(aaveBalance, 6)} aUSDC`);
    
    if (aaveBalance === 0n) {
        console.log("\nNo funds in AAVE to withdraw");
        return;
    }
    
    // Emergency withdraw from AAVE
    console.log(`\nWithdrawing ${ethers.formatUnits(aaveBalance, 6)} USDC from AAVE...`);
    const tx = await manager.emergencyWithdrawFromAAVE(aaveBalance);
    await tx.wait();
    
    console.log("✅ Withdrawn from AAVE");
    
    // Check final balances
    const finalUsdcBalance = await manager.getUSDCBalance();
    const finalAaveBalance = await manager.getAAVEBalance();
    
    console.log(`\nFinal Manager USDC balance: ${ethers.formatUnits(finalUsdcBalance, 6)} USDC`);
    console.log(`Final Manager AAVE balance: ${ethers.formatUnits(finalAaveBalance, 6)} aUSDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

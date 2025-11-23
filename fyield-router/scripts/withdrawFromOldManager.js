const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Withdrawing USDC from old AAVEManager");
    
    const oldManagerAddress = process.env.MAINNET_MANAGER_ADDRESS;
    console.log(`Old Manager: ${oldManagerAddress}`);
    
    // Get owner wallet
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    const owner = new ethers.Wallet(process.env.AAVE_DEPLOYER_PRIVATE_KEY, provider);
    
    console.log(`Owner: ${owner.address}`);
    
    // Get manager contract
    const manager = await ethers.getContractAt("AAVEManager", oldManagerAddress, owner);
    
    // Check USDC balance
    const usdcBalance = await manager.getUSDCBalance();
    console.log(`USDC in manager: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
    
    if (usdcBalance === 0n) {
        console.log("No USDC to withdraw");
        return;
    }
    
    // Withdraw all USDC
    console.log("\nWithdrawing USDC...");
    const tx = await manager.emergencyWithdrawUSDC(usdcBalance);
    await tx.wait();
    
    console.log("✅ USDC withdrawn to owner address");
    
    // Verify
    const finalBalance = await manager.getUSDCBalance();
    console.log(`Remaining in manager: ${ethers.formatUnits(finalBalance, 6)} USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

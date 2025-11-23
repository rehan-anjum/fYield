const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Funding AAVEManager with USDC on Mainnet");
    
    const managerAddress = process.env.MAINNET_MANAGER_ADDRESS;
    const usdcAddress = process.env.MAINNET_USDC;
    const amount = ethers.parseUnits("2", 6); // 2 USDC
    
    console.log(`Manager: ${managerAddress}`);
    console.log(`USDC: ${usdcAddress}`);
    console.log(`Amount: 2 USDC`);
    
    // Get deployer wallet
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    const deployer = new ethers.Wallet(process.env.AAVE_DEPLOYER_PRIVATE_KEY, provider);
    
    console.log(`\nDeployer: ${deployer.address}`);
    
    // Check USDC balance
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer);
    const balance = await usdc.balanceOf(deployer.address);
    console.log(`Deployer USDC balance: ${ethers.formatUnits(balance, 6)} USDC`);
    
    if (balance < amount) {
        console.error("❌ Insufficient USDC balance");
        return;
    }
    
    // Get AAVEManager
    const manager = await ethers.getContractAt("AAVEManager", managerAddress, deployer);
    
    // Approve USDC
    console.log("\nApproving USDC...");
    const approveTx = await usdc.approve(managerAddress, amount);
    await approveTx.wait();
    console.log("✅ Approved");
    
    // Deposit USDC
    console.log("\nDepositing USDC to AAVEManager...");
    const depositTx = await manager.depositUSDC(amount);
    await depositTx.wait();
    console.log("✅ Deposited");
    
    // Check manager balance
    const managerBalance = await manager.getUSDCBalance();
    console.log(`\n✅ AAVEManager USDC balance: ${ethers.formatUnits(managerBalance, 6)} USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

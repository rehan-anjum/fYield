const hre = require("hardhat");

async function main() {
    console.log("Checking Mainnet AAVE Manager Status");

    const [deployer] = await ethers.getSigners();

    const MAINNET_MANAGER_ADDRESS = process.env.MAINNET_MANAGER_ADDRESS;

    if (!MAINNET_MANAGER_ADDRESS) {
        console.error("Missing MAINNET_MANAGER_ADDRESS");
        process.exit(1);
    }

    const manager = await ethers.getContractAt("AAVEManager", MAINNET_MANAGER_ADDRESS);
    
    const totalSupplied = await manager.totalSupplied();
    const totalWithdrawn = await manager.totalWithdrawn();
    const aaveBalance = await manager.getAAVEBalance();
    const usdcBalance = await manager.getUSDCBalance();
    const totalYield = await manager.getTotalYieldEarned();

    console.log("\nStats:");
    console.log("Total Supplied:", ethers.formatUnits(totalSupplied, 6), "USDC");
    console.log("Total Withdrawn:", ethers.formatUnits(totalWithdrawn, 6), "USDC");
    console.log("AAVE Balance:", ethers.formatUnits(aaveBalance, 6), "USDC");
    console.log("USDC in Manager:", ethers.formatUnits(usdcBalance, 6), "USDC");
    console.log("Total Yield:", ethers.formatUnits(totalYield, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

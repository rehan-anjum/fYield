const hre = require("hardhat");

async function main() {
    console.log("Deploying AAVEManager to Ethereum Mainnet");
    console.log("⚠️  WARNING: This will use REAL ETH and interact with REAL AAVE");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Ethereum Mainnet AAVE V3 addresses
    const MAINNET_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Real USDC
    const MAINNET_AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"; // AAVE V3 Pool
    const MAINNET_AUSDC = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c"; // aUSDC token

    console.log("Using USDC:", MAINNET_USDC);
    console.log("AAVE Pool:", MAINNET_AAVE_POOL);
    console.log("aUSDC:", MAINNET_AUSDC);

    const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS || deployer.address;

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("\nDeployer ETH balance:", ethers.formatEther(balance));

    console.log("\nDeploying AAVEManager...");
    const AAVEManager = await ethers.getContractFactory("AAVEManager");
    const manager = await AAVEManager.deploy(
        MAINNET_USDC,
        MAINNET_AAVE_POOL,
        MAINNET_AUSDC,
        OPERATOR_ADDRESS,
        {
            gasLimit: 3000000  // Increase gas limit
        }
    );
    await manager.waitForDeployment();
    const managerAddress = await manager.getAddress();
    
    console.log("✅ AAVEManager deployed:", managerAddress);

    console.log("\n📝 Add to .env:");
    console.log(`MAINNET_MANAGER_ADDRESS=${managerAddress}`);
    console.log(`MAINNET_USDC=${MAINNET_USDC}`);
    
    console.log("\n⚠️  NEXT STEPS:");
    console.log("1. Transfer REAL USDC to the manager:", managerAddress);
    console.log("2. Update API to use mainnet RPC");
    console.log("3. Be careful - this uses real money!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

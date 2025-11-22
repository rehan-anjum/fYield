const hre = require("hardhat");

async function main() {
    console.log("Deploying AAVEManager to Sepolia");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const SEPOLIA_USDC = process.env.SEPOLIA_USDC || "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
    const SEPOLIA_AAVE_POOL = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
    const SEPOLIA_AUSDC = "0x16dA4541aD1807f4443d92D26044C1147406EB80";

    console.log("Using USDC:", SEPOLIA_USDC);

    const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS || deployer.address;

    console.log("Deploying AAVEManager...");
    const AAVEManager = await ethers.getContractFactory("AAVEManager");
    const manager = await AAVEManager.deploy(
        SEPOLIA_USDC,
        SEPOLIA_AAVE_POOL,
        SEPOLIA_AUSDC,
        OPERATOR_ADDRESS
    );
    await manager.waitForDeployment();
    const managerAddress = await manager.getAddress();
    
    console.log("AAVEManager:", managerAddress);

    console.log("\nAdd to .env:");
    console.log(`SEPOLIA_MANAGER_ADDRESS=${managerAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

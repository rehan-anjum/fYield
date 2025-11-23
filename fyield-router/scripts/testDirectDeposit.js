const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Testing AAVEManager deposit directly");
    
    const managerAddress = process.env.MAINNET_MANAGER_ADDRESS;
    const testUser = "0x3fCfbB9d43d2da1b684e5ac9d04534e4240c08C7";
    const usdcAmount = ethers.parseUnits("2", 6); // 2 USDC
    
    // Get operator wallet
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    const operator = new ethers.Wallet(process.env.AAVE_DEPLOYER_PRIVATE_KEY, provider);
    
    console.log(`Manager: ${managerAddress}`);
    console.log(`Operator: ${operator.address}`);
    console.log(`Test user: ${testUser}`);
    console.log(`Amount: ${ethers.formatUnits(usdcAmount, 6)} USDC`);
    
    // Get manager contract
    const manager = await ethers.getContractAt("AAVEManager", managerAddress, operator);
    
    // Check balances
    const usdcBalance = await manager.getUSDCBalance();
    console.log(`\nManager USDC balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
    
    const aaveBalance = await manager.getAAVEBalance();
    console.log(`Manager AAVE balance: ${ethers.formatUnits(aaveBalance, 6)} aUSDC`);
    
    // Check operator
    const contractOperator = await manager.operator();
    console.log(`Contract operator: ${contractOperator}`);
    
    if (contractOperator.toLowerCase() !== operator.address.toLowerCase()) {
        console.error("❌ Operator mismatch!");
        return;
    }
    
    // Try deposit with error catching
    console.log(`\nAttempting deposit...`);
    try {
        const tx = await manager.deposit(usdcAmount, testUser, {
            gasLimit: 500000
        });
        console.log(`Transaction hash: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Success! Block: ${receipt.blockNumber}`);
    } catch (error) {
        console.error(`❌ Error:`, error.message);
        if (error.data) {
            console.error(`Error data:`, error.data);
        }
        if (error.reason) {
            console.error(`Reason:`, error.reason);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const hre = require("hardhat");
const { getAssetManagerFXRP } = require("../utils/getters");

async function main() {
    console.log("Testing FXRP Deposit");

    // Use test user - properly connect wallet to provider
    const provider = ethers.provider;
    const user = new ethers.Wallet(process.env.TEST_USER_PRIVATE_KEY, provider);
    console.log("Using test user:", user.address);

    // Load addresses from env
    const FLARE_VAULT_ADDRESS = process.env.FLARE_VAULT_ADDRESS;
    const assetManager = await getAssetManagerFXRP(provider);
    const FXRP_ADDRESS = await assetManager.fAsset();

    console.log("FXRP Token Address:", FXRP_ADDRESS);

    // Check balances first
    const c2flrBalance = await ethers.provider.getBalance(user.address);
    console.log("\n=== Balances ===");
    console.log("C2FLR balance:", ethers.formatEther(c2flrBalance), "C2FLR");
    
    const vault = await ethers.getContractAt("FlareVault", FLARE_VAULT_ADDRESS);
    const fxrp = await ethers.getContractAt("IERC20", FXRP_ADDRESS);

    // Connect contracts to user wallet
    const fxrpWithSigner = fxrp.connect(user);
    const vaultWithSigner = vault.connect(user);

    const fxrpBalance = await fxrp.balanceOf(user.address);
    console.log("FXRP balance:", ethers.formatUnits(fxrpBalance, 6));

    if (c2flrBalance === 0n) {
        console.log("\n❌ ERROR: No C2FLR for gas fees!");
        console.log("Send some C2FLR to:", user.address);
        return;
    }

    const depositAmount = ethers.parseUnits("1", 6);
    console.log("\nDeposit amount:", ethers.formatUnits(depositAmount, 6), "FXRP");

    if (fxrpBalance < depositAmount) {
        console.log("Insufficient FXRP, attempting to mint...");
        return
    }

    const vFxrpBefore = await vault.getUserBalance(user.address);

    console.log("Approving FXRP...");
    const approveTx = await fxrpWithSigner.approve(FLARE_VAULT_ADDRESS, depositAmount);
    await approveTx.wait();

    console.log("Depositing FXRP...");
    // ERC4626 deposit requires (assets, receiver)
    const depositTx = await vaultWithSigner.deposit(depositAmount, user.address);
    const receipt = await depositTx.wait();

    const vFxrpAfter = await vault.getUserBalance(user.address);
    console.log("\nvFXRP before:", ethers.formatUnits(vFxrpBefore, 6));
    console.log("vFXRP after:", ethers.formatUnits(vFxrpAfter, 6));
    console.log("Deposit successful!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

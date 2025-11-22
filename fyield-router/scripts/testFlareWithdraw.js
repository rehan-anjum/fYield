const hre = require("hardhat");

async function main() {
    console.log("Testing Withdrawal");

    const provider = ethers.provider;
    const user = new ethers.Wallet(process.env.TEST_USER_PRIVATE_KEY, provider);
    console.log("User:", user.address);

    const FLARE_VAULT_ADDRESS = process.env.FLARE_VAULT_ADDRESS;

    if (!FLARE_VAULT_ADDRESS) {
        console.error("Missing FLARE_VAULT_ADDRESS");
        process.exit(1);
    }

    const vault = await ethers.getContractAt("FlareVault", FLARE_VAULT_ADDRESS);
    const vaultWithSigner = vault.connect(user);

    const vFxrpBalance = await vault.getUserBalance(user.address);
    console.log("vFXRP balance:", ethers.formatUnits(vFxrpBalance, 6));

    if (vFxrpBalance === 0n) {
        console.error("No vFXRP balance to withdraw");
        process.exit(1);
    }

    const withdrawAmount = vFxrpBalance;
    console.log("Withdrawing:", ethers.formatUnits(withdrawAmount, 6), "vFXRP");

    console.log("Requesting withdrawal...");
    const withdrawTx = await vaultWithSigner.requestWithdraw(withdrawAmount);
    await withdrawTx.wait();

    console.log("Withdrawal request submitted!");
    console.log("Check API logs for processing status");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

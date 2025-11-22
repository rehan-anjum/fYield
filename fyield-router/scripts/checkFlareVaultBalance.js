const hre = require("hardhat");

async function main() {
    console.log("Checking FlareVault FXRP Balance");

    const FLARE_VAULT_ADDRESS = process.env.FLARE_VAULT_ADDRESS;
    const { getAssetManagerFXRP } = require("../utils/getters");
    
    const assetManager = await getAssetManagerFXRP();
    const FXRP_ADDRESS = await assetManager.fAsset();

    const fxrp = await ethers.getContractAt("IERC20", FXRP_ADDRESS);
    const vault = await ethers.getContractAt("FlareVault", FLARE_VAULT_ADDRESS);

    const vaultFxrpBalance = await fxrp.balanceOf(FLARE_VAULT_ADDRESS);
    console.log("Vault FXRP balance:", ethers.formatUnits(vaultFxrpBalance, 6));

    // Check total vFXRP supply
    const totalSupply = await vault.totalSupply();
    console.log("Total vFXRP supply:", ethers.formatUnits(totalSupply, 6));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

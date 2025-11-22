const { ethers } = require("hardhat");
const hre = require("hardhat");

const FLARE_CONTRACT_REGISTRY_ADDRESS = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

// Minimal ABIs for Flare contracts
const FLARE_CONTRACT_REGISTRY_ABI = [
	"function getContractAddressByName(string memory _name) external view returns (address)",
	"function getContractAddressByHash(bytes32 _nameHash) external view returns (address)"
];

const ASSET_MANAGER_ABI = [
	"function fAsset() external view returns (address)"
];

// Helper function to get contract instance at address
async function getContractAt(contractName, address) {
	// For Flare contracts, use ABIs directly
	if (contractName === "IFlareContractRegistry") {
		return new ethers.Contract(address, FLARE_CONTRACT_REGISTRY_ABI, await ethers.provider.getSigner());
	}
	if (contractName === "IAssetManager") {
		return new ethers.Contract(address, ASSET_MANAGER_ABI, await ethers.provider.getSigner());
	}
	// For local contracts, use Hardhat's getContractAt
	return await ethers.getContractAt(contractName, address);
}

async function getFlareContractRegistry() {
	return await getContractAt("IFlareContractRegistry", FLARE_CONTRACT_REGISTRY_ADDRESS);
}

async function getContractAddressByName(name) {
	const flareContractRegistry = await getFlareContractRegistry();
	return await flareContractRegistry.getContractAddressByName(name);
}

async function getPriceSubmitter() {
	const address = await getContractAddressByName("PriceSubmitter");
	return await getContractAt("IPriceSubmitter", address);
}

async function getGovernanceSettings() {
	const address = await getContractAddressByName("GovernanceSettings");
	return await getContractAt("IGovernanceSettings", address);
}

async function getFtsoRewardManager() {
	const address = await getContractAddressByName("FtsoRewardManager");
	return await getContractAt("IFtsoRewardManager", address);
}

async function getFtsoRegistry() {
	const address = await getContractAddressByName("FtsoRegistry");
	return await getContractAt("IFtsoRegistry", address);
}

async function getVoterWhitelister() {
	const address = await getContractAddressByName("VoterWhitelister");
	return await getContractAt("IVoterWhitelister", address);
}

async function getFtsoManager() {
	const address = await getContractAddressByName("FtsoManager");
	return await getContractAt("IFtsoManager", address);
}

async function getWNat() {
	const address = await getContractAddressByName("WNat");
	return await getContractAt("IWNat", address);
}

async function getGovernanceVotePower() {
	const address = await getContractAddressByName("GovernanceVotePower");
	return await getContractAt("IGovernanceVotePower", address);
}

async function getClaimSetupManager() {
	const address = await getContractAddressByName("ClaimSetupManager");
	return await getContractAt("IClaimSetupManager", address);
}

async function getFlareAssetRegistry() {
	const address = await getContractAddressByName("FlareAssetRegistry");
	return await getContractAt("IFlareAssetRegistry", address);
}

async function getSubmission() {
	const address = await getContractAddressByName("Submission");
	return await getContractAt("ISubmission", address);
}

async function getEntityManager() {
	const address = await getContractAddressByName("EntityManager");
	return await getContractAt("IEntityManager", address);
}

async function getVoterRegistry() {
	const address = await getContractAddressByName("VoterRegistry");
	return await getContractAt("IVoterRegistry", address);
}

async function getFlareSystemsCalculator() {
	const address = await getContractAddressByName("FlareSystemsCalculator");
	return await getContractAt("IFlareSystemsCalculator", address);
}

async function getFlareSystemsManager() {
	const address = await getContractAddressByName("FlareSystemsManager");
	return await getContractAt("IFlareSystemsManager", address);
}

async function getRewardManager() {
	const address = await getContractAddressByName("RewardManager");
	return await getContractAt("IRewardManager", address);
}

async function getRelay() {
	const address = await getContractAddressByName("Relay");
	return await getContractAt("IRelay", address);
}

async function getWNatDelegationFee() {
	const address = await getContractAddressByName("WNatDelegationFee");
	return await getContractAt("IWNatDelegationFee", address);
}

async function getFtsoInflationConfigurations() {
	const address = await getContractAddressByName("FtsoInflationConfigurations");
	return await getContractAt("IFtsoInflationConfigurations", address);
}

async function getFtsoRewardOffersManager() {
	const address = await getContractAddressByName("FtsoRewardOffersManager");
	return await getContractAt("IFtsoRewardOffersManager", address);
}

async function getFtsoFeedDecimals() {
	const address = await getContractAddressByName("FtsoFeedDecimals");
	return await getContractAt("IFtsoFeedDecimals", address);
}

async function getFtsoFeedPublisher() {
	const address = await getContractAddressByName("FtsoFeedPublisher");
	return await getContractAt("IFtsoFeedPublisher", address);
}

async function getFtsoFeedIdConverter() {
	const address = await getContractAddressByName("FtsoFeedIdConverter");
	return await getContractAt("IFtsoFeedIdConverter", address);
}

async function getFastUpdateIncentiveManager() {
	const address = await getContractAddressByName("FastUpdateIncentiveManager");
	return await getContractAt("IFastUpdateIncentiveManager", address);
}

async function getFastUpdater() {
	const address = await getContractAddressByName("FastUpdater");
	return await getContractAt("IFastUpdater", address);
}

async function getFastUpdatesConfiguration() {
	const address = await getContractAddressByName("FastUpdatesConfiguration");
	return await getContractAt("IFastUpdatesConfiguration", address);
}

async function getFeeCalculator() {
	const address = await getContractAddressByName("FeeCalculator");
	return await getContractAt("IFeeCalculator", address);
}

async function getFtsoV2() {
	const address = await getContractAddressByName("FtsoV2");
	return await getContractAt("FtsoV2Interface", address);
}

async function getTestFtsoV2() {
	const address = await getContractAddressByName("TestFtsoV2");
	return await getContractAt("TestFtsoV2Interface", address);
}

async function getProtocolsV2() {
	const address = await getContractAddressByName("ProtocolsV2");
	return await getContractAt("ProtocolsV2Interface", address);
}

async function getRandomNumberV2() {
	const address = await getContractAddressByName("RandomNumberV2");
	return await getContractAt("RandomNumberV2Interface", address);
}

async function getRewardsV2() {
	const address = await getContractAddressByName("RewardsV2");
	return await getContractAt("RewardsV2Interface", address);
}

async function getFdcVerification() {
	const address = await getContractAddressByName("FdcVerification");
	return await getContractAt("IFdcVerification", address);
}

async function getFdcHub() {
	const address = await getContractAddressByName("FdcHub");
	return await getContractAt("IFdcHub", address);
}

async function getFdcRequestFeeConfigurations() {
	const address = await getContractAddressByName("FdcRequestFeeConfigurations");
	return await getContractAt("IFdcRequestFeeConfigurations", address);
}

async function getAssetManagerController() {
	const address = await getContractAddressByName("AssetManagerController");
	return await getContractAt("IAssetManagerController", address);
}

async function getAssetManagerFXRP() {
	const validNetworks = ["coston2", "coston", "songbird", "flare"];
	if (!validNetworks.includes(hre.network.name)) {
		throw new Error(`Contract not deployed on ${hre.network.name}`);
	}
	const address = await getContractAddressByName("AssetManagerFXRP");
	return await getContractAt("IAssetManager", address);
}

async function getJsonApiVerification() {
	const validNetworks = ["coston2", "coston", "songbird", "flare"];
	if (!validNetworks.includes(hre.network.name)) {
		throw new Error(`Contract not deployed on ${hre.network.name}`);
	}
	const address = await getContractAddressByName("JsonApiVerification");
	return await getContractAt("IJsonApiVerification", address);
}

module.exports = {
	getFlareContractRegistry,
	getContractAddressByName,
	getPriceSubmitter,
	getGovernanceSettings,
	getFtsoRewardManager,
	getFtsoRegistry,
	getVoterWhitelister,
	getFtsoManager,
	getWNat,
	getGovernanceVotePower,
	getClaimSetupManager,
	getFlareAssetRegistry,
	getSubmission,
	getEntityManager,
	getVoterRegistry,
	getFlareSystemsCalculator,
	getFlareSystemsManager,
	getRewardManager,
	getRelay,
	getWNatDelegationFee,
	getFtsoInflationConfigurations,
	getFtsoRewardOffersManager,
	getFtsoFeedDecimals,
	getFtsoFeedPublisher,
	getFtsoFeedIdConverter,
	getFastUpdateIncentiveManager,
	getFastUpdater,
	getFastUpdatesConfiguration,
	getFeeCalculator,
	getFtsoV2,
	getTestFtsoV2,
	getProtocolsV2,
	getRandomNumberV2,
	getRewardsV2,
	getFdcVerification,
	getFdcHub,
	getFdcRequestFeeConfigurations,
	getAssetManagerController,
	getAssetManagerFXRP,
	getJsonApiVerification
};
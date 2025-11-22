# Deployment Guide

Complete step-by-step guide to deploy and test the FXRP Yield Router.

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] Git repository cloned
- [ ] Private key with funds on Coston2 (~10 C2FLR for gas)
- [ ] Private key with funds on Sepolia (~0.1 ETH for gas)
- [ ] Infura or Alchemy API key for Sepolia
- [ ] Sepolia USDC from Circle faucet

## Step 1: Environment Setup

1. Clone and install:
```bash
cd fyield-router
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Fill in your private keys and Sepolia RPC:
```env
PRIVATE_KEY=0x...
OPERATOR_PRIVATE_KEY=0x...  # Can be same as PRIVATE_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

## Step 2: Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled X Solidity file successfully
```

## Step 3: Deploy to Coston2 (Flare Testnet)

```bash
npm run deploy:coston2
```

Expected output:
```
🚀 Deploying FlareVault to coston2
===============================

Deployer: 0x...
Balance: 10.5 FLR

📍 Network: Coston2 Testnet
✓ Using real FXRP from AssetManager: 0x...

Deploying mock USDC for yield...
✓ Mock USDC deployed: 0x...
Operator: 0x...

📦 Deploying FlareVault...
✅ FlareVault deployed: 0x...

🔍 Verifying deployment...
  FXRP: 0x...
  USDC: 0x...
  Operator: 0x...
  Owner: 0x...

==================================================
🎉 Deployment Complete!
==================================================

📝 Add these to your .env file:

FLARE_VAULT_ADDRESS=0x...
FXRP_ADDRESS=0x...
USDC_ADDRESS=0x...
OPERATOR_ADDRESS=0x...
```

**Action**: Copy the addresses and add them to your `.env` file.

## Step 4: Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Expected output:
```
🚀 Deploying SepoliaAAVEManager to Sepolia
==========================================

Deployer: 0x...
Balance: 0.15 ETH

📍 Using AAVE V3 on Sepolia:
  USDC: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
  AAVE Pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
  aUSDC: 0x16dA4541aD1807f4443d92D26044C1147406EB80
  Operator: 0x...

📦 Deploying SepoliaAAVEManager...
✅ SepoliaAAVEManager deployed: 0x...

==================================================
🎉 Deployment Complete!
==================================================

📝 Add these to your .env file:

SEPOLIA_MANAGER_ADDRESS=0x...
```

**Action**: Copy the address and add it to your `.env` file.

## Step 5: Fund Sepolia Manager with USDC

### Get Sepolia USDC:
1. Visit https://faucet.circle.com/
2. Select Sepolia testnet
3. Enter your address
4. Request 1000 USDC

### Fund the Manager:
```bash
npx hardhat console --network sepolia
```

In the console:
```javascript
// Connect to USDC contract
const usdc = await ethers.getContractAt(
  "IERC20", 
  "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"
);

// Connect to manager
const manager = await ethers.getContractAt(
  "SepoliaAAVEManager", 
  process.env.SEPOLIA_MANAGER_ADDRESS
);

// Check your USDC balance
const balance = await usdc.balanceOf((await ethers.getSigners())[0].address);
console.log("Your USDC:", ethers.formatUnits(balance, 6));

// Approve manager to spend USDC
await usdc.approve(manager.target, ethers.parseUnits("1000", 6));
console.log("✓ Approved");

// Deposit USDC to manager
await manager.depositUSDC(ethers.parseUnits("1000", 6));
console.log("✓ Deposited 1000 USDC");

// Verify
const managerBalance = await usdc.balanceOf(manager.target);
console.log("Manager USDC:", ethers.formatUnits(managerBalance, 6));
```

Exit console: `.exit`

## Step 6: Verify Manager Funding

```bash
npx hardhat run scripts/checkSepoliaStatus.js --network sepolia
```

Expected output:
```
🧪 Checking Sepolia AAVE Manager Status
========================================

Querying as: 0x...
Manager address: 0x...

📊 Manager Stats:
  Total Supplied: 0.0 USDC
  Total Withdrawn: 0.0 USDC
  AAVE Balance (aUSDC): 0.0 USDC
  USDC in Manager: 1000.0 USDC  ← Should show your deposited USDC
  Total Yield Earned: 0.0 USDC

⚙️ Configuration:
  USDC: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
  AAVE Pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
  aUSDC: 0x16dA4541aD1807f4443d92D26044C1147406EB80
  Operator: 0x...
  Owner: 0x...

✅ Status check complete!
```

**Verify**: Manager should show 1000 USDC balance.

## Step 7: Start API Server

In a new terminal:
```bash
npm run api
```

Expected output:
```
🚀 FXRP Yield Router API Starting...
Flare Vault: 0x...
Sepolia Manager: 0x...
Operator Address: 0x...

✅ API Server running on port 3000
📍 Health check: http://localhost:3000/health

👀 Watching for deposits on Flare...
👀 Watching for withdrawal requests on Flare...
✅ Event listeners started
```

**Keep this terminal open** - the API must run to process cross-chain operations.

## Step 8: Test Deposit

In another terminal:
```bash
npx hardhat run scripts/testFlareDeposit.js --network coston2
```

Expected output:
```
🧪 Testing FXRP Deposit on Flare
=================================

User address: 0x...
Vault address: 0x...
FXRP address: 0x...

📊 Deposit amount: 100.0 FXRP
Your FXRP balance: 1000.0
Your vFXRP balance: 0.0

📝 Approving FXRP...
✓ Approved

💰 Depositing FXRP to vault...
Transaction sent: 0x...
✓ Deposit confirmed in block: 12345

📊 Results:
  vFXRP before: 0.0
  vFXRP after: 100.0
  vFXRP received: 100.0

✅ Deposit successful!
```

**Check API logs** - you should see:
```
📥 New deposit detected!
  User: 0x...
  FXRP Amount: 100.0
  USDC Equivalent: 100.0
  🔄 Supplying USDC to AAVE on Sepolia...
  ✅ Successfully supplied to AAVE
  Tx Hash: 0x...
```

## Step 9: Verify AAVE Supply

```bash
curl http://localhost:3000/stats
```

Expected response:
```json
{
  "totalSupplied": "100.0",
  "aaveBalance": "100.0",
  "totalYield": "0.0"
}
```

Check your balance:
```bash
curl http://localhost:3000/balance/YOUR_ADDRESS
```

Expected response:
```json
{
  "vFxrpBalance": "100.0",
  "usdcSupplied": "100.0",
  "yieldEarned": "0.0"
}
```

## Step 10: Wait for Yield (Optional)

AAVE on Sepolia accrues yield in real-time. Wait a few hours/days and check again:

```bash
curl http://localhost:3000/stats
```

You should see `totalYield` increase slightly:
```json
{
  "totalSupplied": "100.0",
  "aaveBalance": "100.052",
  "totalYield": "0.052"
}
```

## Step 11: Test Withdrawal

```bash
npx hardhat run scripts/testFlareWithdraw.js --network coston2
```

Expected output:
```
🧪 Testing Withdrawal from Flare
==================================

User address: 0x...
Vault address: 0x...

📊 Your vFXRP balance: 100.0
Withdrawing: 100.0 vFXRP

📤 Requesting withdrawal...
Transaction sent: 0x...
✓ Withdrawal requested in block: 12350

📋 Withdrawal Request Details:
  User: 0x...
  Amount: 100.0 vFXRP
  Timestamp: 2025-11-21T10:30:00.000Z

✅ Withdrawal request submitted!

⏳ Waiting for API to process...
Monitor API server logs for completion
```

**Check API logs**:
```
📤 Withdrawal requested!
  User: 0x...
  vFXRP Amount: 100.0
  USDC Principal: 100.0
  🔄 Withdrawing from AAVE on Sepolia...
  💰 Yield earned: 0.052 USDC
  🔄 Completing withdrawal on Flare...
  ✅ Withdrawal completed successfully
  Flare Tx Hash: 0x...
  User received: 100.0 FXRP + 0.052 USDC
```

## Step 12: Verify Balances

Check FXRP balance (should be back to original):
```bash
npx hardhat console --network coston2

> const fxrp = await ethers.getContractAt("IERC20", process.env.FXRP_ADDRESS)
> const balance = await fxrp.balanceOf("YOUR_ADDRESS")
> console.log("FXRP:", ethers.formatUnits(balance, 18))
```

Check USDC balance (should have received yield):
```bash
> const usdc = await ethers.getContractAt("IERC20", process.env.USDC_ADDRESS)
> const balance = await usdc.balanceOf("YOUR_ADDRESS")
> console.log("USDC:", ethers.formatUnits(balance, 6))
```

Expected: `0.052 USDC` (or however much yield accrued)

## Troubleshooting

### Deposit not appearing in API
- Ensure API is running
- Check `.env` addresses match deployed contracts
- Verify operator has gas on both chains
- Check API logs for errors

### AAVE supply failing
- Verify manager has USDC balance
- Check manager approval to AAVE (should be auto-approved on deployment)
- Ensure Sepolia RPC is working

### Withdrawal not completing
- Check API logs for errors
- Verify vault has USDC for yield distribution
- Ensure operator has gas on Flare

### No yield accruing
- AAVE yield on testnets is often very low
- Wait longer (hours/days)
- Or use manual testing: directly add USDC to aUSDC mock

## Next Steps

### Production Deployment
1. Deploy to Flare mainnet (not Coston2)
2. Use real USDC on Flare if available
3. Consider cross-chain bridge instead of centralized API
4. Implement multi-sig for operator
5. Add proper monitoring and alerting
6. Audit all smart contracts

### Testing at Scale
1. Test with multiple users
2. Test large deposits/withdrawals
3. Test edge cases (zero yield, insufficient USDC, etc.)
4. Load test the API
5. Test API downtime recovery

## Support

For issues or questions:
- Check the main README.md
- Review contract events on block explorers
- Check API logs for detailed error messages
- Verify all environment variables are set correctly

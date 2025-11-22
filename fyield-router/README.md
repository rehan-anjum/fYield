# FXRP Yield Router

A dual-chain yield routing system that allows users to deposit FXRP on Flare Network and automatically earn yield from AAVE on Ethereum Sepolia.

## Architecture Overview

This system uses an **off-chain API bridge** to connect two separate blockchain networks:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
│                                                                     │
│  1. User deposits FXRP → FlareVault (Flare/Coston2)                 │
│  2. User receives vFXRP receipt tokens                              │
│  3. User requests withdrawal → API processes                        │
│  4. User receives FXRP + USDC yield                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      OFF-CHAIN API SERVICE                          │
│                                                                     │
│  • Watches FlareVault for Deposit events                            │
│  • Calculates USDC equivalent                                       │
│  • Calls SepoliaAAVEManager to supply to AAVE                       │
│  • Watches for WithdrawRequested events                             │
│  • Withdraws from AAVE (principal + yield)                          │
│  • Completes withdrawal on Flare                                    │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐         ┌──────────────────────────┐
│   Flare/Coston2       │         │    Ethereum Sepolia      │
│                       │         │                          │
│  FlareVault.sol       │         │  SepoliaAAVEManager.sol  │
│  - Accept FXRP        │◄───────►│  - Hold USDC             │
│  - Mint vFXRP         │   API   │  - Supply to AAVE        │
│  - Track balances     │         │  - Track yield           │
│  - Distribute yield   │         │  - Withdraw from AAVE    │
└───────────────────────┘         └──────────────────────────┘
```

## Components

### 1. FlareVault (Flare/Coston2)
- **Location**: Deployed on Flare mainnet or Coston2 testnet
- **Purpose**: User-facing vault that accepts FXRP deposits
- **Features**:
  - Users deposit FXRP, receive 1:1 vFXRP tokens
  - Emits events that API monitors
  - Operator (API) can complete withdrawals
  - Distributes USDC yield to users

### 2. SepoliaAAVEManager (Sepolia)
- **Location**: Deployed on Ethereum Sepolia testnet
- **Purpose**: Manages USDC and interacts with real AAVE protocol
- **Features**:
  - Supplies USDC to AAVE V3
  - Tracks user deposits and yields
  - Withdraws from AAVE (principal + yield)
  - Operator-only access for security

### 3. Off-Chain API Service
- **Technology**: Node.js + Express + ethers.js
- **Purpose**: Bridge between Flare and Sepolia chains
- **Features**:
  - Event listeners for deposits/withdrawals
  - Automatic USDC supply to AAVE
  - Yield calculation and distribution
  - REST API for status queries

## Setup Instructions

### Prerequisites
- Node.js v18+
- Hardhat
- Flare/Coston2 testnet access
- Sepolia testnet access (Infura/Alchemy)
- Private key with funds on both networks
- Sepolia USDC (from Circle faucet)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file:
```env
# Private Keys
PRIVATE_KEY=your_private_key_here
OPERATOR_PRIVATE_KEY=same_or_different_key

# Network RPCs
FLARE_RPC_URL=https://flare-api.flare.network/ext/C/rpc
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract Addresses (filled after deployment)
FLARE_VAULT_ADDRESS=
SEPOLIA_MANAGER_ADDRESS=
FXRP_ADDRESS=
USDC_ADDRESS=
OPERATOR_ADDRESS=

# Sepolia AAVE Addresses
SEPOLIA_USDC=0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
SEPOLIA_AAVE_POOL=0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
SEPOLIA_AUSDC=0x16dA4541aD1807f4443d92D26044C1147406EB80

# API Configuration
PORT=3000
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Deploy Contracts

#### Deploy FlareVault on Coston2/Flare:
```bash
npm run deploy:coston2
# OR for mainnet:
npm run deploy:flare
```

Save the output addresses to `.env`:
- `FLARE_VAULT_ADDRESS`
- `FXRP_ADDRESS`
- `USDC_ADDRESS`

#### Deploy SepoliaAAVEManager on Sepolia:
```bash
npm run deploy:sepolia
```

Save the output address to `.env`:
- `SEPOLIA_MANAGER_ADDRESS`

### 5. Fund SepoliaAAVEManager

Get Sepolia USDC from Circle faucet: https://faucet.circle.com/

Then fund the manager:
```bash
# In Hardhat console on Sepolia
npx hardhat console --network sepolia

> const usdc = await ethers.getContractAt("IERC20", "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8")
> const manager = await ethers.getContractAt("SepoliaAAVEManager", process.env.SEPOLIA_MANAGER_ADDRESS)
> await usdc.approve(manager.address, ethers.parseUnits("1000", 6))
> await manager.depositUSDC(ethers.parseUnits("1000", 6))
```

### 6. Start API Server
```bash
npm run api
```

The API will:
- Listen for deposits on Flare
- Automatically supply USDC to AAVE on Sepolia
- Listen for withdrawal requests
- Process withdrawals with yield

## Usage

### Deposit FXRP
```bash
npx hardhat run scripts/testFlareDeposit.js --network coston2
```

This will:
1. Deposit 100 FXRP to FlareVault
2. Receive 100 vFXRP tokens
3. Trigger API to supply 100 USDC to AAVE on Sepolia

### Check Status
```bash
# Via API
curl http://localhost:3000/balance/YOUR_ADDRESS
curl http://localhost:3000/stats

# Via Sepolia contract
npx hardhat run scripts/checkSepoliaStatus.js --network sepolia
```

### Withdraw
```bash
npx hardhat run scripts/testFlareWithdraw.js --network coston2
```

This will:
1. Request withdrawal from FlareVault
2. Trigger API to withdraw from AAVE (principal + yield)
3. Receive FXRP + USDC yield back

## API Endpoints

### GET /health
Health check and configuration
```json
{
  "status": "ok",
  "flareVault": "0x...",
  "sepoliaManager": "0x...",
  "operator": "0x..."
}
```

### GET /balance/:address
Get user's balance and yield
```json
{
  "vFxrpBalance": "100.0",
  "usdcSupplied": "100.0",
  "yieldEarned": "5.2"
}
```

### GET /stats
Get total system statistics
```json
{
  "totalSupplied": "1000.0",
  "aaveBalance": "1052.3",
  "totalYield": "52.3"
}
```

### POST /manual/deposit
Manually trigger deposit (testing)
```json
{
  "user": "0x...",
  "fxrpAmount": "100"
}
```

### POST /manual/withdraw
Manually trigger withdrawal (testing)
```json
{
  "user": "0x...",
  "vFxrpAmount": "100"
}
```

## Smart Contract Details

### FlareVault Events
- `Deposit(address user, uint256 fxrpAmount, uint256 timestamp)`
- `WithdrawRequested(address user, uint256 vFxrpAmount, uint256 timestamp)`
- `WithdrawCompleted(address user, uint256 fxrpAmount, uint256 usdcYield)`
- `YieldDistributed(address user, uint256 usdcAmount)`

### SepoliaAAVEManager Events
- `USDCSupplied(address flareUser, uint256 amount, uint256 timestamp)`
- `USDCWithdrawn(address flareUser, uint256 amount, uint256 yieldAmount)`
- `YieldHarvested(uint256 amount)`

## Security Considerations

⚠️ **This is a DEMO/POC implementation** with the following limitations:

1. **Centralization**: Off-chain API has full control
2. **Trust Required**: Users must trust the operator
3. **No Atomicity**: Cross-chain operations are not atomic
4. **API Downtime Risk**: If API goes down, operations are paused
5. **No Bridge Security**: Manual bridge vs. trustless bridge protocols

### For Production:
- Use proper cross-chain bridges (LayerZero, Axelar, Wormhole)
- Implement multi-sig for operator
- Add timelock contracts
- Use decentralized oracle networks
- Audit all smart contracts
- Add emergency pause mechanisms
- Implement proper access controls

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
1. Deploy both contracts
2. Start API server
3. Run deposit script
4. Wait for AAVE supply confirmation
5. Check yield accrual (wait some time)
6. Run withdrawal script
7. Verify FXRP + USDC received

## Troubleshooting

### API not detecting deposits
- Check that contracts are deployed correctly
- Verify `.env` addresses match deployed contracts
- Ensure API has gas on both networks
- Check RPC URLs are correct

### AAVE supply failing
- Verify SepoliaAAVEManager has USDC
- Check USDC approval to AAVE pool (should be max on deployment)
- Ensure AAVE addresses are correct

### Withdrawal not completing
- Check API logs for errors
- Verify operator has gas on Flare
- Ensure FlareVault has USDC for yield distribution

## Resources

- [Flare Network Docs](https://docs.flare.network/)
- [AAVE V3 Docs](https://docs.aave.com/developers/getting-started/readme)
- [Sepolia Faucets](https://sepoliafaucet.com/)
- [Circle USDC Faucet](https://faucet.circle.com/)

## License

MIT

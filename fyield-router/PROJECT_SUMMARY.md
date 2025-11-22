# Project Summary

## What We Built

A **dual-chain yield router** that bridges FXRP deposits on Flare Network with AAVE lending on Ethereum Sepolia.

## Architecture

### Smart Contracts

1. **FlareVault.sol** (Deployed on Flare/Coston2)
   - Accepts FXRP deposits from users
   - Mints vFXRP receipt tokens 1:1
   - Emits events for off-chain API
   - Allows operator to complete withdrawals
   - Distributes USDC yield to users

2. **SepoliaAAVEManager.sol** (Deployed on Sepolia)
   - Holds USDC and interacts with real AAVE V3
   - Supplies USDC to AAVE earning yield
   - Tracks user deposits and proportional yields
   - Withdraws from AAVE (principal + yield)
   - Operator-only access control

3. **ERC20Mock.sol** (Testing utility)
   - Mock ERC20 for testing
   - Configurable decimals
   - Mint/burn functions for testing

### Off-Chain API Service

**Technology Stack:**
- Node.js + Express
- ethers.js v6
- Event listeners for both chains

**Features:**
- Watches FlareVault for Deposit events
- Automatically supplies equivalent USDC to AAVE on Sepolia
- Watches for WithdrawRequested events
- Withdraws from AAVE with yield
- Completes withdrawals on Flare
- REST API for status queries

### Deployment Scripts

- `deployFlare.js` - Deploys FlareVault to Flare/Coston2
- `deploySepolia.js` - Deploys SepoliaAAVEManager to Sepolia
- `testFlareDeposit.js` - Test FXRP deposit
- `testFlareWithdraw.js` - Test withdrawal request
- `checkSepoliaStatus.js` - Check AAVE manager status

## User Flow

1. **Deposit:**
   ```
   User → Deposit FXRP → FlareVault (Coston2)
           ↓
   Receive vFXRP tokens
           ↓
   API detects event → Supplies USDC → AAVE (Sepolia)
   ```

2. **Yield Accrual:**
   ```
   AAVE automatically accrues yield on supplied USDC
   User can check yield via API
   ```

3. **Withdrawal:**
   ```
   User → Request withdrawal → FlareVault (Coston2)
           ↓
   API detects event → Withdraws from AAVE (principal + yield)
           ↓
   API completes withdrawal → User receives FXRP + USDC yield
   ```

## Key Features

✅ **Real FXRP Integration:** Uses Flare's AssetManager to get real FXRP token  
✅ **Real AAVE Integration:** Connects to AAVE V3 on Sepolia testnet  
✅ **Automatic Yield:** USDC automatically supplies to AAVE, earns yield  
✅ **Event-Driven:** API watches blockchain events, no polling  
✅ **REST API:** Query balances and stats via HTTP  
✅ **Operator Pattern:** Secure operator-only functions  
✅ **Emergency Functions:** Owner can recover funds if needed  

## Technical Specifications

### Token Decimals
- FXRP: 18 decimals
- USDC: 6 decimals
- vFXRP: 18 decimals (matches FXRP)

### Exchange Rate
- 1 FXRP = 1 USDC (for demo purposes)

### Networks
- Flare: Coston2 testnet (Chain ID 114)
- Ethereum: Sepolia testnet

### AAVE V3 Addresses (Sepolia)
- USDC: `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8`
- AAVE Pool: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`
- aUSDC: `0x16dA4541aD1807f4443d92D26044C1147406EB80`

## Files Created/Modified

### Smart Contracts
```
contracts/
├── FlareVault.sol (NEW - main vault on Flare)
├── SepoliaAAVEManager.sol (NEW - AAVE manager on Sepolia)
└── ERC20Mock.sol (UPDATED - testing utility)
```

### Deployment Scripts
```
scripts/
├── deployFlare.js (NEW - deploy to Flare/Coston2)
├── deploySepolia.js (NEW - deploy to Sepolia)
├── testFlareDeposit.js (NEW - test deposit)
├── testFlareWithdraw.js (NEW - test withdrawal)
└── checkSepoliaStatus.js (NEW - check manager status)
```

### API Service
```
api/
└── server.js (NEW - off-chain bridge service)
```

### Documentation
```
├── README.md (REPLACED - comprehensive guide)
├── DEPLOYMENT.md (REPLACED - step-by-step deployment)
├── package.json (UPDATED - added dependencies and scripts)
└── .env.example (reference for environment variables)
```

### Removed/Archived
```
contracts/
├── FXRPYieldVault.sol (REMOVED - old single-chain version)
└── Mocks.sol (REMOVED - mock AAVE no longer needed)

scripts/
├── deployWithMocks.js (REMOVED)
├── addInterest.js (REMOVED)
├── debugDeposit.js (REMOVED)
└── deploy.js → deploy.old.js (ARCHIVED)
```

## How to Use

### Quick Start
```bash
# 1. Install
npm install

# 2. Configure .env
cp .env.example .env
# Fill in PRIVATE_KEY, SEPOLIA_RPC_URL

# 3. Deploy to Coston2
npm run deploy:coston2

# 4. Deploy to Sepolia
npm run deploy:sepolia

# 5. Fund Sepolia manager with USDC

# 6. Start API
npm run api

# 7. Test deposit
npx hardhat run scripts/testFlareDeposit.js --network coston2

# 8. Test withdrawal
npx hardhat run scripts/testFlareWithdraw.js --network coston2
```

## Security Considerations

⚠️ **This is a DEMO/POC** - Not production ready

**Known Limitations:**
- Centralized API operator
- No atomicity guarantees
- API downtime = system pause
- Users must trust operator
- No formal bridge protocol

**For Production:**
- Use LayerZero/Axelar/Wormhole for cross-chain
- Multi-sig operator
- Timelocks
- Smart contract audits
- Decentralized monitoring

## API Endpoints

```
GET  /health                 - Health check
GET  /balance/:address       - User balance and yield
GET  /stats                  - System statistics
POST /manual/deposit         - Manual deposit trigger
POST /manual/withdraw        - Manual withdrawal trigger
```

## Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ethers": "^6.9.0"
  },
  "devDependencies": {
    "@flarenetwork/flare-periphery-contracts": "^0.1.38",
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "^4.9.6",
    "dotenv": "^16.3.1",
    "hardhat": "^2.19.0"
  }
}
```

## Testing

The system has been designed for testing on:
- **Flare side:** Coston2 testnet with real FXRP
- **Ethereum side:** Sepolia testnet with real AAVE V3

### Test Flow
1. Deploy both contracts
2. Fund Sepolia manager with USDC
3. Start API server
4. Deposit 100 FXRP on Coston2
5. Verify USDC supplied to AAVE on Sepolia
6. Wait for yield accrual (or simulate)
7. Withdraw on Coston2
8. Verify received FXRP + USDC yield

## Future Enhancements

### Short Term
- [ ] Add withdrawal fees
- [ ] Implement yield auto-compounding
- [ ] Add deposit/withdrawal limits
- [ ] Better error handling in API
- [ ] Add retry logic for failed cross-chain txs

### Long Term
- [ ] Replace API with LayerZero integration
- [ ] Support multiple yield sources (not just AAVE)
- [ ] Add liquidity pool for instant withdrawals
- [ ] Governance token for protocol decisions
- [ ] Support multiple collateral tokens (not just FXRP)

## License

MIT

## Acknowledgments

- Flare Network for FXRP and testnet infrastructure
- AAVE for lending protocol
- OpenZeppelin for secure contract templates

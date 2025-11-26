<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/ffb8613e-55b0-45bc-bd69-e8504bcfbad1" />

<br />

# **fYield: Cross-Chain Yield Router for FXRP**

**fYield** enables FXRP deposits on Flare to earn Aave or Curve yield on Ethereum without bridging tokens.
The system uses ERC4626 vaults, FTSO oracles, and an off-chain coordinator to synchronize deposits and withdrawals across chains.

---

## **🏗 Architecture Overview**

fYield consists of three components:

```
FlareVault (Flare)  <— events —>  Coordinator (Node.js)  <— transactions —>  AAVEManager (Ethereum)
```

### **FlareVault (Flare Network)**

Location: `fyield-router/contracts/FlareVault.sol`

* ERC4626 vault for FXRP
* Accepts FXRP deposits and mints vFXRP vault shares
* On withdraw, burns vFXRP and waits for coordinator to return yield
* Tracks total FXRP, shares, withdrawal requests, and operator fee configuration
* FXRP always remains on Flare

---

### **Coordinator (Off-Chain Orchestrator)**

Locations:
`fyield-router/api/`
`fyield-router/utils/`

Responsibilities:

* Listen for Deposit and Withdraw events from FlareVault
* Fetch XRP USD price from FTSO v2
* Convert FXRP to USD value
* Trigger Ethereum AAVEManager actions
* Deposit USDC or withdraw yield
* Complete withdrawal back on Flare
* Handles batching, fee logic, and RPC operations
* Never holds assets, only metadata

---

### **AAVEManager (Ethereum Mainnet)**

Location: `fyield-router/contracts/AAVEManager.sol`

* ERC4626 vault for USDC
* Supplies USDC into Aave V3 lending markets
* Tracks principal, APY yield, shares, and operator fees
* Withdraws the yield portion when instructed by coordinator
* Principal stays in the vault and yield is returned cross-chain

---

## **🔁 Cross-Chain Flow**

### **Deposit Flow**

1. User deposits FXRP into FlareVault
2. FlareVault emits Deposit event
3. Coordinator detects event and fetches FXRP USD price
4. Coordinator deposits the equivalent amount of USDC into AAVEManager
5. User receives vFXRP shares on Flare

FXRP stays on Flare and USDC stays on Ethereum.

---

### **Withdrawal Flow**

1. User calls redeem on FlareVault with vFXRP
2. FlareVault emits RedeemRequested
3. Coordinator calculates user yield
4. Coordinator withdraws USDC yield from AAVEManager
5. Coordinator completes withdrawal on Flare
6. User receives original FXRP plus yield converted back from USDC via price oracle

---

## **💰 Fee Model**

* Operator fee applied to yield
* Withdrawal fee for coordinator execution
* No deposit fees

Both vaults implement the same configurable fee pattern.

---

## **📄 Contracts Summary**

| Contract          | Chain     | Description                             |
| ----------------- | --------- | --------------------------------------- |
| FlareVault.sol    | Flare     | ERC4626 vault for FXRP and vFXRP shares |
| AAVEManager.sol   | Ethereum  | ERC4626 vault supplying USDC to Aave V3 |
| interfaces folder | Shared    | ERC4626, Aave, and protocol interfaces  |
| utils folder      | Off-chain | FTSO pricing and helper utilities       |

---

## **🧰 Tech Stack**

**Smart Contracts**

* Solidity
* ERC4626
* OpenZeppelin
* Hardhat
* Aave V3 Lending Pool

**Coordinator**

* Node.js
* Express
* ethers.js v6
* Flare FTSO v2 oracles

**Frontend**

* Next.js
* React
* TailwindCSS

---

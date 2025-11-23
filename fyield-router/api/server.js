require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const FlareVaultABI = require('../artifacts/contracts/FlareVault.sol/FlareVault.json').abi;
const AAVEManagerABI = require('../artifacts/contracts/AAVEManager.sol/AAVEManager.json').abi;
const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
}));

// Configuration
const FLARE_RPC = process.env.FLARE_RPC_URL || 'https://coston2-api.flare.network/ext/C/rpc';
const MAINNET_RPC = process.env.MAINNET_RPC_URL || 'https://eth.llamarpc.com';
const FLARE_VAULT_ADDRESS = process.env.FLARE_VAULT_ADDRESS;
const MAINNET_MANAGER_ADDRESS = process.env.MAINNET_MANAGER_ADDRESS;
const FLARE_OPERATOR_PRIVATE_KEY = process.env.FLARE_DEPLOYER_PRIVATE_KEY;
const AAVE_OPERATOR_PRIVATE_KEY = process.env.AAVE_DEPLOYER_PRIVATE_KEY;

// Providers
const flareProvider = new ethers.JsonRpcProvider(FLARE_RPC);
const mainnetProvider = new ethers.JsonRpcProvider(MAINNET_RPC);

// Operator wallet (same on both chains for simplicity)
const flareWallet = new ethers.Wallet(FLARE_OPERATOR_PRIVATE_KEY, flareProvider);
const mainnetWallet = new ethers.Wallet(AAVE_OPERATOR_PRIVATE_KEY, mainnetProvider);

// Contracts
const flareVault = new ethers.Contract(FLARE_VAULT_ADDRESS, FlareVaultABI, flareWallet);
const mainnetManager = new ethers.Contract(MAINNET_MANAGER_ADDRESS, AAVEManagerABI, mainnetWallet);

// Flare Contract Registry and FTSO setup
const FLARE_CONTRACT_REGISTRY = '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019';
const REGISTRY_ABI = [
    'function getContractAddressByName(string memory _name) external view returns (address)'
];
const contractRegistry = new ethers.Contract(FLARE_CONTRACT_REGISTRY, REGISTRY_ABI, flareProvider);

// FTSO Registry interface
const FTSO_REGISTRY_ABI = [
    'function getCurrentPriceWithDecimals(string memory _symbol) external view returns (uint256 _price, uint256 _timestamp, uint256 _decimals)'
];

// Initialize FTSO Registry
let ftsoRegistry;
(async () => {
    const ftsoRegistryAddress = await contractRegistry.getContractAddressByName('FtsoRegistry');
    ftsoRegistry = new ethers.Contract(ftsoRegistryAddress, FTSO_REGISTRY_ABI, flareProvider);
    console.log('FTSO Registry initialized:', ftsoRegistryAddress);
})();

// Track user deposits: user address => USDC amount deposited
const userDeposits = new Map();

// Get current XRP/USD price from Flare FTSO
async function getXRPPrice() {
    try {
        // On Coston2 testnet, use 'testXRP'
        // On Flare mainnet, use 'XRP'
        const symbol = process.env.FLARE_RPC_URL?.includes('coston2') ? 'testXRP' : 'XRP';
        
        const result = await ftsoRegistry.getCurrentPriceWithDecimals(symbol);
        const price = result[0];      // _price
        const timestamp = result[1];  // _timestamp
        const decimals = result[2];   // _decimals
        
        // Convert to human-readable price
        const priceUSD = Number(price) / Math.pow(10, Number(decimals));
        
        console.log(`  ${symbol} Price: $${priceUSD.toFixed(4)} (updated ${Math.floor(Date.now() / 1000) - Number(timestamp)}s ago)`);
        return priceUSD;
    } catch (error) {
        console.error('  Error fetching XRP price:', error.message);
        console.log('  Falling back to $1.00');
        return 1.0; // Fallback
    }
}

// Convert FXRP amount to equivalent USDC amount using current price
async function fxrpToUSDC(fxrpAmount) {
    const xrpPrice = await getXRPPrice();
    
    // fxrpAmount is in 6 decimals (e.g., 1000000 = 1 FXRP)
    const fxrpFloat = Number(fxrpAmount) / 1e6;
    const usdcFloat = fxrpFloat * xrpPrice;
    const usdcAmount = BigInt(Math.floor(usdcFloat * 1e6));
    
    console.log(`  Converting: ${fxrpFloat} FXRP × $${xrpPrice} = ${usdcFloat.toFixed(6)} USDC`);
    
    return usdcAmount;
}

console.log('FXRP Yield Router API');
console.log('Flare Vault:', FLARE_VAULT_ADDRESS);
console.log('Mainnet Manager:', MAINNET_MANAGER_ADDRESS);
console.log('Operator:', flareWallet.address);

// Listen for deposits on Flare
async function watchFlareDeposits() {
    console.log('Watching deposits on Flare...');
    
    // Listen to ERC4626 Deposit event: Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)
    flareVault.on('Deposit', async (sender, owner, assets, shares, event) => {
        try {
            console.log(`\nDeposit detected: ${owner}`);
            console.log(`  Sender: ${sender}`);
            console.log(`  FXRP: ${ethers.formatUnits(assets, 6)}`);
            console.log(`  vFXRP shares: ${ethers.formatUnits(shares, 6)}`);
            
            // Calculate USDC amount based on current XRP price
            const usdcAmount = await fxrpToUSDC(assets);
            console.log(`  USDC to supply: ${ethers.formatUnits(usdcAmount, 6)}`);
            
            // Check USDC balance in manager contract
            const managerUSDCBalance = await mainnetManager.getUSDCBalance();
            console.log(`  Manager USDC balance: ${ethers.formatUnits(managerUSDCBalance, 6)}`);
            
            if (managerUSDCBalance < usdcAmount) {
                console.error(`  Error: Insufficient USDC in manager. Need ${ethers.formatUnits(usdcAmount, 6)}, have ${ethers.formatUnits(managerUSDCBalance, 6)}`);
                return;
            }
            
            console.log(`  Depositing to AAVE vault...`);
            console.log(`  Args: assets=${usdcAmount.toString()}, receiver=${owner}`);
            console.log(`  Manager address: ${mainnetManager.target}`);
            console.log(`  Operator address: ${mainnetWallet.address}`);
            
            // Check if deposit function exists
            if (typeof mainnetManager.deposit !== 'function') {
                console.error('  Error: deposit function not found on contract!');
                return;
            }
            
            const tx = await mainnetManager.deposit(usdcAmount, owner, {
                gasLimit: 300000 // Set explicit gas limit for AAVE operations
            });
            console.log(`  Transaction hash: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`  Transaction confirmed in block ${receipt.blockNumber}`);
            
            // Find ERC4626 Deposit event to get shares minted
            const depositEvent = receipt.logs.find(log => {
                try {
                    const parsed = mainnetManager.interface.parseLog(log);
                    return parsed && parsed.name === 'Deposit' && parsed.args.shares !== undefined;
                } catch {
                    return false;
                }
            });
            
            let aaveShares = 0n;
            if (depositEvent) {
                const parsed = mainnetManager.interface.parseLog(depositEvent);
                aaveShares = parsed.args.shares;
                console.log(`  AAVE shares minted: ${ethers.formatUnits(aaveShares, 18)}`);
            }
            
            // Store shares for this user (for withdrawal later)
            const currentShares = userDeposits.get(owner) || 0n;
            userDeposits.set(owner, currentShares + aaveShares);
            
            console.log(`  Deposited to AAVE: ${tx.hash}`);
        } catch (error) {
            console.error(`  Error:`, error.message);
            if (error.reason) {
                console.error(`  Reason:`, error.reason);
            }
        }
    });
}

// Listen for withdrawal requests on Flare
async function watchWithdrawalRequests() {
    console.log('Watching withdrawals on Flare...');
    
    flareVault.on('WithdrawRequested', async (user, vFxrpAmount, timestamp, event) => {
        try {
            console.log(`\nWithdrawal: ${user}`);
            console.log(`  vFXRP: ${ethers.formatUnits(vFxrpAmount, 6)}`);
            
            // Get the shares for this user
            const userShares = userDeposits.get(user) || 0n;
            
            if (userShares === 0n) {
                console.error(`  Error: No shares found for user ${user}`);
                return;
            }
            
            console.log(`  User shares: ${ethers.formatUnits(userShares, 18)}`);
            
            // Check yield before withdrawal
            const yieldAmount = await mainnetManager.getUserYield(user);
            console.log(`  Accumulated yield: ${ethers.formatUnits(yieldAmount, 6)} USDC`);
            
            console.log(`  Redeeming from AAVE vault...`);
            // Redeem shares but keep funds in manager contract (receiver = manager address)
            const withdrawTx = await mainnetManager.redeem(userShares, mainnetManager.target, user, {
                gasLimit: 400000 // Set explicit gas limit for AAVE withdrawal
            });
            const withdrawReceipt = await withdrawTx.wait();
            
            // Find Withdraw event to get assets returned
            const withdrawEvent = withdrawReceipt.logs.find(log => {
                try {
                    const parsed = mainnetManager.interface.parseLog(log);
                    return parsed && parsed.name === 'Withdraw';
                } catch {
                    return false;
                }
            });
            
            let assetsReturned = 0n;
            if (withdrawEvent) {
                const parsed = mainnetManager.interface.parseLog(withdrawEvent);
                assetsReturned = parsed.args.assets;
                console.log(`  Total returned: ${ethers.formatUnits(assetsReturned, 6)} USDC (principal + yield)`);
                console.log(`  Yield earned: ${ethers.formatUnits(yieldAmount, 6)} USDC`);
                
                // If there's yield, send it to the user on mainnet
                if (yieldAmount > 0n) {
                    console.log(`  Sending ${ethers.formatUnits(yieldAmount, 6)} USDC yield to user...`);
                    const usdc = new ethers.Contract(
                        process.env.MAINNET_USDC,
                        ['function transfer(address to, uint256 amount) returns (bool)'],
                        mainnetWallet
                    );
                    
                    // Transfer yield from manager to user
                    const yieldTx = await mainnetManager.emergencyWithdrawUSDC(yieldAmount);
                    await yieldTx.wait();
                    
                    // Now send from owner to user
                    const transferTx = await usdc.transfer(user, yieldAmount);
                    await transferTx.wait();
                    console.log(`  ✅ Yield sent to user on mainnet`);
                }
            }
            
            // Clear the deposit record for this user
            userDeposits.delete(user);
            
            console.log(`  Completing on Flare...`);
            const completeTx = await flareVault.completeWithdraw(user, vFxrpAmount, {
                gasLimit: 200000 // Set explicit gas limit for Flare operations
            });
            await completeTx.wait();
            
            console.log(`  Completed: ${completeTx.hash}`);
            console.log(`  User received: ${ethers.formatUnits(vFxrpAmount, 6)} FXRP on Flare + ${ethers.formatUnits(yieldAmount, 6)} USDC yield on Mainnet`);
        } catch (error) {
            console.error(`  Error:`, error.message);
            if (error.reason) {
                console.error(`  Reason:`, error.reason);
            }
        }
    });
}

// REST API Endpoints

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        flareVault: FLARE_VAULT_ADDRESS,
        mainnetManager: MAINNET_MANAGER_ADDRESS,
        operator: flareWallet.address
    });
});

// Get user-specific stats
app.get('/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        const userOriginalDeposit = await mainnetManager.userOriginalDeposit(address); // #1: Original USDC deposited
        const vFxrpBalance = await flareVault.balanceOf(address); // #2: vFXRP balance
        const userYield = await mainnetManager.getUserYield(address); // #3: Earned yield
        
        res.json({
            usdcLent: ethers.formatUnits(userOriginalDeposit, 6), // USDC lent to AAVE (6 decimals)
            vFxrpBalance: ethers.formatUnits(vFxrpBalance, 6), // vFXRP balance (6 decimals)
            earnedYield: ethers.formatUnits(userYield, 6) // USDC (6 decimals)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get global stats
app.get('/global', async (req, res) => {
    try {
        const totalAUSDC = await mainnetManager.getAAVEBalance(); // #4: Total aUSDC in AAVE
        const totalUSDC = await mainnetManager.getUSDCBalance(); // #5: Total USDC in manager
        const totalYieldEarned = await mainnetManager.getTotalYieldEarned(); // #6: Total yield all users
        
        res.json({
            totalAUSDCInAAVE: ethers.formatUnits(totalAUSDC, 6), // aUSDC (6 decimals)
            totalUSDCInManager: ethers.formatUnits(totalUSDC, 6), // USDC (6 decimals)
            totalYieldAllUsers: ethers.formatUnits(totalYieldEarned, 6) // USDC (6 decimals)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
    console.log(`\nAPI running on port ${PORT}`);
    
    try {
        await watchFlareDeposits();
        await watchWithdrawalRequests();
        console.log('Event listeners started\n');
    } catch (error) {
        console.error('Error starting listeners:', error.message);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
});

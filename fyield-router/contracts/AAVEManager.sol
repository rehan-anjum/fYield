// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// AAVE V3 Pool Interface
interface IAAVEPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

// AAVE V3 aToken Interface
interface IAToken is IERC20 {
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}

/**
 * @title AAVEManager
 * @notice ERC4626 vault that manages USDC supply to AAVE with proper yield distribution
 * @dev Uses share-based accounting to ensure fair yield allocation based on deposit time
 */
contract AAVEManager is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;
    IAAVEPool public immutable aavePool;
    IAToken public immutable aUSDC;
    
    address public operator;
    
    // Track original deposits for yield calculation
    mapping(address => uint256) public userOriginalDeposit;
    
    // Track total supplied and withdrawn for accounting
    uint256 public totalSupplied;
    uint256 public totalWithdrawn;
    
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);
    event USDCSupplied(address indexed user, uint256 amount, uint256 shares, uint256 timestamp);
    event USDCWithdrawn(address indexed user, uint256 amount, uint256 shares, uint256 yieldAmount);
    event YieldHarvested(uint256 amount);

    constructor(
        address _usdc,
        address _aavePool,
        address _aUSDC,
        address _operator
    ) ERC20("AAVE USDC Vault", "aavUSDC") ERC4626(IERC20(_usdc)) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_aavePool != address(0), "Invalid AAVE pool");
        require(_aUSDC != address(0), "Invalid aUSDC address");
        require(_operator != address(0), "Invalid operator address");
        
        USDC = IERC20(_usdc);
        aavePool = IAAVEPool(_aavePool);
        aUSDC = IAToken(_aUSDC);
        operator = _operator;
        
        // Approve AAVE pool to spend USDC (max approval)
        IERC20(_usdc).safeApprove(_aavePool, type(uint256).max);
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "Only operator");
        _;
    }

    /**
     * @notice Override totalAssets to return aUSDC balance (principal + yield in AAVE)
     */
    function totalAssets() public view override returns (uint256) {
        return aUSDC.balanceOf(address(this));
    }

    /**
     * @notice Deposit USDC and receive vault shares
     * @param assets Amount of USDC to deposit
     * @param receiver Address to receive vault shares
     * @return shares Amount of vault shares minted
     */
    function deposit(uint256 assets, address receiver) public override onlyOperator nonReentrant returns (uint256 shares) {
        require(assets > 0, "Zero amount");
        require(receiver != address(0), "Invalid receiver");
        require(USDC.balanceOf(address(this)) >= assets, "Insufficient USDC in contract");
        
        // Calculate shares based on current vault value
        shares = previewDeposit(assets);
        
        // Track original deposit for yield calculation
        userOriginalDeposit[receiver] += assets;
        totalSupplied += assets;
        
        // Supply USDC to AAVE
        aavePool.supply(address(USDC), assets, address(this), 0);
        
        // Mint vault shares to receiver
        _mint(receiver, shares);
        
        emit USDCSupplied(receiver, assets, shares, block.timestamp);
        emit Deposit(msg.sender, receiver, assets, shares);
        
        return shares;
    }

    /**
     * @notice Redeem vault shares for USDC (principal + yield)
     * @param shares Amount of vault shares to redeem
     * @param receiver Address to receive USDC
     * @param owner Address that owns the shares
     * @return assets Amount of USDC returned
     */
    function redeem(uint256 shares, address receiver, address owner) public override onlyOperator nonReentrant returns (uint256 assets) {
        require(shares > 0, "Zero shares");
        require(receiver != address(0), "Invalid receiver");
        
        // Calculate USDC value of shares (includes yield)
        assets = previewRedeem(shares);
        
        // Calculate yield
        uint256 userShares = balanceOf(owner);
        uint256 originalDeposit = userOriginalDeposit[owner];
        uint256 proportionalOriginal = (originalDeposit * shares) / userShares;
        uint256 yieldAmount = assets > proportionalOriginal ? assets - proportionalOriginal : 0;
        
        // Update tracking
        userOriginalDeposit[owner] -= proportionalOriginal;
        totalSupplied -= proportionalOriginal;
        totalWithdrawn += assets;
        
        // Burn shares
        _burn(owner, shares);
        
        // Withdraw from AAVE
        aavePool.withdraw(address(USDC), assets, address(this));
        
        // Send USDC to receiver
        USDC.safeTransfer(receiver, assets);
        
        emit USDCWithdrawn(owner, assets, shares, yieldAmount);
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        
        return assets;
    }

    /**
     * @notice Get user's accumulated yield so far
     * @param user User's address
     * @return yieldAmount Yield earned (USDC)
     */
    function getUserYield(address user) external view returns (uint256 yieldAmount) {
        uint256 userShares = balanceOf(user);
        if (userShares == 0) return 0;
        
        // Current value of their shares (principal + yield)
        uint256 currentValue = convertToAssets(userShares);
        
        // Original deposit amount
        uint256 originalDeposit = userOriginalDeposit[user];
        
        // Yield = current value - original deposit
        return currentValue > originalDeposit ? currentValue - originalDeposit : 0;
    }

    /**
     * @notice Get current value of user's position (principal + yield)
     * @param user User's address
     * @return value Current USDC value
     */
    function getUserValue(address user) external view returns (uint256 value) {
        uint256 userShares = balanceOf(user);
        return convertToAssets(userShares);
    }

    /**
     * @notice Get total yield earned across all users
     */
    function getTotalYieldEarned() external view returns (uint256) {
        uint256 currentAAVEBalance = aUSDC.balanceOf(address(this));
        if (currentAAVEBalance > totalSupplied) {
            return currentAAVEBalance - totalSupplied;
        }
        return 0;
    }

    /**
     * @notice Get total USDC in AAVE (aUSDC balance)
     */
    function getAAVEBalance() external view returns (uint256) {
        return aUSDC.balanceOf(address(this));
    }

    /**
     * @notice Get USDC balance in contract
     */
    function getUSDCBalance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }

    /**
     * @notice Owner updates operator address
     * @param newOperator New operator address
     */
    function updateOperator(address newOperator) external onlyOwner {
        require(newOperator != address(0), "Invalid operator");
        address oldOperator = operator;
        operator = newOperator;
        emit OperatorUpdated(oldOperator, newOperator);
    }

    /**
     * @notice Owner deposits USDC to this contract
     * @param amount Amount to deposit
     */
    function depositUSDC(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Zero amount");
        USDC.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Owner harvests excess yield from AAVE to contract
     */
    function harvestYield() external onlyOwner nonReentrant {
        uint256 currentAAVEBalance = aUSDC.balanceOf(address(this));
        if (currentAAVEBalance > totalSupplied) {
            uint256 yieldAmount = currentAAVEBalance - totalSupplied;
            aavePool.withdraw(address(USDC), yieldAmount, address(this));
            emit YieldHarvested(yieldAmount);
        }
    }

    /**
     * @notice Emergency: Owner can withdraw USDC
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawUSDC(uint256 amount) external onlyOwner {
        USDC.safeTransfer(owner(), amount);
    }

    /**
     * @notice Emergency: Owner can withdraw from AAVE
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawFromAAVE(uint256 amount) external onlyOwner {
        aavePool.withdraw(address(USDC), amount, address(this));
    }
}

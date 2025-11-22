// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
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
 * @notice Contract deployed on Sepolia that manages USDC supply to AAVE
 * @dev Only callable by authorized operator (off-chain API). Tracks deposits and withdrawals.
 */
contract AAVEManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;
    IAAVEPool public immutable aavePool;
    IAToken public immutable aUSDC;
    
    address public operator;
    
    // Track total supplied and withdrawn for accounting
    uint256 public totalSupplied;
    uint256 public totalWithdrawn;
    
    // Mapping of Flare user address => USDC amount supplied to AAVE for them
    mapping(address => uint256) public userSupplied;
    
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);
    event USDCSupplied(address indexed flareUser, uint256 amount, uint256 timestamp);
    event USDCWithdrawn(address indexed flareUser, uint256 amount, uint256 yieldAmount);
    event YieldHarvested(uint256 amount);

    constructor(
        address _usdc,
        address _aavePool,
        address _aUSDC,
        address _operator
    ) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_aavePool != address(0), "Invalid AAVE pool");
        require(_aUSDC != address(0), "Invalid aUSDC address");
        require(_operator != address(0), "Invalid operator address");
        
        USDC = IERC20(_usdc);
        aavePool = IAAVEPool(_aavePool);
        aUSDC = IAToken(_aUSDC);
        operator = _operator;
        
        // Approve AAVE pool to spend USDC (max approval)
        USDC.safeApprove(_aavePool, type(uint256).max);
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "Only operator");
        _;
    }

    /**
     * @notice Operator supplies USDC to AAVE on behalf of a Flare user
     * @param flareUser The user's address on Flare network (for tracking)
     * @param amount Amount of USDC to supply
     */
    function supplyToAAVE(address flareUser, uint256 amount) external onlyOperator nonReentrant {
        require(amount > 0, "Zero amount");
        require(flareUser != address(0), "Invalid user address");
        
        // Supply USDC to AAVE
        aavePool.supply(address(USDC), amount, address(this), 0);
        
        // Track the supply
        userSupplied[flareUser] += amount;
        totalSupplied += amount;
        
        emit USDCSupplied(flareUser, amount, block.timestamp);
    }

    /**
     * @notice Operator withdraws from AAVE for a user (principal + yield) and sends USDC to user
     * @param flareUser The user's address (same on both Flare and Sepolia)
     * @param principalAmount The original principal amount supplied for this user
     * @return totalAmount Total amount withdrawn (principal + yield)
     * @return yieldAmount Yield earned
     */
    function withdrawFromAAVE(
        address flareUser,
        uint256 principalAmount
    ) external onlyOperator nonReentrant returns (uint256 totalAmount, uint256 yieldAmount) {
        require(principalAmount > 0, "Zero amount");
        require(userSupplied[flareUser] >= principalAmount, "Insufficient user supply");
        
        // Calculate user's proportional share of total yield
        uint256 currentAAVEBalance = aUSDC.balanceOf(address(this));
        uint256 totalYield = currentAAVEBalance > totalSupplied ? currentAAVEBalance - totalSupplied : 0;
        
        // User's yield = (user's principal / total supplied) * total yield
        uint256 userYield = 0;
        if (totalSupplied > 0 && totalYield > 0) {
            userYield = (principalAmount * totalYield) / totalSupplied;
        }
        
        // Withdraw principal + yield from AAVE
        uint256 withdrawAmount = principalAmount + userYield;
        uint256 withdrawn = aavePool.withdraw(address(USDC), withdrawAmount, address(this));
        
        // Update tracking
        userSupplied[flareUser] -= principalAmount;
        totalSupplied -= principalAmount;
        totalWithdrawn += withdrawn;
        
        // Send USDC directly to user on Sepolia (principal is kept, only yield sent)
        if (userYield > 0) {
            USDC.safeTransfer(flareUser, userYield);
        }
        
        emit USDCWithdrawn(flareUser, principalAmount, userYield);
        
        return (withdrawn, userYield);
    }

    /**
     * @notice Get current yield earned across all users
     */
    function getTotalYieldEarned() external view returns (uint256) {
        uint256 currentAAVEBalance = aUSDC.balanceOf(address(this));
        if (currentAAVEBalance > totalSupplied) {
            return currentAAVEBalance - totalSupplied;
        }
        return 0;
    }

    /**
     * @notice Get yield earned for a specific user
     * @param flareUser User's Flare address
     */
    function getUserYield(address flareUser) external view returns (uint256) {
        uint256 userPrincipal = userSupplied[flareUser];
        if (userPrincipal == 0 || totalSupplied == 0) return 0;
        
        uint256 currentAAVEBalance = aUSDC.balanceOf(address(this));
        uint256 totalYield = currentAAVEBalance > totalSupplied ? currentAAVEBalance - totalSupplied : 0;
        
        return (userPrincipal * totalYield) / totalSupplied;
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

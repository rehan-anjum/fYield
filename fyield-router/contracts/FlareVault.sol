// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FlareVault
 * @notice ERC4626 vault deployed on Flare network that accepts FXRP deposits
 * @dev Uses ERC4626 standard for proper decimal handling (6 decimals to match FXRP)
 */
contract FlareVault is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable FXRP;
    
    address public operator; // Off-chain API address
    
    event WithdrawRequested(address indexed user, uint256 vFxrpAmount, uint256 timestamp);
    event WithdrawCompleted(address indexed user, uint256 fxrpAmount);
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

    constructor(
        address _fxrp,
        address _operator
    ) ERC20("Vault FXRP", "vFXRP") ERC4626(IERC20(_fxrp)) {
        require(_fxrp != address(0), "Invalid FXRP address");
        require(_operator != address(0), "Invalid operator address");
        
        FXRP = IERC20(_fxrp);
        operator = _operator;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "Only operator");
        _;
    }

    /**
     * @notice Override totalAssets to return FXRP balance in vault
     */
    function totalAssets() public view override returns (uint256) {
        return FXRP.balanceOf(address(this));
    }

    /**
     * @notice User deposits FXRP and receives vFXRP shares (ERC4626)
     * @param assets Amount of FXRP to deposit
     * @param receiver Address to receive vFXRP shares
     * @return shares Amount of vFXRP shares minted
     */
    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256 shares) {
        require(assets > 0, "Zero amount");

        // Calculate shares (will be 1:1 initially)
        shares = previewDeposit(assets);

        // Transfer FXRP from user
        FXRP.safeTransferFrom(msg.sender, address(this), assets);

        // Mint vFXRP shares to receiver
        _mint(receiver, shares);

        // ERC4626 Deposit event is automatically emitted by _mint
        emit Deposit(msg.sender, receiver, assets, shares);

        return shares;
    }

    /**
     * @notice User requests withdrawal by emitting event (off-chain API listens)
     * @param vFxrpAmount Amount of vFXRP to withdraw
     */
    function requestWithdraw(uint256 vFxrpAmount) external nonReentrant {
        require(vFxrpAmount > 0, "Zero amount");
        require(balanceOf(msg.sender) >= vFxrpAmount, "Insufficient balance");
        
        emit WithdrawRequested(msg.sender, vFxrpAmount, block.timestamp);
    }

    /**
     * @notice Operator completes withdrawal using ERC4626 redeem
     * @param shares Amount of vFXRP shares to redeem
     * @param receiver Address to receive FXRP
     * @param owner Address that owns the shares
     * @return assets Amount of FXRP returned
     */
    function redeem(uint256 shares, address receiver, address owner) public override onlyOperator nonReentrant returns (uint256 assets) {
        require(shares > 0, "Zero shares");
        require(balanceOf(owner) >= shares, "Insufficient user balance");

        // Calculate FXRP value of shares
        assets = previewRedeem(shares);

        // Burn vFXRP shares
        _burn(owner, shares);

        // Transfer FXRP to receiver
        FXRP.safeTransfer(receiver, assets);

        emit WithdrawCompleted(receiver, assets);
        emit Withdraw(msg.sender, receiver, owner, assets, shares);

        return assets;
    }

    /**
     * @notice Legacy function for backward compatibility
     * @dev USDC yield is sent directly to user on Mainnet, not here
     * @param user User address
     * @param vFxrpAmount Amount of vFXRP to burn
     */
    function completeWithdraw(
        address user,
        uint256 vFxrpAmount
    ) external onlyOperator {
        redeem(vFxrpAmount, user, user);
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
     * @notice Get user's vFXRP balance
     * @param user User address
     */
    function getUserBalance(address user) external view returns (uint256) {
        return balanceOf(user);
    }

    /**
     * @notice Emergency: Owner can withdraw FXRP
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawFXRP(uint256 amount) external onlyOwner {
        FXRP.safeTransfer(owner(), amount);
    }
}

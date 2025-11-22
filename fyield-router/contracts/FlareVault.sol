// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FlareVault
 * @notice Vault deployed on Flare network that accepts FXRP deposits
 * @dev Users deposit FXRP and receive vFXRP tokens. Off-chain API manages USDC supply to AAVE on Sepolia.
 */
contract FlareVault is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable FXRP;
    
    address public operator; // Off-chain API address
    
    event Deposit(address indexed user, uint256 fxrpAmount, uint256 timestamp);
    event WithdrawRequested(address indexed user, uint256 vFxrpAmount, uint256 timestamp);
    event WithdrawCompleted(address indexed user, uint256 fxrpAmount);
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

    constructor(
        address _fxrp,
        address _operator
    ) ERC20("Vault FXRP", "vFXRP") {
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
     * @notice User deposits FXRP and receives vFXRP tokens
     * @param fxrpAmount Amount of FXRP to deposit
     */
    function deposit(uint256 fxrpAmount) external nonReentrant {
        require(fxrpAmount > 0, "Zero amount");

        // Transfer FXRP from user
        FXRP.safeTransferFrom(msg.sender, address(this), fxrpAmount);
        
        // Mint vFXRP tokens 1:1
        _mint(msg.sender, fxrpAmount);
        
        emit Deposit(msg.sender, fxrpAmount, block.timestamp);
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
     * @notice Operator completes withdrawal by burning vFXRP and sending FXRP back
     * @dev USDC yield is sent directly to user on Sepolia, not here
     * @param user User address
     * @param vFxrpAmount Amount of vFXRP to burn
     */
    function completeWithdraw(
        address user,
        uint256 vFxrpAmount
    ) external onlyOperator nonReentrant {
        require(vFxrpAmount > 0, "Zero amount");
        require(balanceOf(user) >= vFxrpAmount, "Insufficient user balance");
        
        // Burn vFXRP tokens
        _burn(user, vFxrpAmount);
        
        // Return FXRP to user
        require(FXRP.balanceOf(address(this)) >= vFxrpAmount, "Insufficient FXRP in vault");
        FXRP.safeTransfer(user, vFxrpAmount);
        
        emit WithdrawCompleted(user, vFxrpAmount);
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

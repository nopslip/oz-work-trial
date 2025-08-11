// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {ERC20PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {NoncesUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @custom:security-contact security@acmebank.com
/// @title Acme Bank Crypto Bond Token
/// @notice Tokenized bond for funding cryptocurrency investments with automated interest payments
/// @dev ERC20 token with interest distribution and crypto tracking features for OpenZeppelin Monitor/Relayer demo
contract AcmeBankCryptoBond is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, ERC20PausableUpgradeable, AccessControlUpgradeable, ERC20PermitUpgradeable, ERC20VotesUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    // Custom roles for bond operations
    bytes32 public constant INTEREST_PAYER_ROLE = keccak256("INTEREST_PAYER_ROLE");
    bytes32 public constant CRYPTO_TRADER_ROLE = keccak256("CRYPTO_TRADER_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    
    // Interest payment state
    uint256 public baseInterestRate; // basis points
    uint256 public nextInterestPayment;
    uint256 public interestPaymentInterval;
    address public interestPool;
    
    // Fund pools
    uint256 public cryptoPurchasePool;
    uint256 public interestReservePool;
    uint256 public operationalPool;
    uint256 public redemptionPool;
    
    // Crypto portfolio tracking
    mapping(string => uint256) public cryptoAllocations;
    uint256 public totalCryptoValue;
    
    // Risk management thresholds
    uint256 public largeTransferThreshold;
    uint256 public maxConcentration; // basis points
    uint256 public dailyPurchaseLimit;
    
    // Events for Monitor integration
    event InterestPaymentDue(uint256 amount, uint256 paymentDate, uint256 bondSupply);
    event InterestDistributed(uint256 totalAmount, uint256 recipients, uint256 effectiveRate);
    event InterestPaid(address indexed recipient, uint256 amount, uint256 timestamp);
    event InterestPaymentFailed(address indexed recipient, uint256 amount, string reason);
    
    event CryptoPurchaseRequested(string asset, uint256 amount, address requester);
    event CryptoPurchaseExecuted(string asset, uint256 amountIn, uint256 amountOut);
    event CryptoPurchaseRejected(string asset, uint256 amount, string reason);
    
    event FundsAllocated(string pool, uint256 amount, uint256 remainingBalance);
    event LargeTransfer(address indexed from, address indexed to, uint256 amount);
    event ConcentrationRisk(address indexed holder, uint256 percentage);
    event EmergencyPause(string reason, address indexed triggeredBy);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address recipient, 
        address defaultAdmin, 
        address pauser, 
        address minter, 
        address upgrader
    ) public initializer {
        __ERC20_init("AcmeBankCryptoBond", "ACMEB");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();
        __ERC20Permit_init("AcmeBankCryptoBond");
        __ERC20Votes_init();
        __UUPSUpgradeable_init();

        // Initialize risk thresholds BEFORE minting (to avoid checks on uninitialized values)
        largeTransferThreshold = 100000 * 10 ** decimals(); // 100k tokens
        maxConcentration = 2000; // 20%
        dailyPurchaseLimit = 10000000 * 10 ** decimals(); // 10M tokens
        
        // Initialize bond parameters
        baseInterestRate = 500; // 5% annual
        interestPaymentInterval = 30 days;
        nextInterestPayment = block.timestamp + interestPaymentInterval;
        interestPool = address(this);

        // Mint initial supply (AFTER thresholds are set)
        _mint(recipient, 1000000 * 10 ** decimals()); // 1M tokens
        
        // Grant standard roles
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(UPGRADER_ROLE, upgrader);
    }

    // ========== INTEREST PAYMENT FUNCTIONS ==========
    
    /// @notice Distributes interest to all bond holders
    /// @dev Called by Relayer via INTEREST_PAYER_ROLE on schedule
    function distributeInterest() external onlyRole(INTEREST_PAYER_ROLE) whenNotPaused {
        require(block.timestamp >= nextInterestPayment, "Interest not yet due");
        
        uint256 totalHolders = 0;
        uint256 totalInterest = 0;
        uint256 effectiveRate = calculateEffectiveRate();
        
        // Emit event for Monitor to track
        emit InterestPaymentDue(totalInterest, block.timestamp, totalSupply());
        
        // In production, would iterate through all holders
        // For demo, we'll simulate with a few transfers
        address[] memory demoHolders = getDemoHolders();
        
        for (uint i = 0; i < demoHolders.length; i++) {
            uint256 balance = balanceOf(demoHolders[i]);
            if (balance > 0) {
                uint256 interest = (balance * effectiveRate) / 10000 / 12; // Monthly interest
                if (balanceOf(interestPool) >= interest) {
                    _transfer(interestPool, demoHolders[i], interest);
                    emit InterestPaid(demoHolders[i], interest, block.timestamp);
                    totalInterest += interest;
                    totalHolders++;
                } else {
                    emit InterestPaymentFailed(demoHolders[i], interest, "Insufficient pool balance");
                }
            }
        }
        
        nextInterestPayment = block.timestamp + interestPaymentInterval;
        emit InterestDistributed(totalInterest, totalHolders, effectiveRate);
    }
    
    /// @notice Checks if interest payment is due
    function isInterestDue() external view returns (bool) {
        return block.timestamp >= nextInterestPayment;
    }
    
    /// @notice Calculates effective interest rate including crypto performance
    function calculateEffectiveRate() public view returns (uint256) {
        // For demo, using base rate + simulated bonus
        uint256 cryptoBonus = 200; // 2% bonus
        return baseInterestRate + cryptoBonus;
    }
    
    // ========== CRYPTO PURCHASE FUNCTIONS ==========
    
    /// @notice Requests approval for crypto purchase
    function requestCryptoPurchase(
        string memory asset,
        uint256 amount
    ) external onlyRole(CRYPTO_TRADER_ROLE) {
        require(amount <= cryptoPurchasePool, "Insufficient funds");
        require(amount <= dailyPurchaseLimit, "Exceeds daily limit");
        
        emit CryptoPurchaseRequested(asset, amount, msg.sender);
    }
    
    /// @notice Records executed crypto purchase
    function recordCryptoPurchase(
        string memory asset,
        uint256 amountIn,
        uint256 amountOut
    ) external onlyRole(CRYPTO_TRADER_ROLE) {
        cryptoPurchasePool -= amountIn;
        cryptoAllocations[asset] += amountOut;
        totalCryptoValue += amountOut;
        
        emit CryptoPurchaseExecuted(asset, amountIn, amountOut);
        emit FundsAllocated("CRYPTO_PURCHASE", amountIn, cryptoPurchasePool);
    }
    
    // ========== FUND MANAGEMENT ==========
    
    /// @notice Allocates funds to different pools
    function allocateFunds(
        uint256 toCrypto,
        uint256 toInterest,
        uint256 toOperational
    ) external onlyRole(TREASURER_ROLE) {
        uint256 total = toCrypto + toInterest + toOperational;
        require(balanceOf(address(this)) >= total, "Insufficient balance");
        
        cryptoPurchasePool += toCrypto;
        interestReservePool += toInterest;
        operationalPool += toOperational;
        
        emit FundsAllocated("CRYPTO", toCrypto, cryptoPurchasePool);
        emit FundsAllocated("INTEREST", toInterest, interestReservePool);
        emit FundsAllocated("OPERATIONAL", toOperational, operationalPool);
    }
    
    // ========== EMERGENCY FUNCTIONS ==========
    
    /// @notice Emergency pause with reason tracking
    function emergencyPause(string memory reason) external onlyRole(PAUSER_ROLE) {
        _pause();
        emit EmergencyPause(reason, msg.sender);
    }
    
    // ========== STANDARD OVERRIDES ==========
    
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    // ========== TRANSFER MONITORING ==========
    
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable, ERC20VotesUpgradeable)
    {
        // Check for large transfers
        if (value > largeTransferThreshold) {
            emit LargeTransfer(from, to, value);
        }
        
        // Check concentration risk (only if supply exists to avoid division by zero)
        if (to != address(0) && totalSupply() > 0) {
            uint256 recipientBalance = balanceOf(to) + value;
            uint256 concentration = (recipientBalance * 10000) / totalSupply();
            if (concentration > maxConcentration) {
                emit ConcentrationRisk(to, concentration);
            }
        }
        
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }
    
    // ========== HELPER FUNCTIONS ==========
    
    /// @notice Gets demo holder addresses for testing
    function getDemoHolders() internal pure returns (address[] memory) {
        address[] memory holders = new address[](2);
        holders[0] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        holders[1] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        return holders;
    }
    
    /// @notice Sets interest parameters (admin only)
    function setInterestParameters(
        uint256 _baseRate,
        uint256 _interval
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseInterestRate = _baseRate;
        interestPaymentInterval = _interval;
    }
    
    /// @notice Sets risk thresholds (admin only)
    function setRiskThresholds(
        uint256 _largeTransfer,
        uint256 _maxConc,
        uint256 _dailyLimit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        largeTransferThreshold = _largeTransfer;
        maxConcentration = _maxConc;
        dailyPurchaseLimit = _dailyLimit;
    }
}
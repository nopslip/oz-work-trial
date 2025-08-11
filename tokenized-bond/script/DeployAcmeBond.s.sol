// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/AcmeBankCryptoBond.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployAcmeBondScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy implementation contract
        AcmeBankCryptoBond implementation = new AcmeBankCryptoBond();
        console.log("Implementation deployed at:", address(implementation));
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            AcmeBankCryptoBond.initialize.selector,
            deployer,  // recipient
            deployer,  // defaultAdmin
            deployer,  // pauser
            deployer,  // minter
            deployer   // upgrader
        );
        
        // Deploy proxy pointing to implementation
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        
        // Cast proxy to our contract interface
        AcmeBankCryptoBond bond = AcmeBankCryptoBond(address(proxy));
        
        console.log("=== Acme Bank Crypto Bond Deployed ===");
        console.log("Proxy Address:", address(proxy));
        console.log("Implementation Address:", address(implementation));
        console.log("Name:", bond.name());
        console.log("Symbol:", bond.symbol());
        console.log("Total Supply:", bond.totalSupply() / 10**18, "tokens");
        console.log("Next Interest Payment:", bond.nextInterestPayment());
        
        // Grant additional custom roles
        bond.grantRole(bond.INTEREST_PAYER_ROLE(), deployer);
        bond.grantRole(bond.CRYPTO_TRADER_ROLE(), deployer);
        bond.grantRole(bond.TREASURER_ROLE(), deployer);
        
        console.log("\n=== Roles Configured ===");
        console.log("DEFAULT_ADMIN_ROLE:", deployer);
        console.log("INTEREST_PAYER_ROLE:", deployer);
        console.log("CRYPTO_TRADER_ROLE:", deployer);
        console.log("TREASURER_ROLE:", deployer);
        
        // Transfer some tokens to demo accounts for testing
        address demoAccount1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        address demoAccount2 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        
        bond.transfer(demoAccount1, 100_000 * 10**18);
        bond.transfer(demoAccount2, 50_000 * 10**18);
        
        console.log("\n=== Initial Token Distribution ===");
        console.log("Demo Account 1: 100,000 ACMEB");
        console.log("Demo Account 2: 50,000 ACMEB");
        console.log("Contract (for pools):", bond.balanceOf(address(bond)) / 10**18, "ACMEB");
        console.log("Remaining in deployer:", bond.balanceOf(deployer) / 10**18, "ACMEB");
        
        // Transfer funds to the contract for pools
        bond.transfer(address(bond), 350_000 * 10**18);
        
        // Allocate funds to pools
        bond.allocateFunds(
            200_000 * 10**18,  // Crypto purchase pool: 200k
            100_000 * 10**18,  // Interest reserve: 100k
            50_000 * 10**18    // Operational: 50k
        );
        
        console.log("\n=== Fund Pools Initialized ===");
        console.log("Crypto Purchase Pool: 200,000 ACMEB");
        console.log("Interest Reserve Pool: 100,000 ACMEB");
        console.log("Operational Pool: 50,000 ACMEB");
        
        console.log("\n=== Ready for OpenZeppelin Monitor & Relayer ===");
        console.log("Monitor should watch address:", address(proxy));
        console.log("Relayer should use INTEREST_PAYER_ROLE address:", deployer);
        console.log("\nInterest payment due at timestamp:", bond.nextInterestPayment());
        console.log("Current timestamp:", block.timestamp);
        console.log("Time until first payment:", bond.nextInterestPayment() - block.timestamp, "seconds");
        
        vm.stopBroadcast();
    }
}
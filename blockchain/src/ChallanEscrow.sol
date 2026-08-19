// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChallanEscrow {
    struct Trip {
        bytes32 documentHash; // The immutable cryptographic proof of the Challan
        uint256 freightLocked; // The INR/ETH locked in the vault
        address payable driverWallet; // Where the money goes upon delivery
        bool isSettled;
    }

    // Maps your Challan ID (e.g., "CH-2026...") to the Escrow Data
    mapping(string => Trip) public trips;
    address public fleetAdmin;

    event EscrowLocked(string challanId, uint256 amount);
    event EscrowReleased(string challanId, address driver);

    constructor() {
        fleetAdmin = msg.sender; // The manager deploying the contract
    }

    // 1. Manager clicks "Fund Escrow Vault"
    function lockFreight(string memory _challanId, bytes32 _docHash, address payable _driver) external payable {
        require(msg.sender == fleetAdmin, "Only Fleet Admin can lock funds");
        require(msg.value > 0, "Must deposit freight amount");
        require(trips[_challanId].freightLocked == 0, "Escrow already exists for this trip");

        trips[_challanId] = Trip({
            documentHash: _docHash,
            freightLocked: msg.value,
            driverWallet: _driver,
            isSettled: false
        });

        emit EscrowLocked(_challanId, msg.value);
    }

    // 2. Manager clicks "Verify POD & Release Escrow"
    function releasePayment(string memory _challanId) external {
        require(msg.sender == fleetAdmin, "Only Fleet Admin can release funds");
        Trip storage trip = trips[_challanId];
        
        require(trip.freightLocked > 0, "No funds locked");
        require(!trip.isSettled, "Trip already settled");

        trip.isSettled = true;
        
        // Transfer the locked funds to the driver
        trip.driverWallet.transfer(trip.freightLocked);
        
        emit EscrowReleased(_challanId, trip.driverWallet);
    }
}
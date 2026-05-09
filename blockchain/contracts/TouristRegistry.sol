// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TouristRegistry {
    struct Tourist {
        string touristId;
        string email;
        uint256 registeredAt;
        bool exists;
    }

    mapping(string => Tourist) private tourists;   // touristId => Tourist
    mapping(string => string) private emailToId;   // email => touristId

    event TouristRegistered(string touristId, string email, uint256 timestamp);

    function registerTourist(string memory touristId, string memory email) public {
        require(!tourists[touristId].exists, "Tourist ID already registered");
        require(bytes(emailToId[email]).length == 0, "Email already registered");

        tourists[touristId] = Tourist({
            touristId: touristId,
            email: email,
            registeredAt: block.timestamp,
            exists: true
        });

        emailToId[email] = touristId;

        emit TouristRegistered(touristId, email, block.timestamp);
    }

    function verifyTourist(string memory touristId)
        public
        view
        returns (bool valid, string memory email, uint256 registeredAt)
    {
        Tourist memory t = tourists[touristId];
        return (t.exists, t.email, t.registeredAt);
    }

    function getTouristIdByEmail(string memory email)
        public
        view
        returns (string memory)
    {
        return emailToId[email];
    }
}

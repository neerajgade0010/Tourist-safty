pragma solidity ^0.8.0;

contract Log {
    string[] public logs;

    function addLog(string memory _log) public {
        logs.push(_log);
    }
}
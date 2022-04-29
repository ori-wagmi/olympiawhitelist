// SPDX-License-Identifier: AGPLv3"

pragma solidity ^0.8.0;

import {
    ERC721PresetMinterPauserAutoId
} from "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract TestERC721 is ERC721PresetMinterPauserAutoId {
    constructor()
        ERC721PresetMinterPauserAutoId("TestERC721", "TestERC721", "https://example.com") {}
}

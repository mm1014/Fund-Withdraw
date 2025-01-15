require("@nomicfoundation/hardhat-toolbox")
// require("@nomiclabs/hardhat-waffle")
// require("hardhat-gas-reporter")
// require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()
require("solidity-coverage")
require("hardhat-deploy")
/** @type import('hardhat/config').HardhatUserConfig */
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""
const SEPOLIA_RPC_URL =
    process.env.SEPOLIA_RPC_URL ||
    "https://eth-sepolia.g.alchemy.com/v2/XbWGDPUsUHvGRa-eG_3KgQjh2PNR6gDx"
const PRIVATE_KEY =
    process.env.PRIVATE_KEY ||
    "6be3448a1cc912c17d3285f925067cfd3c11eca6c4d96268bbfe07cb76ce39c6"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
    },
    solidity: {
        compilers: [{ version: "0.8.7" }, { version: "0.6.6" }],
    },
    etherscan: {
        apiKey: {
            sepolia: ETHERSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        // coinmarketcap: COINMARKETCAP_API_KEY,
        // token: "ETH",
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
    },
}

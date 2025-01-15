const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe
          let deployer
          let fundMeAddress
          const sendValue = ethers.parseEther("0.02")
          beforeEach(async function () {
              // 1. 获取 namedAccounts 里的 deployer 地址
              deployer = (await getNamedAccounts()).deployer

              // 3. 拿到刚刚部署的合约信息 (地址、ABI 等)
              const fundMeDeployment = await deployments.get("FundMe")
              //   const mockV3AggregatorDeployment = await deployments.get(
              //       "MockV3Aggregator"
              //   )
              // 4. 获取 deployer 的 Signer 对象
              deployerSigner = await ethers.getSigner(deployer)

              // 5. 通过 getContractAt 拿到合约实例
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeDeployment.address,
                  deployerSigner
              )
              //   mockV3Aggregator = await ethers.getContractAt(
              //       "MockV3Aggregator",
              //       mockV3AggregatorDeployment.address,
              //       deployerSigner
              //   )
              fundMeAddress = await fundMe.getAddress()
          })
          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await ethers.provider.getBalance(
                  fundMeAddress
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })

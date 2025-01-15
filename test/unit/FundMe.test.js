const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe
          let deployer
          let mockV3Aggregator
          let fundMeAddress
          const sendValue = ethers.parseEther("1")
          beforeEach(async function () {
              // 1. 获取 namedAccounts 里的 deployer 地址
              deployer = (await getNamedAccounts()).deployer

              // 2. 让 hardhat-deploy 执行所有带 ["all"] 标签的脚本，确保已部署合约
              await deployments.fixture(["all"])

              // 3. 拿到刚刚部署的合约信息 (地址、ABI 等)
              const fundMeDeployment = await deployments.get("FundMe")
              const mockV3AggregatorDeployment = await deployments.get(
                  "MockV3Aggregator"
              )

              // 4. 获取 deployer 的 Signer 对象
              deployerSigner = await ethers.getSigner(deployer)
              console.log("签名者是:", deployerSigner)

              // 5. 通过 getContractAt 拿到合约实例
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeDeployment.address,
                  deployerSigner
              )
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  mockV3AggregatorDeployment.address,
                  deployerSigner
              )
              fundMeAddress = await fundMe.getAddress()
          })
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  const mockV3AggregatorAddress =
                      await mockV3Aggregator.getAddress()
                  assert.equal(response, mockV3AggregatorAddress)
              })
          })
          describe("fund", () => {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async () => {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", () => {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  //gasCost
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  //Assert
                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })
              it("Withdraw ETH from a single founder use by cheaperWithdraw", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  //gasCost
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  //Assert
                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })
              it("allows us to withdraw with multiple getFunder", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.withdraw() //only owner can withdraw
                  const transactionReceipt = await transactionResponse.wait(1)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  //gasCost
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  //Assert
                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  //Make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted //new getFunder array

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FuneMe_NotOwner")
              })
              it("cheaperWithdraw testing...", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw() //only owner can withdraw
                  const transactionReceipt = await transactionResponse.wait(1)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  //gasCost
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  //Assert
                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  //Make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted //new getFunder array

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })

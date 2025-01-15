const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    // 4. 获取 deployer 的 Signer 对象
    deployerSigner = await ethers.getSigner(deployer)
    const fundMeDeployment = await deployments.get("FundMe")
    // 5. 通过 getContractAt 拿到合约实例
    const fundMe = await ethers.getContractAt(
        "FundMe",
        fundMeDeployment.address,
        deployerSigner
    )
    const fundMeAddress = await fundMe.getAddress()
    console.log(`Got contract FundMe at ${fundMeAddress}`)
    console.log("Withdrawing from contract...")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait()
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

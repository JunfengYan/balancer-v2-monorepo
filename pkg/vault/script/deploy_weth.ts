import { 
  Contract, 
  ContractFactory 
} from "ethers"
import { ethers } from "hardhat"

const main = async(): Promise<any> => {
  const Weth: ContractFactory = await ethers.getContractFactory("weth")
  const weth: Contract = await Weth.deploy()

  await weth.deployed()
  console.log(`weth deployed to: ${weth.address}`)
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error)
  process.exit(1)
})

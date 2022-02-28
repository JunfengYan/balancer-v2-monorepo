import { 
  Contract, 
  ContractFactory 
} from "ethers"
import { ethers } from "hardhat"

const main = async(): Promise<any> => {
  const Authorizer: ContractFactory = await ethers.getContractFactory("Authorizer")
  const authorizer: Contract = await Authorizer.deploy("0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC")

  await authorizer.deployed()
  console.log(`Authorizer deployed to: ${authorizer.address}`)
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error)
  process.exit(1)
})

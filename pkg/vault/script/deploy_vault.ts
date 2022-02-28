import { 
  Contract, 
  ContractFactory 
} from "ethers"
import { expect } from 'chai';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { advanceTime, currentTimestamp, MONTH, DAY } from '@balancer-labs/v2-helpers/src/time';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { deploy, deployedAt } from '@balancer-labs/v2-helpers/src/contract';
import { expectEqualWithError } from '@balancer-labs/v2-helpers/src/test/relativeError';
import { ethers } from "hardhat"
import '@nomiclabs/hardhat-ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { toNormalizedWeights } from '@balancer-labs/balancer-js';
import {
  BasePoolRights,
  ManagedPoolParams,
  ManagedPoolRights,
} from '@balancer-labs/v2-helpers/src/models/pools/weighted/types';


const main = async(): Promise<any> => {

  const accounts: SignerWithAddress[] = await ethers.getSigners()
  // deploying authorizer
  const Authorizer: ContractFactory = await ethers.getContractFactory("Authorizer")
  // this sets the first account as the admin
  const authorizer: Contract = await Authorizer.deploy(accounts[0].address)
  await authorizer.deployed()
  console.log(`Authorizer deployed to: ${authorizer.address}`)
  
  //deploying weth -- needs to be changed to wavax since we are on avalanche
  const Wavax: ContractFactory = await ethers.getContractFactory("wavax")
  const wavax: Contract = await Wavax.deploy()
  await wavax.deployed()
  console.log(`wavax deployed to: ${wavax.address}`)
  
  const Weth: ContractFactory = await ethers.getContractFactory("weth")
  const weth: Contract = await Weth.deploy()
  await weth.deployed()
  console.log(`weth deployed to: ${weth.address}`)
  
  // deploying vault
  // for the last two parameters of the vault,see https://github.com/balancer-labs/balancer-v2-monorepo/blob/master/pkg/solidity-utils/contracts/helpers/TemporarilyPausable.sol 
  const Vault: ContractFactory = await ethers.getContractFactory("Vault")
  const vault: Contract = await Vault.deploy(authorizer.address,wavax.address,0,0)
  await vault.deployed()
  console.log(`Vault deployed to: ${vault.address}`)
  
  console.log('Deploying managed pool');
  // deploy managed pool with managedpool factory
  let baseFactory: Contract;
  let factory: Contract;
  let poolController: Contract;
  let manager: SignerWithAddress;
  let assetManager: SignerWithAddress;
  let poolControllerAddress: string;
  
  
  const NAME = 'Test Managed Pool';
  const SYMBOL = 'TMP';
  const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);
  const POOL_MANAGEMENT_SWAP_FEE_PERCENTAGE = fp(0.5);
  const MIN_WEIGHT_CHANGE_DURATION = 0.01 * DAY;
  const WEIGHTS = toNormalizedWeights([fp(50), fp(50)]);

  const BASE_PAUSE_WINDOW_DURATION = MONTH * 3;
  const BASE_BUFFER_PERIOD_DURATION = MONTH;
  
  const canTransfer = true;
  const canChangeSwapFee = true;
  const swapsEnabled = true;
  const mustAllowlistLPs = false;
  
  const TokenList: string[] = [weth.address,wavax.address]
  const sortedTokenList: string[] = 
  TokenList.sort((a,b) => a.toLowerCase() > b.toLowerCase() ? 1:-1);
  
  console.log('Deploy Facotry')
  baseFactory = await deploy('v2-pool-weighted/BaseManagedPoolFactory', { args: [vault.address] });
  factory = await deploy('v2-pool-weighted/ManagedPoolFactory', { args: [baseFactory.address] });
  
  const assetManagers: string[] = Array(sortedTokenList.length).fill(ZERO_ADDRESS);
  
  const newPoolParams: ManagedPoolParams = {
	vault: vault.address,
	name: NAME,
	symbol: SYMBOL,
	tokens: sortedTokenList,
	normalizedWeights: WEIGHTS,
	assetManagers: assetManagers,
	swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
	pauseWindowDuration: BASE_PAUSE_WINDOW_DURATION,
	bufferPeriodDuration: BASE_PAUSE_WINDOW_DURATION,
	owner: accounts[0].address,
	swapEnabledOnStart: swapsEnabled,
	mustAllowlistLPs: mustAllowlistLPs,
	managementSwapFeePercentage: POOL_MANAGEMENT_SWAP_FEE_PERCENTAGE,
    };
    const basePoolRights: BasePoolRights = {
      canTransferOwnership: canTransfer,
      canChangeSwapFee: canChangeSwapFee,
      canUpdateMetadata: true,
    };

    const managedPoolRights: ManagedPoolRights = {
      canChangeWeights: true,
      canDisableSwaps: true,
      canSetMustAllowlistLPs: true,
      canSetCircuitBreakers: true,
      canChangeTokens: true,
      canChangeMgmtSwapFee: true,
    };
    
    const receipt = await (
      await factory
        .connect(accounts[0])
        .create(newPoolParams, basePoolRights, managedPoolRights, MIN_WEIGHT_CHANGE_DURATION)
    ).wait();

    const event = expectEvent.inReceipt(receipt, 'ManagedPoolCreated');
    const poolAddress = event.args.pool;
    poolControllerAddress = event.args.poolController;
    const mpool = deployedAt('ManagedPool', event.args.pool);
 
    console.log(`Managed pool deployed to: ${poolAddress}`)
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error)
  process.exit(1)
})

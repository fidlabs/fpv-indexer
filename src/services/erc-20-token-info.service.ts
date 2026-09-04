import ERC20ABI from '@/abis/erc-20.abi';
import { RECENT_NODE_CLIENT } from '@/lib/constants';
import type { FilecoinPublicClient } from '@/lib/types';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { isAddress, isAddressEqual, zeroAddress, type Address } from 'viem';

@Injectable()
export class ERC20TokenInfoService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(RECENT_NODE_CLIENT)
    private readonly recentNodeClient: FilecoinPublicClient,
  ) {}

  public async getTokenSymbol(tokenAddress: string): Promise<string> {
    this.assertValidTokenAddress(tokenAddress);

    if (isAddressEqual(tokenAddress, zeroAddress)) {
      return this.recentNodeClient.chain.nativeCurrency.symbol;
    }

    const cacheKey = `${tokenAddress}_erc20_symbol`;
    const cachedSymbol = await this.cacheManager.get(cacheKey);

    if (typeof cachedSymbol === 'string') {
      return cachedSymbol;
    }

    const symbol = await this.recentNodeClient.readContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'symbol',
    });

    // cache permanently, does not change
    await this.cacheManager.set(cacheKey, symbol, 0);

    return symbol;
  }

  public async getTokenDecimals(tokenAddress: string): Promise<number> {
    this.assertValidTokenAddress(tokenAddress);

    if (isAddressEqual(tokenAddress, zeroAddress)) {
      return this.recentNodeClient.chain.nativeCurrency.decimals;
    }

    const cacheKey = `${tokenAddress}_erc20_decimals`;
    const cachedDecimals = await this.cacheManager.get(cacheKey);

    if (typeof cachedDecimals === 'number') {
      return cachedDecimals;
    }

    const decimals = await this.recentNodeClient.readContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'decimals',
    });

    // cache permanently, does not change
    await this.cacheManager.set(cacheKey, decimals, 0);

    return decimals;
  }

  private assertValidTokenAddress(
    tokenAddress: string,
  ): asserts tokenAddress is Address {
    if (!isAddress(tokenAddress)) {
      throw new TypeError(
        `"${tokenAddress}" is not a valid ERC20 token address`,
      );
    }
  }
}

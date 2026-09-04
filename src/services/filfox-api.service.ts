import { RECENT_NODE_CLIENT } from '@/lib/constants';
import type { FilecoinPublicClient } from '@/lib/types';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { type Address } from 'viem';
import { filecoinCalibration } from 'viem/chains';
import * as z from 'zod';

const contractDeploymentEpochResponseSchema = z.object({
  createHeight: z.number().int().min(0),
});

@Injectable()
export class FilfoxApiService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(RECENT_NODE_CLIENT)
    protected readonly recentNodeClient: FilecoinPublicClient,
  ) {}

  public async getContractDeploymentEpoch(
    contractAddress: Address,
  ): Promise<bigint> {
    const cacheKey = `${contractAddress}_deployment_epoch`;
    const cachedValue = await this.cacheManager.get(cacheKey);

    if (typeof cachedValue === 'bigint') {
      return cachedValue;
    }

    try {
      const prefix =
        this.recentNodeClient.chain.id === filecoinCalibration.id
          ? 'https://calibration.api.filfox.info'
          : 'https://filfox.info';

      const response = await fetch(
        `${prefix}/api/v1/address/${contractAddress}`,
      );

      if (!response.ok) {
        throw new Error(`Filfox API returned status ${response.status}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await response.json();
      const parseResult = contractDeploymentEpochResponseSchema.safeParse(json);

      if (!parseResult.success) {
        throw new TypeError(
          'Invalid response from Filfox API or not a contract address',
        );
      }

      const deploymentEpoch = BigInt(parseResult.data.createHeight);
      await this.cacheManager.set(cacheKey, deploymentEpoch, 0);
      return deploymentEpoch;
    } catch (error) {
      throw new Error(
        `Could not get deployment epoch of contract ${contractAddress}; Error:\n\n${String(error)}`,
      );
    }
  }
}

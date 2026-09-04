import { createPublicClient, extractChain, http } from 'viem';
import { prettifyError } from 'zod';
import { CONFIG_SCHEMA, SUPPORTED_CHAINS } from './constants';
import type { ConfigShape } from './types';

export interface CreateClientForChainParameters {
  chainId: (typeof SUPPORTED_CHAINS)[number]['id'];
  rpcUrl?: string | null;
  authToken?: string | null;
}

export function validateConfig(config: Record<string, unknown>): ConfigShape {
  const result = CONFIG_SCHEMA.safeParse(config);

  if (!result.success) {
    throw new TypeError(
      `Invalid PoRep config provided:\n\n${prettifyError(result.error)}`,
    );
  }

  return result.data;
}

export function createClientForChain({
  chainId,
  rpcUrl,
  authToken,
}: CreateClientForChainParameters) {
  const chain = extractChain({ chains: SUPPORTED_CHAINS, id: chainId });

  return createPublicClient({
    chain: chain,
    transport: http(rpcUrl ?? undefined, {
      fetchOptions:
        typeof authToken === 'string' && authToken !== ''
          ? {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          : undefined,
      timeout: 60_000,
    }),
  });
}

export function divideBigInt(
  numerator: bigint,
  denominator: bigint,
  precision = 2,
): number {
  if (denominator === 0n) {
    throw new TypeError('Cannot divide by zero');
  }

  const precisionExponent = 10n ** BigInt(precision);
  const numeratorWithPrecision = numerator * precisionExponent;
  const fraction = numeratorWithPrecision / denominator;

  return Number(fraction) / Math.pow(10, precision);
}

export function maxBigInt(...inputs: [bigint, ...bigint[]]): bigint {
  return inputs.reduce((max, current) => {
    return current > max ? current : max;
  });
}

export function minBigInt(...inputs: [bigint, ...bigint[]]): bigint {
  return inputs.reduce((min, current) => {
    return current < min ? current : min;
  });
}

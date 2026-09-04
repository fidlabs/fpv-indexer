import ServiceRewardsActorABI from '@/abis/service-rewards-actor.abi';
import { type TransactionContext } from '@/db/db';
import { ServiceRewardsActorParameterType } from '@/db/enums';
import { ARCHIVE_NODE_CLIENT, RECENT_NODE_CLIENT } from '@/lib/constants';
import { maxBigInt } from '@/lib/utils';
import { ERC20TokenInfoService } from '@/services/erc-20-token-info.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigNumber } from 'bignumber.js';
import { uniq } from 'es-toolkit';
import { AbiEvent, Address, getAbiItem } from 'viem';
import type {
  ConfigShape,
  FilecoinPublicClient,
  LogForEvents,
} from '../lib/types';
import { AbstractIndexer, type GetLogsParameters } from './abstract.indexer';

type EventType = (typeof events)[number];
type Logs = LogForEvents<EventType>[];
type BindingDeclaredLog = LogForEvents<typeof bindingDeclaredEvent>;
type BindingReassignedLog = LogForEvents<typeof bindingReassignedEvent>;
type AdmittedListsUpdatedLog = LogForEvents<typeof admittedListUpdatedEvent>;
type PricingParamsUpdatedLog = LogForEvents<typeof pricingParamsUpdatedEvent>;

const bindingDeclaredEvent = getAbiItem({
  abi: ServiceRewardsActorABI,
  name: 'BindingDeclared',
});

const bindingReassignedEvent = getAbiItem({
  abi: ServiceRewardsActorABI,
  name: 'BindingReassigned',
});

const admittedListUpdatedEvent = getAbiItem({
  abi: ServiceRewardsActorABI,
  name: 'AdmittedListsUpdated',
});

const pricingParamsUpdatedEvent = getAbiItem({
  abi: ServiceRewardsActorABI,
  name: 'PricingParamsUpdated',
});

const events = [
  getAbiItem({ abi: ServiceRewardsActorABI, name: 'OrchestratorAdmitted' }),
  getAbiItem({ abi: ServiceRewardsActorABI, name: 'OrchestratorRemoved' }),
  getAbiItem({
    abi: ServiceRewardsActorABI,
    name: 'OrchestratorWalletReplaced',
  }),
  bindingDeclaredEvent,
  bindingReassignedEvent,
  getAbiItem({ abi: ServiceRewardsActorABI, name: 'BindingCanceled' }),
  admittedListUpdatedEvent,
  pricingParamsUpdatedEvent,
  getAbiItem({ abi: ServiceRewardsActorABI, name: 'SharesSubmitted' }),
] as const satisfies AbiEvent[];

@Injectable()
export class ServiceRewardsActorIndexer extends AbstractIndexer<EventType> {
  constructor(
    protected readonly configService: ConfigService<ConfigShape, true>,
    @Inject(RECENT_NODE_CLIENT)
    protected readonly recentNodeClient: FilecoinPublicClient,
    @Inject(ARCHIVE_NODE_CLIENT)
    protected readonly archiveNodeClient: FilecoinPublicClient,
    private readonly erc20Service: ERC20TokenInfoService,
  ) {
    super(configService, recentNodeClient, archiveNodeClient);
  }

  public getName(): string {
    return ServiceRewardsActorIndexer.name;
  }

  protected async getLogs({
    client,
    contractAddress,
    fromBlock,
    toBlock,
  }: GetLogsParameters): Promise<Logs> {
    return client.getLogs({
      address: contractAddress,
      events,
      fromBlock,
      toBlock,
      strict: true,
    });
  }

  protected async updateDb(tx: TransactionContext, logs: Logs): Promise<void> {
    const admittedTokens = logs
      .filter((log) => log.eventName === 'AdmittedListsUpdated')
      .flatMap((log) =>
        log.args.stablecoins.map((token) => token.toLowerCase() as Address),
      );
    const uniqueAdmittedTokens = uniq(admittedTokens);

    const admittedTokensDecimalsRequests = uniqueAdmittedTokens.map(
      async (tokenAddress) => {
        const decimals = await this.erc20Service.getTokenDecimals(tokenAddress);
        return [tokenAddress, decimals] as const;
      },
    );
    const admittedTokensSymbolsRequests = uniqueAdmittedTokens.map(
      async (tokenAddress) => {
        const symbol = await this.erc20Service.getTokenSymbol(tokenAddress);
        return [tokenAddress, symbol] as const;
      },
    );

    const [admittedTokensDecimals, admittedTokensSymbols] = await Promise.all([
      Promise.all(admittedTokensDecimalsRequests),
      Promise.all(admittedTokensSymbolsRequests),
    ]);

    const decimalsMap = new Map(admittedTokensDecimals);
    const symbolsMap = new Map(admittedTokensSymbols);

    for (const log of logs) {
      switch (log.eventName) {
        case 'OrchestratorAdmitted':
          await tx
            .insertInto('service_orchestrator')
            .values({
              id: log.args.orch.toLowerCase(),
              wallet: log.args.wallet.toLowerCase(),
              registration_epoch: log.blockNumber.toString(),
              registration_tx_hash: log.transactionHash.toLowerCase(),
            })
            .executeTakeFirst();

          break;

        case 'OrchestratorRemoved':
          await tx
            .updateTable('service_orchestrator')
            .set({
              removed: true,
              removal_epoch: log.blockNumber.toString(),
              removal_tx_hash: log.transactionHash.toLowerCase(),
            })
            .where('id', '=', log.args.orch.toLowerCase())
            .executeTakeFirst();

          break;

        case 'OrchestratorWalletReplaced':
          await tx
            .updateTable('service_orchestrator')
            .set({
              wallet: log.args.newWallet.toLowerCase(),
            })
            .where('id', '=', log.args.oldOrch.toLowerCase())
            .executeTakeFirst();

          break;

        case 'BindingDeclared':
          await this.createBinding(tx, log);
          break;

        case 'BindingReassigned':
          await this.reassignBinding(tx, log);
          break;

        case 'BindingCanceled':
          await tx
            .updateTable('service_pair')
            .set({
              to_epoch: (log.blockNumber - 1n).toString(),
              unbinding_epoch: log.blockNumber.toString(),
              unbinding_tx_hash: log.transactionHash.toLowerCase(),
            })
            .where('operator', '=', log.args.operator.toLowerCase())
            .where('payer', '=', log.args.payer.toLowerCase())
            .where(
              'service_orchestrator_id',
              '=',
              log.args.orchestrator.toLowerCase(),
            )
            .where('to_epoch', 'is', null)
            .execute();

          break;

        case 'AdmittedListsUpdated':
          await this.updatedAdmittedLists(tx, log, decimalsMap, symbolsMap);
          break;

        case 'PricingParamsUpdated':
          await this.updatePricingParams(tx, log);
          break;

        case 'SharesSubmitted':
          await tx
            .insertInto('quarter_bound_volume')
            .values({
              quarter_num: Number(log.args.q),
              volume_atto_usd: log.args.totalUsd.toString(),
              epoch: log.blockNumber.toString(),
              tx_hash: log.transactionHash.toLowerCase(),
            })
            .executeTakeFirst();

          break;
      }
    }
  }

  private async createBinding(tx: TransactionContext, log: BindingDeclaredLog) {
    const pairTupleString = `(operator: ${log.args.operator}, payer: ${log.args.payer})`;
    const activationEpoch = this.configService.get('ACTIVATION_EPOCH', {
      infer: true,
    });
    const epochsPerQuarter = this.configService.get('EPOCHS_PER_QUARTER', {
      infer: true,
    });

    const logQuarter = this.getQuarterForEpoch(log.blockNumber);

    const activeBindingsCount = await tx
      .selectFrom('service_pair')
      .where('operator', '=', log.args.operator.toLowerCase())
      .where('payer', '=', log.args.payer.toLowerCase())
      .where('to_epoch', 'is', null)
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow();

    if (BigInt(activeBindingsCount.count) > 0n) {
      throw new TypeError(
        `Pair ${pairTupleString} is actively bound to an orchestrator.`,
      );
    }

    const previousBindings = await tx
      .selectFrom('service_pair')
      .where('operator', '=', log.args.operator.toLowerCase())
      .where('payer', '=', log.args.payer.toLowerCase())
      .where('to_epoch', 'is not', null)
      .select((eb) => eb.fn.max('to_epoch').as('max_to_epoch'))
      .executeTakeFirstOrThrow();
    const maxToEpoch =
      previousBindings.max_to_epoch !== null
        ? BigInt(previousBindings.max_to_epoch)
        : null;

    if (maxToEpoch !== null && maxToEpoch >= log.blockNumber) {
      throw new TypeError(
        `Trying to bind pair ${pairTupleString} at epoch ${log.blockNumber} when it was released on epoch ${maxToEpoch}.`,
      );
    }

    const quarterStartEpoch =
      activationEpoch + epochsPerQuarter * (maxBigInt(logQuarter, 1n) - 1n);
    const quarterEndEpoch = quarterStartEpoch + epochsPerQuarter - 1n;

    const registrationCutoff = await tx
      .selectFrom('service_rewards_actor_parameter')
      .select('parameter_value')
      .where(
        'parameter_type',
        '=',
        ServiceRewardsActorParameterType.REGISTRATION_CUTOFF_EPOCHS,
      )
      .where('update_epoch', '<', quarterStartEpoch.toString())
      .orderBy('update_epoch', 'desc')
      .orderBy('update_log_index', 'desc')
      .executeTakeFirst();

    const noRegistrationCutoffError = new TypeError(
      `Cannot bind pair ${pairTupleString} at epoch ${log.blockNumber} - no "REGISTRATION_CUTOFF" parameter found for quarter Q${logQuarter}.`,
    );

    if (!registrationCutoff) {
      throw noRegistrationCutoffError;
    }

    const registrationCutoffEpochs = BigNumber(
      registrationCutoff.parameter_value,
    ).toBigInt();

    if (registrationCutoffEpochs === null) {
      throw noRegistrationCutoffError;
    }

    if (registrationCutoffEpochs > epochsPerQuarter) {
      throw new TypeError(
        `"REGISTRATION_CUTOFF" param for quarter Q${logQuarter} has value ${registrationCutoffEpochs} which is more than defined ${epochsPerQuarter} epochs per quarter.`,
      );
    }

    const cutoffStartEpoch = quarterEndEpoch - registrationCutoffEpochs + 1n;

    const fromEpoch = (() => {
      // registration falls into registration cutoff, binding applies from the
      // next quarter
      if (log.blockNumber >= cutoffStartEpoch) {
        return quarterEndEpoch + 1n;
      }

      // no previous releases or released in previous quarter, binding applies
      // from the beggining of the quarter
      if (
        maxToEpoch === null ||
        this.getQuarterForEpoch(maxToEpoch) !== logQuarter
      ) {
        return quarterStartEpoch;
      }

      return maxToEpoch + 1n;
    })();

    await tx
      .insertInto('service_pair')
      .values({
        service_orchestrator_id: log.args.orchestrator.toLowerCase(),
        payer: log.args.payer.toLowerCase(),
        operator: log.args.operator.toLowerCase(),
        from_epoch: fromEpoch.toString(),
        binding_epoch: log.blockNumber.toString(),
        binding_tx_hash: log.transactionHash.toLowerCase(),
      })
      .executeTakeFirst();
  }

  private async reassignBinding(
    tx: TransactionContext,
    log: BindingReassignedLog,
  ) {
    const activationEpoch = this.configService.get('ACTIVATION_EPOCH', {
      infer: true,
    });
    const epochsPerQuarter = this.configService.get('EPOCHS_PER_QUARTER', {
      infer: true,
    });

    const logQuarter = this.getQuarterForEpoch(log.blockNumber);
    const quarterStartEpoch =
      activationEpoch + epochsPerQuarter * (maxBigInt(logQuarter, 1n) - 1n);

    // inherited pairs start from quarter start otherwise from epoch they were
    // reassigned at
    const fromEpoch = log.args.inherit ? quarterStartEpoch : log.blockNumber;
    const unboundToEpoch = fromEpoch - 1n;

    // unbind active pairs
    await tx
      .updateTable('service_pair')
      .set({
        to_epoch: unboundToEpoch.toString(),
        unbinding_epoch: log.blockNumber.toString(),
        unbinding_tx_hash: log.transactionHash.toLowerCase(),
      })
      .where('operator', '=', log.args.operator.toLowerCase())
      .where('payer', '=', log.args.payer.toLowerCase())
      .where('to_epoch', 'is', null)
      .execute();

    await tx
      .insertInto('service_pair')
      .values({
        service_orchestrator_id: log.args.orchestrator.toLowerCase(),
        payer: log.args.payer.toLowerCase(),
        operator: log.args.operator.toLowerCase(),
        from_epoch: fromEpoch.toString(),
        binding_epoch: log.blockNumber.toString(),
        binding_tx_hash: log.transactionHash.toLowerCase(),
      })
      .executeTakeFirst();
  }

  private async updatedAdmittedLists(
    tx: TransactionContext,
    log: AdmittedListsUpdatedLog,
    decimalsMap: Map<Address, number>,
    symbolsMap: Map<Address, string>,
  ) {
    const whitelistedContracts = await tx
      .selectFrom('filecoin_pay_contract')
      .select('contract_address')
      .where('removal_epoch', 'is', null)
      .execute();
    const whitelistedContractsAddresses = whitelistedContracts.map((i) =>
      i.contract_address.toLowerCase(),
    );

    const whitelistedTokens = await tx
      .selectFrom('whitelisted_token')
      .select('token_address')
      .where('removal_epoch', 'is', null)
      .execute();
    const whitelistedTokensAddresses = whitelistedTokens.map((i) =>
      i.token_address.toLowerCase(),
    );

    const admittedContracts = log.args.filecoinPayContracts.map((c) =>
      c.toLowerCase(),
    );
    const addedContracts = admittedContracts.filter(
      (c) => !whitelistedContractsAddresses.includes(c),
    );
    const removedContracts = whitelistedContractsAddresses.filter(
      (c) => !admittedContracts.includes(c),
    );

    const admittedTokens = log.args.stablecoins.map((t) => t.toLowerCase());
    const addedTokens = admittedTokens.filter(
      (t) => !whitelistedTokensAddresses.includes(t),
    );
    const removedTokens = whitelistedTokensAddresses.filter(
      (t) => !admittedTokens.includes(t),
    );

    if (removedContracts.length > 0) {
      await tx
        .updateTable('filecoin_pay_contract')
        .set({
          removal_epoch: log.blockNumber.toString(),
          removal_log_index: log.logIndex,
          removal_tx_hash: log.transactionHash.toLowerCase(),
        })
        .where('contract_address', 'in', removedContracts)
        .where('removal_epoch', 'is', null)
        .execute();
    }

    if (removedTokens.length > 0) {
      await tx
        .updateTable('whitelisted_token')
        .set({
          removal_epoch: log.blockNumber.toString(),
          removal_log_index: log.logIndex,
          removal_tx_hash: log.transactionHash.toLowerCase(),
        })
        .where('token_address', 'in', removedTokens)
        .where('removal_epoch', 'is', null)
        .execute();
    }

    if (addedContracts.length > 0) {
      await tx
        .insertInto('filecoin_pay_contract')
        .values(
          addedContracts.map((contractAddress) => {
            return {
              contract_address: contractAddress,
              admittance_epoch: log.blockNumber.toString(),
              admittance_log_index: log.logIndex,
              admittance_tx_hash: log.transactionHash.toLowerCase(),
            };
          }),
        )
        .execute();
    }

    for (const tokenAddress of addedTokens) {
      const decimals = decimalsMap.get(tokenAddress as Address);

      if (decimals === undefined) {
        throw new TypeError(`No decimals found for token ${tokenAddress}.`);
      }

      const symbol = symbolsMap.get(tokenAddress as Address);

      if (symbol === undefined) {
        throw new TypeError(`No symbol found for token ${tokenAddress}.`);
      }

      await tx
        .insertInto('whitelisted_token')
        .values({
          token_address: tokenAddress,
          token_decimals: decimals,
          token_symbol: symbol,
          admittance_epoch: log.blockNumber.toString(),
          admittance_log_index: log.logIndex,
          admittance_tx_hash: log.transactionHash.toLowerCase(),
        })
        .executeTakeFirst();
    }
  }

  private async updatePricingParams(
    tx: TransactionContext,
    log: PricingParamsUpdatedLog,
  ) {
    const pairs: [
      paramType: ServiceRewardsActorParameterType,
      paramValue: string,
    ][] = [
      [
        ServiceRewardsActorParameterType.MIN_LOT_FLOOR,
        log.args.minLotFloor.toString(),
      ],
      [
        ServiceRewardsActorParameterType.MIN_LOT_ALPHA_NUMERATOR,
        log.args.minLotAlphaNum.toString(),
      ],
      [
        ServiceRewardsActorParameterType.MIN_LOT_ALPHA_DENOMINATOR,
        log.args.minLotAlphaDen.toString(),
      ],
      [
        ServiceRewardsActorParameterType.PRICE_BAND_BPS,
        log.args.priceBand.toString(),
      ],
      [
        ServiceRewardsActorParameterType.REGISTRATION_CUTOFF_EPOCHS,
        log.args.registrationCutoff.toString(),
      ],
    ];

    await tx
      .insertInto('service_rewards_actor_parameter')
      .values(
        pairs.map(([parameterType, parameterValue]) => {
          return {
            parameter_type: parameterType,
            parameter_value: parameterValue,
            update_epoch: log.blockNumber.toString(),
            update_log_index: log.logIndex,
            update_tx_hash: log.transactionHash.toLowerCase(),
          };
        }),
      )
      .execute();
  }

  private getQuarterForEpoch(epoch: bigint): bigint {
    const activationEpoch = this.configService.get('ACTIVATION_EPOCH', {
      infer: true,
    });

    if (epoch < activationEpoch) {
      return 0n;
    }

    const epochsPerQuarter = this.configService.get('EPOCHS_PER_QUARTER', {
      infer: true,
    });

    return (epoch - activationEpoch) / epochsPerQuarter + 1n;
  }
}

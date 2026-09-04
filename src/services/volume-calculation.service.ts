import { db } from '@/db/db';
import { ServiceOrchestratorQuarterlyVolumeParametersDto } from '@/dto/service-orchestrator-quarterly-volume-parameters.dto';
import { ServiceOrchestratorQuarterlyVolumeDto } from '@/dto/service-orchestrator-quarterly-volume.dto';
import { QuarterNumber } from '@/lib/quarter-number';
import { ConfigShape } from '@/lib/types';
import { divideBigInt } from '@/lib/utils';
import { QuartersService } from '@/services/quarters.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigNumber } from 'bignumber.js';
import { sql } from 'kysely';
import { zeroAddress } from 'viem';

@Injectable()
export class VolumeCalculationService {
  constructor(
    private readonly configService: ConfigService<ConfigShape, true>,
    private readonly quartersService: QuartersService,
  ) {}

  public async getServiceOrchestratorQuarterlyVolume({
    serviceOrchestrator,
    quarterNumber,
  }: ServiceOrchestratorQuarterlyVolumeParametersDto): Promise<ServiceOrchestratorQuarterlyVolumeDto> {
    const quarterNumberInt = QuarterNumber.from(quarterNumber).toNumber();
    const activationEpoch = this.configService.get('ACTIVATION_EPOCH', {
      infer: true,
    });
    const quarter = this.quartersService.getQuarterByIndex(quarterNumberInt);
    const quarterParameters =
      await this.quartersService.getQuarterParameters(quarterNumberInt);

    const stablecoinVolume = await db
      .selectFrom('filecoin_pay_payment as p')
      .innerJoin('filecoin_pay_rail as r', (join) => {
        return join
          .onRef('p.rail_id', '=', 'r.rail_id')
          .onRef(
            'p.filecoin_pay_contract_address',
            '=',
            'r.filecoin_pay_contract_address',
          );
      })
      .innerJoin('service_pair as sp', (join) => {
        return join
          .on('sp.service_orchestrator_id', '=', serviceOrchestrator)
          .onRef('r.payer', '=', 'sp.payer')
          .onRef('r.operator', '=', 'sp.operator')
          .onRef('p.settled_at_epoch', '>=', 'sp.from_epoch')
          .on((eb) =>
            eb.or([
              eb('sp.to_epoch', 'is', null),
              eb('p.settled_at_epoch', '<=', eb.ref('sp.to_epoch')),
            ]),
          );
      })
      .innerJoin('whitelisted_token as t', 'r.token', 't.token_address')
      .where(
        'p.filecoin_pay_contract_address',
        'in',
        quarterParameters.admittedFilecoinPayContractAddresses,
      )
      .where('r.token', 'in', quarterParameters.admittedStablecoins)
      .where('p.settled_at_epoch', '>=', quarter.startEpoch.toString())
      .where('p.settled_at_epoch', '<=', quarter.endEpoch.toString())
      .select((eb) => {
        const exponent = eb.fn<string>('POWER', [
          eb.cast(eb.val(10), 'numeric'),
          eb(eb.val(18), '-', eb.ref('t.token_decimals')),
        ]);
        const totalAmountAdjusted = eb('p.total_amount', '*', exponent);

        return [
          eb.fn
            .coalesce(eb.fn.sum(totalAmountAdjusted), eb.val(0))
            .as('volume_atto_usd'),
          eb.fn.coalesce(eb.fn.count('p.id'), eb.val(0)).as('payments_count'),
        ];
      })
      .executeTakeFirstOrThrow();

    const pricePeriodsWithVolumeCTE = db
      .selectFrom('qualified_price_periods_mv as qp')
      .leftJoinLateral(
        (eb) => {
          return eb
            .selectFrom('filecoin_pay_payment as p')
            .innerJoin('filecoin_pay_rail as r', (join) => {
              return join
                .onRef('p.rail_id', '=', 'r.rail_id')
                .onRef(
                  'p.filecoin_pay_contract_address',
                  '=',
                  'r.filecoin_pay_contract_address',
                );
            })
            .innerJoin('service_pair as sp', (join) => {
              return join
                .on('sp.service_orchestrator_id', '=', serviceOrchestrator)
                .onRef('r.payer', '=', 'sp.payer')
                .onRef('r.operator', '=', 'sp.operator')
                .onRef('p.settled_at_epoch', '>=', 'sp.from_epoch')
                .on((eb) =>
                  eb.or([
                    eb('sp.to_epoch', 'is', null),
                    eb('p.settled_at_epoch', '<=', eb.ref('sp.to_epoch')),
                  ]),
                );
            })
            .select('p.total_amount')
            .where(
              'p.filecoin_pay_contract_address',
              'in',
              quarterParameters.admittedFilecoinPayContractAddresses,
            )
            .where('r.token', '=', zeroAddress)
            .where('p.settled_at_epoch', '>=', activationEpoch.toString())
            .where((eb) => {
              return eb.or([
                eb('p.settled_at_epoch', '<', eb.ref('qp.epoch')),
                eb.and([
                  eb('p.settled_at_epoch', '=', eb.ref('qp.epoch')),
                  eb('p.log_index', '<', eb.ref('qp.log_index')),
                ]),
              ]);
            })
            .where((eb) => {
              return eb.not(
                eb.exists(
                  eb
                    .selectFrom('qualified_price_periods_mv as eqp')
                    .select('eqp.epoch')
                    .where((eb) => {
                      return eb.or([
                        eb('p.settled_at_epoch', '<', eb.ref('eqp.epoch')),
                        eb.and([
                          eb('p.settled_at_epoch', '=', eb.ref('eqp.epoch')),
                          eb('p.log_index', '<', eb.ref('eqp.log_index')),
                        ]),
                      ]);
                    })
                    .where((eb) => {
                      return eb.or([
                        eb('eqp.epoch', '<', eb.ref('qp.epoch')),
                        eb.and([
                          eb('eqp.epoch', '=', eb.ref('qp.epoch')),
                          eb('eqp.log_index', '<', eb.ref('qp.log_index')),
                        ]),
                      ]);
                    }),
                ),
              );
            })
            .as('matched_payments');
        },
        (join) => join.on(sql`true`),
      )
      .where('qp.quarter_num', '=', quarterNumberInt)
      .select((eb) => {
        const previousPeriodEpoch = sql<
          string | null
        >`LAG(epoch) OVER (ORDER BY epoch, log_index)`;
        const previousPeriodLogIndex = sql<
          string | null
        >`LAG(log_index) OVER (ORDER BY epoch, log_index)`;

        const volumeAttoFil = eb.fn.coalesce(
          eb.fn.sum('matched_payments.total_amount'),
          eb.val(0),
        );
        const numerator = eb(volumeAttoFil, '*', eb.ref('lot_atto_usd'));

        const volumeAttoUsd = eb.fn<string | bigint | number>('FLOOR', [
          eb(numerator, '/', eb.ref('claim_atto_fil')),
        ]);

        return [
          eb.fn
            .coalesce(previousPeriodEpoch, eb.val(activationEpoch))
            .as('start_epoch'),
          eb.fn
            .coalesce(eb(previousPeriodLogIndex, '+', '1'), eb.val(0))
            .as('start_log_index'),
          'epoch as end_epoch',
          'log_index as end_log_index',
          'qp.lot_atto_usd',
          'qp.claim_atto_fil',
          eb('lot_atto_usd', '/', eb.ref('claim_atto_fil')).as('implied_rate'),
          volumeAttoFil.as('volume_atto_fil'),
          volumeAttoUsd.as('volume_atto_usd'),
        ];
      })
      .groupBy([
        'qp.quarter_num',
        'qp.epoch',
        'qp.log_index',
        'qp.lot_atto_usd',
        'qp.claim_atto_fil',
      ])
      .orderBy('qp.epoch')
      .orderBy('qp.log_index');

    const pricingPeriodsResults = await pricePeriodsWithVolumeCTE.execute();

    const filVolume = await db
      .with('pp', pricePeriodsWithVolumeCTE)
      .selectFrom('pp')
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum('volume_atto_usd'), eb.val(0))
          .as('volume_atto_usd'),
      ])
      .executeTakeFirstOrThrow();

    const stablecoinVolumeAttoUsd = BigInt(stablecoinVolume.volume_atto_usd);
    const stablecoinVolumeUsd = divideBigInt(
      stablecoinVolumeAttoUsd,
      10n ** 18n,
      2,
    );
    const filVolumeAttoUsd = BigInt(filVolume.volume_atto_usd);
    const filVolumeUsd = divideBigInt(filVolumeAttoUsd, 10n ** 18n, 2);
    const volumeAttoUsd = stablecoinVolumeAttoUsd + filVolumeAttoUsd;
    const volumeUsd = divideBigInt(volumeAttoUsd, 10n ** 18n, 2);

    return {
      quarter,
      stablecoinVolumeAttoUsd,
      stablecoinVolumeUsd,
      filVolumeAttoUsd,
      filVolumeUsd,
      volumeAttoUsd,
      volumeUsd,
      pricingPeriods: pricingPeriodsResults.map((result) => {
        const lotAttoUsd = BigInt(result.lot_atto_usd);
        const lotUsd = divideBigInt(lotAttoUsd, 10n ** 18n, 2);
        const claimAttoFil = BigInt(result.claim_atto_fil);
        const claimFil = divideBigInt(claimAttoFil, 10n ** 18n, 2);
        const volumeAttoFil = BigInt(result.volume_atto_fil);
        const volumeFil = divideBigInt(volumeAttoFil, 10n ** 18n, 2);
        const volumeAttoUsd = BigInt(result.volume_atto_usd);
        const volumeUsd = divideBigInt(volumeAttoUsd, 10n ** 18n, 2);
        const impliedRate = BigNumber(result.implied_rate).toString();

        return {
          startEpoch: BigInt(result.start_epoch),
          startLogIndex: parseInt(result.start_log_index.toString(), 10),
          endEpoch: BigInt(result.end_epoch),
          endLogIndex: parseInt(result.end_log_index.toString(), 10),
          lotAttoUsd,
          lotUsd,
          claimAttoFil,
          claimFil,
          volumeAttoFil,
          volumeFil,
          volumeAttoUsd,
          volumeUsd,
          impliedRate,
        };
      }),
    };
  }
}

import { Expression, expressionBuilder } from 'kysely';
import { DB } from './types';

export interface QuarterNumberParameters {
  epoch: Expression<string | bigint | number | null>;
  activationEpoch: Expression<string | bigint | number>;
  epochsPerQuarter: Expression<string | bigint | number>;
}

export function epochToQuarterNumber({
  epoch,
  activationEpoch,
  epochsPerQuarter,
}: QuarterNumberParameters) {
  const eb = expressionBuilder<DB>();

  return eb.fn<string | bigint | number>('FLOOR', [
    eb(
      eb.cast(
        eb(
          eb.cast(eb(epoch, '-', activationEpoch), 'numeric'),
          '/',
          eb.val(epochsPerQuarter),
        ),
        'bigint',
      ),
      '+',
      '1',
    ),
  ]);
}

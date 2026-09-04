import { db } from '@/db/db';
import { DB } from '@/db/types';
import { ConfigShape } from '@/lib/types';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InsertObject } from 'kysely';

@Injectable()
export class ConfigSeedService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService<ConfigShape, true>,
  ) {}

  public async onApplicationBootstrap() {
    const values: InsertObject<DB, 'application_config'> = {
      activation_epoch: this.configService
        .get('ACTIVATION_EPOCH', { infer: true })
        .toString(),
      epochs_per_quarter: this.configService
        .get('EPOCHS_PER_QUARTER', { infer: true })
        .toString(),
    };

    await db
      .insertInto('application_config')
      .values(values)
      .onConflict((oc) => {
        return oc.column('id').doUpdateSet(values);
      })
      .executeTakeFirst();
  }
}

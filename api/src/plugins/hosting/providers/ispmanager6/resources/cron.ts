import type { CronApi, CronJob, NewCronJob } from '../../contracts.js';
import { field } from '../transport.js';
import { IspResource } from './base.js';

/** Планувальник (`scheduler`); розклад — режим expert (5 полів cron) */
export class IspCron extends IspResource implements CronApi {
  async list(owner?: string): Promise<CronJob[]> {
    return (await this.isp.list('scheduler', this.as(owner))).map((elem) => ({
      key: field(elem, 'key'),
      owner: owner ?? null,
      command: field(elem, 'command'),
      schedule: field(elem, 'interval'),
      description: field(elem, 'description') || null,
      active: field(elem, 'active') !== 'off',
    }));
  }

  async create(input: NewCronJob): Promise<void> {
    const [min = '*', hour = '*', dmonth = '*', month = '*', dweek = '*'] = input.schedule.trim().split(/\s+/);
    await this.isp.save('scheduler.edit', {
      ...this.as(input.owner),
      command: input.command,
      description: input.description ?? '',
      schedule_type: 'type_expert',
      input_min: min,
      input_hour: hour,
      input_dmonth: dmonth,
      input_month: month,
      input_dweek: dweek,
      active: 'on',
    });
  }

  async remove(key: string, owner?: string): Promise<void> {
    await this.delete('scheduler', key, owner);
  }
}

/** SSL-сертифікати: строк дії (попередження за 14 днів), Let's Encrypt, домени; сегменти за станом */
import { ui } from '../../../../flowaxy/ui/index.js';
import { hosting } from '../../module.js';
import { daysLeft } from '../format.js';
import { badge, panel } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

type CertState = 'valid' | 'expiring' | 'expired';

export const sslSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const certificates = await hosting.resources.list(scope.account, 'ssl');
  const stateOf = (validUntil: string | null): CertState => {
    const days = daysLeft(validUntil);
    return days === null ? 'valid' : days < 0 ? 'expired' : days <= 14 ? 'expiring' : 'valid';
  };
  const filter = ['valid', 'expiring', 'expired'].includes(scope.ctx.state.cert ?? '') ? scope.ctx.state.cert as CertState : '';
  const visible = filter ? certificates.filter((cert) => stateOf(cert.validUntil) === filter) : certificates;
  const count = (state: CertState) => certificates.filter((cert) => stateOf(cert.validUntil) === state).length;

  const grid = await scope.grid(visible, {
    defaultSort: 'valid',
    sort: { name: (cert) => cert.name, valid: (cert) => cert.validUntil },
    text: (cert) => `${cert.name} ${cert.domains.join(' ')}`,
    segments: {
      name: 'cert',
      value: filter,
      items: [
        { label: t('statusAll'), value: '', count: certificates.length },
        { label: t('cert.valid'), value: 'valid', count: count('valid') },
        { label: t('cert.expiring'), value: 'expiring', count: count('expiring') },
        { label: t('cert.expired'), value: 'expired', count: count('expired') },
      ],
    },
    columns: [
      { key: 'name', label: t('certificate') },
      { key: 'domains', label: t('domains') },
      { key: 'valid', label: t('validUntil') },
      { key: 'type', label: t('type') },
    ],
    row: (cert) => {
      const days = daysLeft(cert.validUntil);
      const state = stateOf(cert.validUntil);
      return {
        key: cert.key,
        tone: !cert.active ? 'muted' : state === 'expired' ? 'danger' : state === 'expiring' ? 'warn' : undefined,
        cells: {
          name: [ui.text({ b: cert.name })],
          domains: [ui.muted(cert.domains.join(', ') || '—')],
          valid: cert.validUntil
            ? [ui.text(ui.date(cert.validUntil)), badge(days !== null && days < 0 ? t('expired') : t('daysLeft', { days: days ?? 0 }), state === 'expired' ? 'red' : state === 'expiring' ? 'orange' : 'green')]
            : [ui.muted('—')],
          type: [badge(cert.letsencrypt ? "Let's Encrypt" : t('customCert'), cert.letsencrypt ? 'green' : 'slate')],
        },
      };
    },
    empty: t('empty'),
  });
  return [panel(`${t('tab.ssl')} · ${certificates.length}`, [grid], { flush: true, subtitle: t('sslHint') })];
};

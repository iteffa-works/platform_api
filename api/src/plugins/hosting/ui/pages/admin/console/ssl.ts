/** SSL-сертифікати: строк дії (попередження за 14 днів), Let's Encrypt, домени */
import { ui } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { daysLeft } from '../../../format.js';
import { badge, ownerFilter, panel, table } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const sslSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [certificates, owners] = await Promise.all([hosting.panel.certificates(console.server.id, console.owner), console.owners()]);

  return [
    ownerFilter(console.ctx, owners, console.owner),
    panel(`${t('tab.ssl')} · ${certificates.length}`, [table(
      [
        { key: 'name', label: t('certificate') },
        { key: 'owner', label: t('owner') },
        { key: 'domains', label: t('domains') },
        { key: 'valid', label: t('validUntil') },
        { key: 'type', label: t('type') },
      ],
      certificates.map((cert) => {
        const days = daysLeft(cert.validUntil);
        const tone = days === null ? 'slate' : days < 0 ? 'red' : days <= 14 ? 'orange' : 'green';
        return {
          key: cert.key,
          muted: !cert.active,
          cells: {
            name: [ui.text({ b: cert.name })],
            owner: [ui.text(cert.owner, { size: 'sm' })],
            domains: [ui.muted(cert.domains.join(', ') || '—')],
            valid: cert.validUntil
              ? [ui.text(ui.date(cert.validUntil)), badge(days !== null && days < 0 ? t('expired') : t('daysLeft', { days: days ?? 0 }), tone)]
              : [ui.muted('—')],
            type: [badge(cert.letsencrypt ? "Let's Encrypt" : t('customCert'), cert.letsencrypt ? 'green' : 'slate')],
          },
        };
      }),
      t('empty'),
      t('search'),
    )], { flush: true, subtitle: t('sslHint') }),
  ];
};

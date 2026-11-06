<script lang="ts">
  /** Ліва колонка login — template promo (infra) */
  let {
    title = 'платформа для сервісів і зростання',
    titleAccent = 'Brand',
    lead = 'Єдиний кабінет: compute, web apps, DNS, messaging, growth і observability.',
  }: {
    title?: string;
    titleAccent?: string;
    lead?: string;
  } = $props();

  const features = [
    { title: 'API Gateway', text: 'Маршрути, ключі, вебхуки', tone: '#7a8aa3', icon: 'api' },
    { title: 'Compute', text: 'Інстанси, CPU, мережа', tone: '#6f849e', icon: 'servers' },
    { title: 'Web Apps', text: 'Деплой, SSL, середовища', tone: '#758ca3', icon: 'hosting' },
    { title: 'DNS', text: 'Зони, записи, делегування', tone: '#8093a8', icon: 'domains' },
    { title: 'Analytics', text: 'Метрики, звіти, дашборди', tone: '#6e8f7c', icon: 'analytics' },
    { title: 'Growth', text: 'UTM, воронки, кампанії', tone: '#9a8668', icon: 'marketing' },
    { title: 'Messaging', text: 'Чати, боти, канали', tone: '#7f7896', icon: 'bots' },
    { title: 'Workflows', text: 'Сценарії, черги, задачі', tone: '#8f8260', icon: 'tools' },
    { title: 'Observability', text: 'Алерти, uptime, логи', tone: '#957575', icon: 'monitor' },
    { title: 'Connectors', text: 'Зовнішні API та сервіси', tone: '#7d7694', icon: 'integrations' },
    { title: 'Identity', text: 'Ролі, політики, аудит', tone: '#6a8f88', icon: 'security' },
    { title: 'Object Storage', text: 'Файли, бекапи, архіви', tone: '#6f84a0', icon: 'storage' },
    { title: 'Edge CDN', text: 'Кеш, роздача, PoP', tone: '#6f89a6', icon: 'cdn' },
    { title: 'Mail Delivery', text: 'Транзакції та розсилки', tone: '#6f9078', icon: 'email' },
    { title: 'Helpdesk', text: 'Тікети, чат, база знань', tone: '#9a8160', icon: 'support' },
    { title: 'Databases', text: 'Кластери, репліки, бекапи', tone: '#6a8e88', icon: 'database' },
    { title: 'Secrets', text: 'Ключі, токени, ротація', tone: '#857994', icon: 'secrets' },
    { title: 'Pipelines', text: 'CI/CD, релізи, артефакти', tone: '#7389a3', icon: 'pipelines' },
  ] as const;

  /** Секретний копірайт у бінарному UTF-8 */
  const secretCopyright = 'Довгопол Микола Іванович';
  const codePattern = [...new TextEncoder().encode(secretCopyright)]
    .map((byte) => byte.toString(2).padStart(8, '0'))
    .join('');
  const codeLines = Array.from({ length: 36 }, (_, i) => {
    const shift = (i * 11) % codePattern.length;
    const line = codePattern.slice(shift) + codePattern.slice(0, shift);
    return (line + line + line + line).slice(0, 96);
  });
</script>

<aside class="promo">
  <div class="promo__code" aria-hidden="true">
    {#each codeLines as line}
      <span>{line}</span>
    {/each}
  </div>

  <div class="promo__intro">
    <h1 class="promo__title">
      <span class="promo__accent">{titleAccent}</span>
      {title}
    </h1>
    <p class="promo__lead">{lead}</p>
  </div>

  <div class="promo__grid">
    {#each features as item (item.title)}
      <article class="promo__card" style={`--tone:${item.tone}`}>
        <div class="promo__head">
          <span class="promo__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            {#if item.icon === 'api'}
              <path d="M8 8 4 12l4 4"/>
              <path d="m16 8 4 4-4 4"/>
              <path d="m14 7-4 10"/>
            {:else if item.icon === 'servers'}
              <rect x="4" y="4" width="16" height="5" rx="1.2"/>
              <rect x="4" y="10.5" width="16" height="5" rx="1.2"/>
              <rect x="4" y="17" width="16" height="3" rx="1"/>
              <circle cx="7.2" cy="6.5" r="0.7" fill="currentColor" stroke="none"/>
              <circle cx="7.2" cy="13" r="0.7" fill="currentColor" stroke="none"/>
            {:else if item.icon === 'hosting'}
              <rect x="5" y="4" width="14" height="11" rx="1.5"/>
              <path d="M8 19h8"/>
              <path d="M12 15v4"/>
              <path d="M9 8h6M9 11h4"/>
            {:else if item.icon === 'domains'}
              <circle cx="12" cy="12" r="8"/>
              <path d="M4.5 12h15"/>
              <path d="M12 4a14 14 0 0 1 0 16"/>
              <path d="M12 4a14 14 0 0 0 0 16"/>
            {:else if item.icon === 'analytics'}
              <path d="M4 19h16"/>
              <path d="M7 16V11"/>
              <path d="M12 16V7"/>
              <path d="M17 16v-4"/>
            {:else if item.icon === 'marketing'}
              <path d="M4 10v4a2 2 0 0 0 2 2h2l5 3V5L8 8H6a2 2 0 0 0-2 2Z"/>
              <path d="M16 9.5a3 3 0 0 1 0 5"/>
              <path d="M18.2 7.5a5.5 5.5 0 0 1 0 9"/>
            {:else if item.icon === 'bots'}
              <rect x="6" y="7" width="12" height="11" rx="3"/>
              <path d="M12 4v3"/>
              <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none"/>
              <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none"/>
              <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none"/>
              <path d="M10 15h4"/>
            {:else if item.icon === 'tools'}
              <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5Z"/>
            {:else if item.icon === 'monitor'}
              <path d="M3 12h3l2.2-5 3.3 10 2.5-5H21"/>
            {:else if item.icon === 'integrations'}
              <circle cx="8" cy="8" r="2.2"/>
              <circle cx="16" cy="8" r="2.2"/>
              <circle cx="8" cy="16" r="2.2"/>
              <circle cx="16" cy="16" r="2.2"/>
              <path d="M10.1 8h3.8M8 10.1v3.8M16 10.1v3.8M10.1 16h3.8"/>
            {:else if item.icon === 'security'}
              <path d="M12 3.5 5.5 6.2v4.8c0 4 2.7 6.9 6.5 8.1 3.8-1.2 6.5-4.1 6.5-8.1V6.2L12 3.5Z"/>
              <path d="m9.2 12 1.8 1.8 3.8-3.8"/>
            {:else if item.icon === 'storage'}
              <ellipse cx="12" cy="6.5" rx="7" ry="2.4"/>
              <path d="M5 6.5v4c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4v-4"/>
              <path d="M5 10.5v4c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4v-4"/>
              <path d="M5 14.5v3c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4v-3"/>
            {:else if item.icon === 'cdn'}
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
              <path d="m5.6 5.6 2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1"/>
            {:else if item.icon === 'email'}
              <rect x="4" y="6" width="16" height="12" rx="2"/>
              <path d="m4 8 8 5 8-5"/>
            {:else if item.icon === 'database'}
              <ellipse cx="12" cy="5.5" rx="7" ry="2.2"/>
              <path d="M5 5.5v4.2c0 1.2 3.1 2.2 7 2.2s7-1 7-2.2V5.5"/>
              <path d="M5 9.7v4.2c0 1.2 3.1 2.2 7 2.2s7-1 7-2.2V9.7"/>
              <path d="M5 13.9v4.1c0 1.2 3.1 2.2 7 2.2s7-1 7-2.2v-4.1"/>
            {:else if item.icon === 'secrets'}
              <rect x="7" y="11" width="10" height="8" rx="1.5"/>
              <path d="M9 11V8.5a3 3 0 0 1 6 0V11"/>
              <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/>
            {:else if item.icon === 'pipelines'}
              <circle cx="6" cy="6" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="18" cy="18" r="2"/>
              <path d="M7.6 7.6 10.4 10.4"/>
              <path d="M13.6 13.6 16.4 16.4"/>
              <path d="M18 6H9.5A3.5 3.5 0 0 0 6 9.5V12"/>
              <path d="M6 18h8.5A3.5 3.5 0 0 0 18 14.5V12"/>
            {:else}
              <circle cx="12" cy="12" r="7.5"/>
              <path d="M9.5 12h5"/>
              <path d="M12 9.5v5"/>
              <path d="M8 17.5c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5"/>
            {/if}
          </svg>
          </span>
          <h2 class="promo__card-title">{item.title}</h2>
        </div>
        <p class="promo__card-text">{item.text}</p>
      </article>
    {/each}
  </div>
</aside>

<style>
  .promo {
    position: relative;
    isolation: isolate;
    display: grid;
    gap: 18px;
    align-content: start;
    min-height: 100%;
    padding: 32px 32px 28px;
    color: #d7dce5;
    background: #0c1017;
    overflow: hidden;
  }

  .promo__code {
    position: absolute;
    left: -20%;
    top: -24%;
    width: 150%;
    height: 150%;
    z-index: 0;
    display: grid;
    align-content: center;
    gap: 11px;
    pointer-events: none;
    user-select: none;
    font-family: ui-monospace, Cascadia Code, Consolas, monospace;
    font-size: 10.5px;
    font-weight: 450;
    line-height: 1.4;
    letter-spacing: 0.32em;
    color: #5c6f86;
    opacity: 0.18;
    transform: rotate(-10deg);
    transform-origin: center center;
    -webkit-mask-image:
      radial-gradient(ellipse 78% 70% at 48% 48%, #000 10%, transparent 78%);
    mask-image:
      radial-gradient(ellipse 78% 70% at 48% 48%, #000 10%, transparent 78%);
  }

  .promo__code span {
    white-space: nowrap;
  }

  .promo__code span:nth-child(odd) {
    color: #516278;
    transform: translateX(14px);
  }

  .promo__code span:nth-child(even) {
    color: #6a7e96;
    transform: translateX(-8px);
  }

  .promo__code span:nth-child(3n) {
    opacity: 0.85;
  }

  .promo__code span:nth-child(4n) {
    letter-spacing: 0.4em;
    opacity: 0.65;
  }

  .promo__code span:nth-child(5n) {
    transform: translateX(22px);
    color: #7388a0;
    opacity: 0.8;
  }

  .promo__intro,
  .promo__grid {
    position: relative;
    z-index: 1;
  }

  .promo__intro { display: grid; gap: 6px; min-height: 3.35rem; }

  .promo__title {
    margin: 0;
    font-size: clamp(1.28rem, 1.9vw, 1.58rem);
    font-weight: 650;
    line-height: 1.28;
    letter-spacing: -0.025em;
    color: #f3f5f8;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
  }

  .promo__accent {
    color: #9aabbf;
    font-weight: 700;
  }

  .promo__lead {
    margin: 0;
    color: #8790a0;
    font-size: 12.5px;
    line-height: 1.45;
    white-space: nowrap;
  }

  .promo__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .promo__card {
    position: relative;
    display: grid;
    gap: 8px;
    height: 100%;
    padding: 11px 12px 11px 13px;
    border: 1px solid #1c2230;
    border-radius: 4px;
    background: #0a0e15;
    overflow: hidden;
  }

  .promo__card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--tone);
    opacity: 0.55;
  }

  .promo__card:hover {
    border-color: #2a3344;
    background: #0d121a;
  }

  .promo__card:hover::before { opacity: 0.85; }

  .promo__card:hover .promo__icon {
    border-color: #2a3344;
    background: #121822;
    color: #b7c3d4;
  }

  .promo__head {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }

  .promo__icon {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    border-radius: 3px;
    border: 1px solid #242b38;
    background: #10151e;
    color: var(--tone);
  }

  .promo__icon svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  .promo__card-title {
    margin: 0;
    font-size: 12.5px;
    font-weight: 650;
    color: #f1f3f7;
    line-height: 1.2;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .promo__card-text {
    margin: 0;
    padding-left: 1px;
    font-size: 11px;
    line-height: 1.4;
    color: #7a8496;
  }

  @media (max-width: 960px) {
    .promo {
      padding: 24px 18px 16px;
      gap: 18px;
      align-content: start;
    }
    .promo__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>

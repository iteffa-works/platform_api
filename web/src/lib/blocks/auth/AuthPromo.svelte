<script lang="ts">
  /** Ліва колонка login — template promo (infra) */
  let {
    title = 'платформа для сервісів і зростання',
    titleAccent = 'Brand',
    lead = 'Єдиний кабінет: compute, web apps, DNS, messaging, growth і observability. Демо: flowaxy.com',
  }: {
    title?: string;
    titleAccent?: string;
    lead?: string;
  } = $props();

  const features = [
    { title: 'API Gateway', text: 'Маршрути, ключі, вебхуки', tone: '#7b93c9', icon: 'api' },
    { title: 'Compute', text: 'Інстанси, CPU, мережа', tone: '#6ea8d9', icon: 'servers' },
    { title: 'Web Apps', text: 'Деплой, SSL, середовища', tone: '#6bc4c4', icon: 'hosting' },
    { title: 'DNS', text: 'Зони, записи, делегування', tone: '#8fa3c7', icon: 'domains' },
    { title: 'Analytics', text: 'Метрики, звіти, дашборди', tone: '#7dba8f', icon: 'analytics' },
    { title: 'Growth', text: 'UTM, воронки, кампанії', tone: '#d4a06a', icon: 'marketing' },
    { title: 'Messaging', text: 'Чати, боти, канали', tone: '#9b86d4', icon: 'bots' },
    { title: 'Workflows', text: 'Сценарії, черги, задачі', tone: '#c4a35a', icon: 'tools' },
    { title: 'Observability', text: 'Алерти, uptime, логи', tone: '#d07a7a', icon: 'monitor' },
    { title: 'Connectors', text: 'Зовнішні API та сервіси', tone: '#a78bfa', icon: 'integrations' },
    { title: 'Identity', text: 'Ролі, політики, аудит', tone: '#5fbfb0', icon: 'security' },
    { title: 'Object Storage', text: 'Файли, бекапи, архіви', tone: '#6a9fd4', icon: 'storage' },
    { title: 'Edge CDN', text: 'Кеш, роздача, PoP', tone: '#64b5f6', icon: 'cdn' },
    { title: 'Mail Delivery', text: 'Транзакції та розсилки', tone: '#81c784', icon: 'email' },
    { title: 'Helpdesk', text: 'Тікети, чат, база знань', tone: '#ffb74d', icon: 'support' },
  ] as const;
</script>

<aside class="promo">
  <div class="promo__intro">
    <h1 class="promo__title">
      <span class="promo__accent">{titleAccent}</span>
      {title}
      <span class="promo__badge">статус</span>
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
    display: grid;
    gap: 24px;
    align-content: center;
    min-height: 100%;
    padding: 36px 32px;
    color: #d7dce5;
    background: #0c1017;
  }

  .promo__intro { display: grid; gap: 10px; }

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
    color: #8fa3c7;
    font-weight: 700;
  }

  .promo__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid #2a4a36;
    background: #101a14;
    color: #74b088;
    font-size: 10px;
    font-weight: 650;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .promo__badge::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #3f9b5f;
  }

  .promo__lead {
    margin: 0;
    max-width: 48ch;
    color: #8790a0;
    font-size: 13px;
    line-height: 1.5;
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
    padding: 12px 12px 12px 14px;
    border: 1px solid #1e2430;
    border-radius: 8px;
    background: #090c12;
    overflow: hidden;
  }

  .promo__card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 2px;
    border-radius: 2px;
    background: var(--tone);
    opacity: 0.7;
  }

  .promo__card:hover {
    border-color: #2c3444;
    background: #0e131b;
  }

  .promo__card:hover::before { opacity: 1; }

  .promo__card:hover .promo__icon {
    border-color: color-mix(in srgb, var(--tone) 42%, #2a3140);
    background: color-mix(in srgb, var(--tone) 16%, #171d28);
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
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border-radius: 7px;
    border: 1px solid color-mix(in srgb, var(--tone) 26%, #2a3140);
    background: color-mix(in srgb, var(--tone) 11%, #171d28);
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

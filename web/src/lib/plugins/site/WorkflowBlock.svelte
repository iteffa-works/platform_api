<script lang="ts">
  /** Як це працює: три кроки + приклад виклику Client API */
  import { APP_ORIGIN } from '$lib/config';
  import { SectionHeading } from '$lib/ui/components';

  const steps = [
    { title: 'Створіть акаунт', text: 'Реєстрація за email — перший користувач отримує роль адміністратора.' },
    { title: 'Підключіть сервіси', text: 'Увімкніть потрібні модулі в кабінеті та запросіть команду.' },
    { title: 'Автоматизуйте', text: 'Скрипти, desktop-клієнт і SDK працюють через Client API з ключем.' },
  ] as const;

  const contours = [
    { path: '/api/v1', text: 'Platform API — вебкабінет, JWT' },
    { path: '/api/client/v1', text: 'Client API — скрипти й desktop, ключ + rate limit' },
  ] as const;
</script>

<section class="flow" id="how">
  <div class="ui-container flow__grid">
    <div class="flow__steps">
      <SectionHeading eyebrow="Як це працює" title="Від реєстрації до автоматизації" align="start" />
      <ol>
        {#each steps as step, index (step.title)}
          <li>
            <span class="flow__num">{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </li>
        {/each}
      </ol>
    </div>

    <div class="flow__api" id="api">
      <div class="code">
        <div class="code__head">Client API · отримати задачу</div>
        <pre><code><span class="c">$</span> curl {APP_ORIGIN}/api/client/v1/work/next \
    -H <span class="s">"Authorization: Bearer $CLIENT_API_KEY"</span>

<span class="c">{'{'} "work": {'{'} "id": "…", "type": "…", "payload": {'{}'} {'}'} {'}'}</span></code></pre>
      </div>
      <ul class="flow__contours">
        {#each contours as contour (contour.path)}
          <li><code>{contour.path}</code><span>{contour.text}</span></li>
        {/each}
      </ul>
    </div>
  </div>
</section>

<style>
  .flow {
    padding: 88px 0;
    background: var(--ui-surface-muted);
    border-block: 1px solid var(--ui-border);
  }

  .flow__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 56px;
    align-items: center;
  }

  .flow__steps {
    display: grid;
    gap: 32px;
  }

  .flow ol {
    display: grid;
    gap: 22px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .flow li {
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: 14px;
  }

  .flow__num {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--ui-accent);
    color: #fff;
    font-weight: 700;
  }

  .flow h3 {
    margin: 4px 0 4px;
    font-size: 17px;
  }

  .flow li p {
    margin: 0;
    color: var(--ui-muted);
  }

  .flow__api {
    display: grid;
    gap: 16px;
    min-width: 0;
  }

  .code {
    border: 1px solid var(--cab-border);
    border-radius: 10px;
    background: var(--cab-bg);
    overflow: hidden;
  }

  .code__head {
    padding: 10px 16px;
    border-bottom: 1px solid var(--cab-border);
    color: var(--cab-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .code pre {
    margin: 0;
    padding: 18px 16px;
    overflow-x: auto;
    color: var(--cab-text);
    font: 13px/1.6 ui-monospace, 'Cascadia Code', Consolas, monospace;
  }

  .code .c {
    color: var(--cab-muted);
  }

  .code .s {
    color: #86efac;
  }

  .flow__contours {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .flow__contours li {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    align-items: baseline;
    color: var(--ui-muted);
    font-size: 14px;
  }

  .flow__contours code {
    color: var(--ui-text);
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .flow {
      padding: 64px 0;
    }

    .flow__grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }
  }
</style>

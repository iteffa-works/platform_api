<script lang="ts">
  /** Макет кабінету FlowAxy: dashboard / websites / audits */
  const stats = [
    { id: 'audits', label: 'Audits', value: '10', note: 'Unlimited · this month', tone: 'purple' },
    { id: 'sites', label: 'Websites', value: '6', note: 'Unlimited', tone: 'blue' },
  ] as const;

  const websites = [
    { name: 'roselira.com', audits: 10, score: 86, issues: 11, issueTone: 'danger' },
    { name: 'ukrtp.org', audits: 7, score: 91, issues: 7, issueTone: 'warn' },
    { name: 'rozetka.com.ua', audits: 6, score: 78, issues: 9, issueTone: 'danger' },
    { name: 'new.spokinoki.store', audits: 4, score: 88, issues: 5, issueTone: 'warn' },
    { name: 'spokinoki.store', audits: 3, score: 72, issues: 12, issueTone: 'danger' },
  ] as const;

  const audits = [
    { name: 'roselira.com', score: 86, issues: 11, issueTone: 'danger' },
    { name: 'ukrtp.org', score: 91, issues: 7, issueTone: 'warn' },
    { name: 'rozetka.com.ua', score: 78, issues: 9, issueTone: 'danger' },
    { name: 'new.spokinoki.store', score: 88, issues: 5, issueTone: 'warn' },
    { name: 'spokinoki.store', score: 72, issues: 12, issueTone: 'danger' },
  ] as const;

  let url = $state('https://example.com/');

  function dots(score: number): boolean[] {
    const filled = Math.round(score / 10);
    return Array.from({ length: 10 }, (_, i) => i < filled);
  }

  function scoreTone(score: number): 'good' | 'mid' {
    return score >= 80 ? 'good' : 'mid';
  }
</script>

<section class="dash">
  <div class="dash__audit">
    <input class="dash__url" type="url" bind:value={url} placeholder="https://example.com/" />
    <button class="dash__icon-btn" type="button" title="Settings" aria-label="Settings">⚙</button>
    <button class="dash__start" type="button">⚡ Start audit</button>
  </div>

  <div class="dash__stats">
    {#each stats as item (item.id)}
      <article class="dash__stat" data-tone={item.tone}>
        <div class="dash__stat-left">
          <span class="dash__stat-ico" aria-hidden="true">{item.tone === 'purple' ? '⚡' : '🖥'}</span>
          <div>
            <p class="dash__stat-label">{item.label}</p>
            <p class="dash__stat-note">{item.note}</p>
          </div>
        </div>
        <p class="dash__stat-value">{item.value}</p>
      </article>
    {/each}
  </div>

  <section class="dash__panel">
    <header class="dash__panel-head">
      <h2 class="dash__panel-title">Latest websites</h2>
    </header>
    <div class="dash__table-wrap">
      <table class="dash__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Audits</th>
            <th>Score</th>
            <th>Issues</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each websites as row (row.name)}
            <tr>
              <td>
                <a class="dash__link" href={`https://${row.name}`} target="_blank" rel="noreferrer">
                  {row.name}
                  <span class="dash__ext" aria-hidden="true">↗</span>
                </a>
              </td>
              <td>
                <span class="dash__chip">{row.audits}</span>
              </td>
              <td>
                <div class="dash__score" data-tone={scoreTone(row.score)}>
                  <span>{row.score}%</span>
                  <span class="dash__dots" aria-hidden="true">
                    {#each dots(row.score) as on}
                      <i class:is-on={on}></i>
                    {/each}
                  </span>
                </div>
              </td>
              <td>
                <span class="dash__badge" data-tone={row.issueTone}>{row.issues} issues</span>
              </td>
              <td class="dash__actions">
                <button type="button" title="History">◷</button>
                <button type="button" title="Refresh">↻</button>
                <button type="button" title="More">⋯</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="dash__panel">
    <header class="dash__panel-head">
      <h2 class="dash__panel-title">Latest audits</h2>
    </header>
    <div class="dash__table-wrap">
      <table class="dash__table">
        <thead>
          <tr>
            <th>Audit</th>
            <th>Score</th>
            <th>Issues</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each audits as row (row.name)}
            <tr>
              <td>
                <a class="dash__link" href={`https://${row.name}`} target="_blank" rel="noreferrer">{row.name}</a>
              </td>
              <td>
                <div class="dash__score" data-tone={scoreTone(row.score)}>
                  <span>{row.score}%</span>
                  <span class="dash__dots" aria-hidden="true">
                    {#each dots(row.score) as on}
                      <i class:is-on={on}></i>
                    {/each}
                  </span>
                </div>
              </td>
              <td>
                <span class="dash__badge" data-tone={row.issueTone}>{row.issues} issues</span>
              </td>
              <td class="dash__actions">
                <button type="button" title="Delete">🗑</button>
                <button type="button" title="Report">☰</button>
                <button type="button" title="Refresh">↻</button>
                <button type="button" title="View">👁</button>
                <button type="button" title="More">⋯</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</section>

<style>
  .dash {
    display: grid;
    gap: 18px;
  }

  .dash__audit {
    display: grid;
    grid-template-columns: 1fr 42px auto;
    gap: 8px;
    align-items: center;
  }

  .dash__url {
    height: var(--cab-control-h);
    padding: 0 14px;
    border: 1px solid var(--cab-border);
    border-radius: var(--cab-radius);
    background: var(--cab-surface);
    color: var(--cab-text);
    font: inherit;
  }
  .dash__url:focus {
    outline: none;
    border-color: var(--cab-accent-2);
  }

  .dash__icon-btn {
    height: var(--cab-control-h);
    width: 42px;
    border: 1px solid var(--cab-border);
    border-radius: var(--cab-radius);
    background: var(--cab-surface-2);
    color: var(--cab-muted);
    cursor: pointer;
  }

  .dash__start {
    height: var(--cab-control-h);
    padding: 0 16px;
    border: 0;
    border-radius: var(--cab-radius);
    background: var(--cab-success);
    color: #04140a;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }
  .dash__start:hover { filter: brightness(1.05); }

  .dash__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .dash__stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    border: 1px solid var(--cab-border);
    border-radius: var(--cab-radius);
    background: var(--cab-surface);
  }

  .dash__stat-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dash__stat-ico {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    font-size: 16px;
  }
  .dash__stat[data-tone='purple'] .dash__stat-ico {
    background: rgba(99, 102, 241, 0.16);
    color: #a5b4fc;
  }
  .dash__stat[data-tone='blue'] .dash__stat-ico {
    background: rgba(59, 130, 246, 0.16);
    color: #93c5fd;
  }

  .dash__stat-label {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--cab-muted);
  }
  .dash__stat-note {
    margin: 4px 0 0;
    font-size: 12px;
    color: #6b7382;
  }
  .dash__stat-value {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--cab-text);
  }

  .dash__panel {
    border: 1px solid var(--cab-border);
    border-radius: var(--cab-radius);
    background: var(--cab-surface);
    overflow: hidden;
  }

  .dash__panel-head {
    padding: 14px 16px 8px;
  }
  .dash__panel-title {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--cab-muted);
  }

  .dash__table-wrap { overflow-x: auto; }

  .dash__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .dash__table th {
    padding: 8px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #6b7382;
    border-bottom: 1px solid var(--cab-border);
  }
  .dash__table td {
    padding: 12px 16px;
    border-bottom: 1px solid #222836;
    vertical-align: middle;
  }
  .dash__table tr:last-child td { border-bottom: 0; }

  .dash__link {
    color: var(--cab-link);
    text-decoration: none;
    font-weight: 600;
  }
  .dash__link:hover { text-decoration: underline; }
  .dash__ext {
    margin-left: 4px;
    font-size: 11px;
    opacity: 0.7;
  }

  .dash__chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    background: rgba(99, 102, 241, 0.18);
    color: #c7d2fe;
    font-size: 12px;
    font-weight: 700;
  }

  .dash__score {
    display: grid;
    gap: 4px;
    font-weight: 650;
  }
  .dash__score[data-tone='good'] { color: #86efac; }
  .dash__score[data-tone='mid'] { color: #fcd34d; }

  .dash__dots {
    display: flex;
    gap: 3px;
  }
  .dash__dots i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #2a3140;
    display: block;
  }
  .dash__score[data-tone='good'] .dash__dots i.is-on { background: #22c55e; }
  .dash__score[data-tone='mid'] .dash__dots i.is-on { background: #f59e0b; }

  .dash__badge {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }
  .dash__badge[data-tone='danger'] {
    background: rgba(239, 68, 68, 0.16);
    color: #fca5a5;
  }
  .dash__badge[data-tone='warn'] {
    background: rgba(245, 158, 11, 0.16);
    color: #fcd34d;
  }

  .dash__actions {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
  }
  .dash__actions button {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #7a8496;
    cursor: pointer;
  }
  .dash__actions button:hover {
    background: #1c2230;
    color: #d7dce5;
  }

  @media (max-width: 860px) {
    .dash__audit { grid-template-columns: 1fr 42px; }
    .dash__start { grid-column: 1 / -1; }
    .dash__stats { grid-template-columns: 1fr; }
  }
</style>

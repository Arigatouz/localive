<script>
  import { createParaglideAdapter } from '@localive/adapter-paraglide';
  import { LocaliveEditor } from '@localive/svelte';
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, locales, setLocale } from '#lib/paraglide/runtime.js';

  let { children } = $props();
</script>

<svelte:head><title>{m.app_title()}</title></svelte:head>

<header>
  <nav>
    <a id="nav-home" href="/">{m['nav.home']()}</a>
    <a id="nav-loads" href="/loads">{m['nav.loads']()}</a>
    <a id="nav-form" href="/form">{m['nav.form']()}</a>
  </nav>
  <label>
    {m['nav.language']()}
    <select id="language" value={getLocale()} onchange={(event) => setLocale(event.currentTarget.value)}>
      {#each locales as locale (locale)}
        <option value={locale}>{locale}</option>
      {/each}
    </select>
  </label>
</header>

<main>
  {@render children()}
</main>

{#if import.meta.env.DEV}
  <LocaliveEditor createAdapter={() => createParaglideAdapter({ getLocale })} locales={[...locales]} />
{/if}

<style>
  :global(body) {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px;
    font-family: system-ui, sans-serif;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  nav {
    display: flex;
    gap: 16px;
  }
</style>

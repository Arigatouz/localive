<script>
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';

  let { form } = $props();
</script>

<form method="post" use:enhance>
  <label>
    {m.form_label()}
    <input id="product" name="product" value={m.card_title()} />
  </label>
  <button id="submit">{m.form_submit()}</button>
</form>

{#if form}
  <p id="received">{m.form_received({ value: form.received })}</p>
  <pre id="received-raw">{JSON.stringify(form.received)}</pre>
{/if}

<script>
  import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
  import { m } from '#lib/paraglide/messages.js';
  import ProductCard from '#lib/ProductCard.svelte';

  let name = $state('Ada');
  let count = $state(1);
  const greeting = $derived(m.greeting({ name }));
</script>

<h1 id="title">{m.app_title()}</h1>
<p id="intro">{m.intro()}</p>

<section>
  <p id="greeting">{greeting}</p>
  <button id="rename" onclick={() => (name = name === 'Ada' ? 'Grace' : 'Ada')}>{m.rename()}</button>
</section>

<section>
  <p id="cart">{m.cart_count({ count })}</p>
  <button id="add" onclick={() => count++}>+1</button>
</section>

<p id="terms">
  <ParaglideMessage message={m.terms} inputs={{}}>
    {#snippet link({ children })}<a href="/form">{@render children?.()}</a>{/snippet}
  </ParaglideMessage>
</p>

<input id="search" placeholder={m.search_placeholder()} aria-label={m.search_placeholder()} />

<ProductCard title={m.card_title()} action={m.same_text_b()} />

<p id="same-text">{m.same_text_a()}</p>
<p id="missing">{m.only_english()}</p>
<p id="save-target">{m.save_target()}</p>

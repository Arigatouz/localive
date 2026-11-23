<script lang="ts">
  let { element }: { element: Element } = $props();

  let rect = $state<DOMRect | null>(null);

  $effect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => (rect = element.getBoundingClientRect()));
    };
    rect = element.getBoundingClientRect();
    window.addEventListener('scroll', measure, { capture: true, passive: true });
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
    };
  });
</script>

{#if rect}
  <div
    class="localive-highlight"
    style:top="{rect.top - 3}px"
    style:left="{rect.left - 3}px"
    style:width="{rect.width + 6}px"
    style:height="{rect.height + 6}px"
  ></div>
{/if}

<style>
  .localive-highlight {
    position: fixed;
    z-index: 2147483645;
    border: 2px solid var(--localive-accent);
    border-radius: 4px;
    background: var(--localive-accent-wash);
    pointer-events: none;
    box-sizing: border-box;
  }
</style>

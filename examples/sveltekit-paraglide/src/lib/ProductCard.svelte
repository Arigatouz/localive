<script>
  let { title, action } = $props();
</script>

<article class="card">
  <h3 id="card-title">{title}</h3>
  <a id="card-action" href="/loads">{action}</a>
</article>

<style>
  .card {
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
  }
</style>

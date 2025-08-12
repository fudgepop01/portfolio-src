<script lang="ts">
import Handsontable from "handsontable";
import { onMount, tick } from "svelte";
import { copyToClipboard } from "../../helpers/CopyToClipboard";

  import { hotLanguageSerialize } from "../../helpers/marked-custom/languages/hotable";

  let { tableData, hidden = $bindable() } = $props();
  let rendered = $state(false);

  let editing = $state(false);

  let hotableEl = $state();
  let hotable: Handsontable;

  const createTable = async () => {
    rendered = true;
    await tick();
    hotable = new Handsontable(hotableEl, tableData);
  }

  const copy = () => {
    copyToClipboard(hotLanguageSerialize(hotable));
  }

  const edit = () => {
    hotable.updateSettings({
      readOnly: false,
      contextMenu: true,
      allowInsertColumn: true,
      allowInsertRow: true,
    });
    editing = true;
  }

  const stopEdit = () => {
    hotable.updateSettings({
      readOnly: true,
      contextMenu: false
    });
    editing = false;
  }

  onMount(() => {
    if (!hidden) createTable();
    hidden = false;
  })
</script>

{#if rendered == false}
  <button onclick={createTable} style="display: block">show table</button>
{:else}
  {#if editing}
    <button onclick={stopEdit}>stop editing</button>
    <button onclick={copy}>copy as markdown</button>
  {:else}
    {#if !hidden}
      <button onclick={() => hidden = true}>hide table</button>
      <button onclick={edit}>edit table</button>
    {:else}
      <button onclick={() => hidden = false} style="display: block">show table</button>
    {/if}
  {/if}
  <div bind:this={hotableEl} style="display: {hidden ? 'none' : 'block'}"></div>
{/if}

<style>
  button {
    display: inline-block;
  }
</style>
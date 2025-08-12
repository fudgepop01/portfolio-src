<script lang="ts">
  import * as Handsontable from "handsontable";
  import { onMount, tick } from "svelte";
  import { copyToClipboard } from "../../helpers/CopyToClipboard";

  import { hotLanguageSerialize } from "../../helpers/marked-custom/languages/hotable";


  let {
    name,
    structData,
    fnData,
    hidden = $bindable()
  } = $props();
  let rendered = $state(false);

  let editing = $state(false);

  let structTableEl = $state();
  let structTable: Handsontable;
  let fnTableEl = $state();
  let fnTable: Handsontable;

  const createTable = async () => {
    rendered = true;
    await tick();
    structTable = new Handsontable(structTableEl, structData);
    fnTable = new Handsontable(fnTableEl, fnData);
  }

  // const copy = () => {
  //   copyToClipboard(hotLanguageSerialize(hotable));
  // }

  const edit = () => {
    structTable.updateSettings({readOnly: false, contextMenu: true, allowInsertColumn: true, allowInsertRow: true});
    fnTable.updateSettings({readOnly: false, contextMenu: true, allowInsertColumn: true, allowInsertRow: true});
    editing = true;
  }

  const stopEdit = () => {
    structTable.updateSettings({ readOnly: true, contextMenu: false });
    fnTable.updateSettings({ readOnly: true, contextMenu: false });
    editing = false;
  }

  onMount(() => {
    if (!hidden) createTable();
    hidden = false;
  })
</script>

<h5 class="block-heading">{name}</h5>
{#if rendered == false}
  <button onclick={createTable} style="display: block">show table</button>
{:else}
  {#if editing}
    <button onclick={stopEdit}>stop editing</button>
    <!-- <button on:click={copy}>copy as markdown</button> -->
  {:else}
    {#if !hidden}
      <button onclick={() => hidden = true}>hide table</button>
      <button onclick={edit}>edit table</button>
    {:else}
      <button onclick={() => hidden = false} style="display: block">show table</button>
    {/if}
  {/if}
    <div class="tables" style="display: {hidden ? 'none' : 'block'}">
      <span class="block-heading">properties</span>
      <div bind:this={structTableEl}></div>
      <span class="block-heading">functions</span>
      <div bind:this={fnTableEl}></div>
    </div>
  {/if}

<style>
  button {
    display: inline-block;
  }

  span.block-heading {
    font-weight: bold;
    display: block;
  }

  :global(.handsontable td > span.link) {
    font-weight: bold;
  }

  :global(.handsontable td > span.link:hover) {
    text-decoration: underline;
  }
</style>
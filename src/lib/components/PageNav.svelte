<script lang="ts">

interface pageDirectory {
  label: string;
  children: Array<string | pageDirectory>;
  collapsed?: boolean;
}

export let pageDirStructure: pageDirectory = {label: '_', children: []};
export let pageRoot = '';
export let lastPage = '';
export let clickEvt: Function = async () => {};

const getChildrenCount = (pd: pageDirectory) => {
  let out = 0;
  for (const ch of pd.children) {
    if (typeof ch !== "string")
      out += getChildrenCount(ch);
    out++;
  }
  return out;
}

const focus = (el: Element | null) => {
  if (el instanceof HTMLElement) {
    el.focus();
    return true;
  }
  return false;
}

const handleNewFocus = (el: HTMLElement,
  selection: "next" | "previous"
) => {
  const targetSelector = (selection === "next") ? "nextElementSibling" : "previousElementSibling";
  const targetListSelector = (selection === "next") ? "firstElementChild" : "lastElementChild";
  
  if (el[targetSelector] instanceof HTMLElement) {
    focus(el[targetSelector])
  } else if (el?.parentElement?.parentElement.classList.contains("nav-dir-header")) {
    const nextEl = el.parentElement.parentElement[targetSelector];
    if (nextEl) {
      el.parentElement.parentElement.classList.remove("active");
      if (nextEl.classList.contains("nav-dir-header")) {
        nextEl.classList.add("active");
        focus(nextEl.children.item(1)[targetListSelector]);
      } else  {
        focus(nextEl);
      }
    } else {
      handleNewFocus(el.parentElement.parentElement, selection);
    }
  } else if (el?.parentElement?.parentElement) {
    focus(el.parentElement.parentElement);
  }
}

const handleKeySubmenu = (evt: KeyboardEvent) => {
  if (evt.target instanceof HTMLElement) { 
    switch (evt.code) {
      case "ArrowDown": handleNewFocus(evt.target, "next"); break;
      case "ArrowUp": handleNewFocus(evt.target, "previous"); break;
      case "ArrowRight":
      case "Enter": {
        if (evt.target.classList.contains("active")) {
          focus(evt.target.children.item(1).firstElementChild);
        } else { evt.target.classList.add("active"); }
      } break;
      case "ArrowLeft": {
        if (evt.target.classList.contains("active")) {
          evt.target.classList.remove("active");
        } else { focus(evt.target.parentElement.parentElement); }
      } break;
      case "Tab": handleNewFocus(evt.target, evt.shiftKey ? "next" : "previous"); break;
    }
  }
}

const handleKeyLink = (evt: KeyboardEvent, clickEvtHandler: Function) => {
  if (evt.target instanceof HTMLElement) {
    switch (evt.code) {
      case "ArrowDown": handleNewFocus(evt.target, "next"); break;
      case "ArrowUp": handleNewFocus(evt.target, "previous"); break;
      case "Space":
      case "ArrowRight":
      case "Enter": clickEvtHandler(); break;
      case "ArrowLeft": {
        focus(evt.target.parentElement.parentElement);
      } break;
      case "Tab": handleNewFocus(evt.target, evt.shiftKey ? "next" : "previous"); break;
    }
  }
  
}

</script>

{#each pageDirStructure.children as child}
  {#if typeof child === "string"}
    <menuitem
      class="nav-link {(lastPage === pageRoot + child) ? "current" : ""}"
      on:click={(evt) => {evt.stopPropagation(); clickEvt(pageRoot + child)}}
      on:keydown={(evt) => {evt.stopPropagation(); evt.preventDefault(); handleKeyLink(evt, () => clickEvt(pageRoot + child));}}
      tabindex="0"
    >
      {child.replace(/_/g, " ")}
    </menuitem>
  {:else}
    <menuitem
      class="nav-dir-header {child.collapsed ? '' : "active"}"
      on:click={function(evt) {evt.stopPropagation(); this.classList.toggle("active")}}
      on:keydown={function(evt) {evt.stopPropagation(); evt.preventDefault(); handleKeySubmenu(evt)}}
      tabindex="0"
    >
      <span>{child.label}</span>
      <div class="nav-dir-links" style="max-height: {getChildrenCount(child) * 25}px">
        <svelte:self
          pageDirStructure={child}
          pageRoot={pageRoot + child.label}
          {lastPage}
          {clickEvt}
        />
      </div>
    </menuitem>
  {/if}
{/each}

<style>

.nav-dir-links {
  transition: max-height .3s cubic-bezier(0.19, 1, 0.22, 1);
  overflow: hidden;
  background-color: #FFF;
  padding-left: 20px;
  position: relative;
}

.nav-dir-links::before {
  content: '';
  display: block;
  position: absolute;
  height: 100%;
  width: 2px;
  left: 5px;
  background-color: #0001;
}

:global(.nav-dir-header:not(.active) > .nav-dir-links) {
  max-height: 0px !important;
  pointer-events: none;
}

/* .nav-dir-header {
  background-color: #222;
} */

.nav-dir-header > span {
  display: block;
  position: relative;
  width: 100%;
  height: 25px;
  line-height: 25px;
  font-weight: bold;
  color: #000;
  user-select: none;
}

.nav-dir-header > span:hover {
  background-color: #0001;
}

.nav-dir-header > span::before {
  display: inline-block;
  content: "›";
  padding: 0 5px;
  transform: rotate(0deg);
  /* transition: transform .3s cubic-bezier(0.19, 1, 0.22, 1); */
}

.nav-dir-header.active > span::before {
  transform: rotate(90deg);
}

.nav-link {
  display: flex;
  align-items: center;
  height: 25px;
  padding-left: 10px;
  position: relative;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nav-link:hover {
  background-color: #0001;
  cursor: pointer;
}

.nav-link.current {
  pointer-events: none;
  background-color: #0001;
  padding-left: 10px;
}
.nav-link.current::before {
  content: '';
  position: absolute;
  display: block;
  right: 100%;
  height: 100%;
  width: 5px;
  /* margin-right: -5px; */
  background-color: red;
}

</style>

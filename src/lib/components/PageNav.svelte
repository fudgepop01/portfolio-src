<script lang="ts">
    import { onMount } from 'svelte';
  import PageNav from './PageNav.svelte';

  interface pageDirectory {
    label: string;
    children: Array<string | pageDirectory>;
    collapsed?: boolean;
  }

  interface Props {
    pageDirStructure?: pageDirectory;
    pageRoot?: string;
    lastPage?: string;
    clickEvt?: Function;
  }

  let {
    pageDirStructure = $bindable({label: '_', children: []}),
    pageRoot = '',
    lastPage = '',
    clickEvt = async () => {}
  }: Props = $props();  

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
            // evt.target.style.marginLeft = "-12px";
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
        case "ArrowRight":
        case "ArrowDown": handleNewFocus(evt.target, "next"); break;
        case "ArrowUp": handleNewFocus(evt.target, "previous"); break;
        case "Space":
        case "Enter": clickEvtHandler(); break;
        case "ArrowLeft": {
          focus(evt.target.parentElement.parentElement);
        } break;
        case "Tab": handleNewFocus(evt.target, evt.shiftKey ? "next" : "previous"); break;
      }
    } 
  }

  const handleOpenClose = (evt: MouseEvent, self: HTMLElement) => {
    const links = self.getElementsByClassName("nav-dir-links")[0] as HTMLDivElement;
    if (!links.style.maxHeight || parseInt(links.style.maxHeight) < 50) {
      links.style.maxHeight = `${self.offsetHeight}px`;
    }
    self.classList.toggle("active");
    // if (self.classList.contains("active")) {
    //   self.style.marginLeft = "-12px";
    // } else {
    //   self.style.marginLeft = "0px";
    // }
  }

  // const setMaxHeight = (self) => {
  //   const links = self.getElementsByClassName("nav-dir-links")[0] as HTMLDivElement;
  //   if (!links.style.maxHeight) {
  //     for (link of links)
  //     links.style.maxHeight = `${self.offsetHeight}px`;
  //   }
  // }

  let dirLinks = $state<HTMLElement[]>([]);
  let heightsInitialized = $state(false);
  $effect(() => {
    if (!heightsInitialized && dirLinks.length > 0) {
      const sorted = dirLinks.sort((a, b) => a.depth - b.depth);
      for (const link of dirLinks) {
        if (!link.style.maxHeight) {
          let totalHeight = 0;
          for (const specificLink of link.children) {
            if (specificLink.classList.contains("nav-dir-header")) {
              totalHeight += parseInt((specificLink.getElementsByClassName("nav-dir-links")[0] as HTMLElement).style.maxHeight);
            } else {
              totalHeight += specificLink.clientHeight;
            }
          }
          link.style.maxHeight = `${totalHeight + 35}px`;
        }
      }
      heightsInitialized = true;
    }
  })

</script>

{#key pageDirStructure}
  {#each pageDirStructure.children as child, i (i)}
    {#if typeof child === "string"}
      <div
        role="menuitem"
        class="nav-link {(lastPage === pageRoot + child) ? "current" : ""}"
        onclick={(evt) => {evt.stopPropagation(); clickEvt(pageRoot + child)}}
        onkeydown={(evt) => {evt.stopPropagation(); evt.preventDefault(); handleKeyLink(evt, () => clickEvt(pageRoot + child));}}
        tabindex="0"
      >
        {child.replace(/_/g, " ")}
      </div>
    {:else}
      <div
        role="menuitem"
        class="nav-dir-header {child.collapsed ? '' : "active"}"
        onclick={function(evt) {evt.stopPropagation(); handleOpenClose(evt, this);}}
        onkeydown={function(evt) {evt.stopPropagation(); evt.preventDefault(); handleKeySubmenu(evt)}}
        tabindex="0"
      >
        <span class="nav-dir-title">{child.label.replace(/_/g, " ")}</span>
        <div class="nav-dir-links" bind:this={dirLinks[dirLinks.length]}>
          <PageNav
            pageDirStructure={child}
            pageRoot={pageRoot + child.label}
            {lastPage}
            {clickEvt}
          />
        </div>
      </div>
    {/if}
  {/each}
{/key}

<style>

.nav-dir-links {
  transition: max-height .3s cubic-bezier(0.19, 1, 0.22, 1),
    padding .3s cubic-bezier(0.19, 1, 0.22, 1);
  
  overflow: hidden;
  background-color: #FFF;
  padding-left: 20px;
  position: relative;
}

.nav-dir-header {
  transition: margin-left .3s ease;
}
.nav-dir-header.active {
  margin-left: -10px;
}

.nav-dir-header.active > .nav-dir-links {
  padding-top: 5px;
  padding-bottom: 5px;
  padding-right: 5px;
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
  height: 25px;
  line-height: 25px;
  font-weight: bold;
  color: #000;
  user-select: none;
  margin-left: 15px;

  height: 100%; 
  width: calc(100% - 20px);

}

.nav-dir-header > span:hover {
  background-color: #0001;
}

.nav-dir-header > span::before {
  display: block;
  position: absolute;
  content: "›";
  /* padding: 0 5px; */
  transform: rotate(0deg);
  left: -10px;
  top: 0;
  transition: transform .3s cubic-bezier(0.19, 1, 0.22, 1);
}

.nav-dir-header.active > span::before {
  transform: rotate(90deg);
}

.nav-link {
  display: flex;
  align-items: center;
  min-height: 25px;
  padding-left: 10px;
  position: relative;
  line-height: 20px;
  /* padding-bottom: 5px; */
  /* white-space: nowrap; */
  text-overflow: ellipsis;
}

.nav-link::before {
  content: '';
  position: absolute;
  display: block;
  right: calc(100% + 10px);
  height: 5px;
  width: 5px;
  /* margin-right: -5px; */
  background-color: #0004;
  transition: all .2s ease;
}

.nav-link:hover {
  background-color: #0001;
  cursor: pointer;
}

.nav-link:hover::before {
  content: '';
  position: absolute;
  display: block;
  right: calc(100% + 0px);
  height: 5px;
  width: 15px;
  /* margin-right: -5px; */
  background-color: #00801048;
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
  background-color: #00b050;
}

</style>

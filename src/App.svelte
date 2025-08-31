<script lang="ts">
  import { run } from 'svelte/legacy';

  // svelte imports
  import { tick, mount, onMount } from 'svelte';
  // other library imports
  import { marked } from 'marked';
  // helper imports
  import { rendererFactory } from './lib/helpers/marked-custom/base';
  import { copyToClipboard } from './lib/helpers/CopyToClipboard';
  import { registerHexRenderers } from './lib/Tables/renderers/hex';
  import { hostRootAddr } from './lib/helpers/hostRoot';
  // store imports
  import { currStructPath } from './lib/stores/typeDataStore';
  // component imports
  import PageNav from './lib/components/PageNav.svelte';
  import StandardTable from './lib/Tables/standard/StandardTable.svelte';
  import { currentPath } from './lib/stores/locationStore';
  import StructTable from './lib/Tables/standard/StructTable.svelte';

  registerHexRenderers();

  const tables = [];
  const structData = [];
  let TOC = $state([]);
  let TOCIsActive = $state(false);
  let sidebarIsActive = $state(false);
  let lastPage = $state(localStorage.getItem("lastPage"));
  let pages = $state([]);
  let pageScripts = $state([]);

  let contentElement = $state<HTMLDivElement>();
  let titleHeaderText = $state("");

  const getStructData = () => {
    return localStorage.getItem("structs");
  }

  marked.use({
    renderer: rendererFactory({
      hotLang: tables,
      struct: {
        getCurrentData: getStructData,
        tableData: structData
      }
    }, TOC, pages, pageScripts)
  });

  let markedHTMLOut = $state("");
  const updatePageContent = async () => {
    contentElement.scrollTop = 0;
    localStorage.setItem("lastPage", $currentPath);
    lastPage = $currentPath;
    tables.length = 0;
    structData.length = 0;
    TOC.length = 0;
    markedHTMLOut = marked((await (await fetch(`${hostRootAddr}${$currentPath}.md`)).text()));
    TOC = TOC;

    // for (const src of pageScripts) {
    //   console.log(src);
    //   eval(await (await fetch(src)).text());
    // }

    pageScripts = [];

    await tick();

    for (const [idx, tableConfig] of tables.entries()) {
      mount(StandardTable, {
                target: document.getElementById(`HOTable-${idx}`),
                props: {
                  tableData: tableConfig,
                  hidden: tables.length > 10
                }
              })
    }
    
    for (const [idx, {name, properties, functions}] of structData.entries()) {
      console.log(document.getElementById(`structTable-${idx}`));
      mount(StructTable, {
                target: document.getElementById(`structTable-${idx}`),
                props: {
                  name,
                  structData: properties,
                  fnData: functions,
                  hidden: true
                }
              })
    }

    titleHeaderText = $currentPath.replace(/\//g, " > ").replace(/_/g, " ");

    for (const heading of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
      heading.classList.add("page-link");
      heading.addEventListener("click", () => {
        navigator.clipboard.writeText(encodeURI(`${window.location.origin}${window.location.pathname}?page=${$currentPath}&location=${heading.id}`));
      })
    }
  }

  // tracks url href changes (back/forward buttons)
  // let thing = window.

  // incredibly basic implementation - easy to break BUT ALSO very intuitive to use
  let pageDirStructure = $state({label: "_root", children: [], collapsed: false});
  (async () => {
    const indentSize = 2;

    let pageDataLines: string[];
    pageDataLines = (await (await fetch(`${hostRootAddr}_pages.txt`)).text()).replace(/\r/g, "").split("\n");
    const pathStack = [];
    const pathDirStack: Array<typeof pageDirStructure> = [pageDirStructure];
    let lastIndentLevel = 0;
    for (const line of pageDataLines) {
      if (line.trim().startsWith("? ") || line.length === 0) continue;

      const thisIndentLevel = line.search(/\S/);
      if (thisIndentLevel < lastIndentLevel) {
        const levels = (lastIndentLevel - thisIndentLevel) / indentSize;
        for (let i = 0; i < levels; i++) pathStack.pop();
        pathDirStack.length = pathStack.length + 1;
        lastIndentLevel = thisIndentLevel;
      } else {
        lastIndentLevel = thisIndentLevel;
      }

      let lineData = line.trim();

      if (lineData.startsWith("?c")) {
        lineData = lineData.substring(2).trim();
        if (lineData.endsWith("/")) {
          pages.push(pathStack.join('') + lineData);
          pathStack.push(lineData);
          pathDirStack[pathDirStack.length - 1].children.push({label: lineData, children: [], collapsed: true});
          pathDirStack.push(pathDirStack[pathDirStack.length - 1].children.slice(-1)[0]);
          lastIndentLevel += 2;
          continue;
        }
      }
      pages.push(pathStack.join('') + lineData);

      if (line.endsWith("/")) {
        pathStack.push(lineData);
        pathDirStack[pathDirStack.length - 1].children.push({label: lineData, children: []});
        pathDirStack.push(pathDirStack[pathDirStack.length - 1].children.slice(-1)[0]);
        lastIndentLevel += 2;
      } else {
        pathDirStack[pathDirStack.length - 1].children.push(lineData);
      }
    }

    // svelte will update because I said so
    pages = pages;
    // pageDirStructure = pageDirStructure;

    const urlParams = new URLSearchParams(window.location.search);
    console.log(window.location.search)
    for(const entry of urlParams.entries()) console.log(entry);
    const linkedPage = urlParams.get('page');
    console.log(linkedPage);
    const linkedLocation = urlParams.get('location');
    $currentPath = linkedPage || localStorage.getItem("lastPage") || "index";
    await tick();
    if (linkedLocation) {
      // @ts-ignore
      const targetHeading = document.getElementById(new marked.Slugger().slug(linkedLocation, {dryrun: true}));
      targetHeading.scrollIntoView();
    }
  })();

  // let mjloaded = $state(false);
  onMount(() => {
    let script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js?config=TeX-MML-AM_CHTML";
    document.head.append(script);

    window.MathJax = {
      tex: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
      svg: {fontCache: 'global'}
    };
  })

  $effect(() => {
    updatePageContent().then(() => {
      if (window.MathJax && window.MathJax.typeset) {
        window.MathJax.typesetPromise(document.body.children)
      };
    });
  });

</script>

<header>
  <button class="sidebarButton" onclick={() => sidebarIsActive = true}> pages </button>
  <button class="navButton" onclick={() => TOCIsActive = true}> content </button>
</header>
<div class="offToggle {sidebarIsActive || TOCIsActive ? 'active' : ''}" onclick={() => {TOCIsActive = false; sidebarIsActive = false;}}></div>

<main>
  <div class="sidebar {sidebarIsActive ? 'active' : ''}">
    <div class="list">
      <PageNav {pageDirStructure} clickEvt={(s) => { $currentPath = s }} {lastPage} />
    </div>
  </div>
  <div class="content" bind:this={contentElement}>
    <div class="content-wrapper" id="content">
      <h6>{titleHeaderText}</h6>
      {@html markedHTMLOut}
    </div>
  </div>
  <div class="TOC {TOCIsActive ? 'active' : ''}">
    <ul>
      {#each TOC as header}
        <li style="margin-left: {(header.level - 1) * 10}px"><a href="#{header.id}">{header.text}</a></li>
      {/each}
    </ul>
  </div>
</main>

<style>
main {
  width: 100%;
  display: flex;
  justify-content: center;
  align-content: center;
}

main > .sidebar {
  width: 250px;
  overflow-x: hidden;
  word-wrap: normal;
  height: 100%;
  /* box-shadow: inset -17px 0 2px #0004; */
  background-color: #FFF;
  flex-shrink: 0;
  overflow-y: scroll;
  margin-left: -10px;
  padding-top: 10px;
  padding-right: 10px;
  scrollbar-gutter: stable both-edges;
}

/* main > .sidebar::-webkit-scrollbar {
  box-sizing: content-box;
} */

main > .sidebar > .list {
  width: calc(100% - 12px);
  height: 100%;
  font-size: 16px;
  background-color: #FFF;
  margin-left: 10px;
}

main > .content {
  height: 100%;
  padding: 10px 20px;
  overflow-y: scroll;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
}

main > .content > .content-wrapper {
  max-width: 1200px;
  padding: 10px 20px;
  width: 100%;
}

/* main > .content::-webkit-scrollbar {
  display: none;
} */

:global(.wtHider) {
  /* idk why but it breaks without this extremly hacky solution :( */
  height: initial !important;
}

:global(.invalid-link) {
  color: #F00;
  display: inline-block;
  position: relative;
}
:global(.invalid-link::after) {
  content: attr(data-targetpage);
  opacity: 0;
  background-color: black;
  color: white;
  display: block;
  position: absolute;
  pointer-events: none;
  top: 0;
  height: 20px;
  padding: 2px;
  border-radius: 2px;
  transition: all .3s cubic-bezier(0.19, 1, 0.22, 1);
}
:global(.invalid-link:hover) {
  text-decoration: underline;
}
:global(.invalid-link:hover::after) {
  top: -25px;
  opacity: 1;
  transition: all .3s cubic-bezier(0.19, 1, 0.22, 1);
}

main > .TOC > ul {
  box-shadow: inset 2px 0 2px #0004;

  padding: 15px;
  margin: 0;
  width: 200px;
  list-style: none;
  height: 100%;
  overflow-y: scroll;

  flex-shrink: 0;
  font-size: 14px;
}

main > .TOC > ul > li {
  margin: 0;
  padding-top: 5px;
  padding-bottom: 5px;
  border-bottom: 2px solid #0002;
  border-bottom-style: inset;
}
main > .TOC > ul > li::before {
  content: "•  ";
  display: inline-block;
  white-space: pre;
}
main > .TOC > ul > li::after {
  display: block;
}

:global(.page-link:hover) {
  cursor: pointer;
  text-shadow: 0 1px 3px #0004;
}

:global(.page-link:hover::before) {
  content: "🔗";
  display: inline;
  /* position: inline; */
  /* right: 100%;
  margin: auto; */
}

header {
  display: none;
}

@media only screen and (max-width: 1000px) {
  :global(html) {
    --headerbar-size: 65px;
  }

  main > .sidebar {
    display: block;
    position: fixed;
    top: 0;
    width: 250px;
    left: -250px;
    z-index: 1002;
    transition: left .3s cubic-bezier(0.19, 1, 0.22, 1);
  }

  main > .sidebar.active {
    left: 0px;
    transition: left .3s cubic-bezier(0.19, 1, 0.22, 1);
  }

  main > .TOC {
    display: block;
    position: fixed;
    background-color: #FFF;
    top: 0;
    width: 250px;
    right: -250px;
    z-index: 1002;
    transition: right .3s cubic-bezier(0.19, 1, 0.22, 1);
    height: 100%;
  }

  main > .TOC > ul {
    width: 100%;
  }

  main > .TOC.active {
    right: 0px;
    transition: right .3s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .offToggle {
    position: fixed;
    pointer-events: none;
    background-color: #0000;
    width: 100vw;
    height: 100vh;
    z-index: 1001;
    transition: background-color .3s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .offToggle.active {
    background-color: #0003;
    pointer-events: auto;
    transition: background-color .3s cubic-bezier(0.19, 1, 0.22, 1);
  }

  :global(body) {
    height: calc(100% - var(--headerbar-size));
  }

  /* kinda hacky but it works ahahah */
  header {
    display: block;
    position: fixed;
    height: var(--headerbar-size);
    padding: 20px;
    top: 0;
    width: 100vw;
    background-color: #FFF;
    box-shadow: 0 1px 3px #0004;
    z-index: 1000
  }

  header > .sidebarButton {
    float: left;
  }

  header > .navButton {
    float: right;
  }

  /* main > .content {
    margin-top: var(--headerbar-size);
    height: calc(100vh - var(--headerbar-size));
  } */

  main {
    position: absolute;
    top: var(--headerbar-size);
    height: 100%;
  }

  :global(.htDimmed) {
    pointer-events: none;
  }
}
</style>
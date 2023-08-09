import { writable, type Writable } from 'svelte/store';

export const currentPath = (() => {
  const { subscribe, set } = writable('');
  let firstChange = true;
  let hashChange = false;

  let currLoc = location.search;
  window.addEventListener("popstate", (ev) => {
    if (location.search != currLoc) {
      console.log(currLoc)
      console.log(location.search)
      location.reload();
    }
  })
  // window.history.addEventListener("", () => {
  //   location.reload();
  // })

  // let previousUrl = '';
  // const observer = new MutationObserver(function(mutations) {
  //   if (window.location.href !== previousUrl) {
  //     previousUrl = window.location.href;
  //     console.log(`URL changed from ${previousUrl} to ${window.location.href}`);
  //   }
  // });
  // const config = {subtree: true, childList: true};

  // // start listening to changes
  // observer.observe(document, config);

  return {
    subscribe,
    set: (newValue: any) => {
      if (!firstChange) {
        window.history.pushState({}, '', `${window.location.origin}${window.location.pathname}?page=${newValue}`);
      }
      currLoc = location.search;
      firstChange = false;
      return set(newValue);
    },
    reset: () => set('')
  };
})()
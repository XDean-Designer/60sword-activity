(function (global) {
  var STORAGE_KEY = 'page5_copy_sword_state';
  var ENTRY_KEY = 'page5_copy_entry_anim';

  function getState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setState(state) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function defaultState() {
    return {
      gridPage: 0,
      selectedPage: -1,
      selectedIndex: -1,
      swordSrc: 'assets/images/swords2/sword-1.png',
      swordName: '独孤九剑'
    };
  }

  function loadState() {
    return getState() || defaultState();
  }

  function navigateWithSlide(url, direction) {
    sessionStorage.setItem(ENTRY_KEY, direction);
    window.location.href = url;
  }

  function initPageEnter() {
    sessionStorage.removeItem(ENTRY_KEY);
  }

  global.Page5State = {
    STORAGE_KEY: STORAGE_KEY,
    ENTRY_KEY: ENTRY_KEY,
    getState: getState,
    setState: setState,
    loadState: loadState,
    navigateWithSlide: navigateWithSlide,
    initPageEnter: initPageEnter
  };
})(window);

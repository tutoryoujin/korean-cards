/* ============================================================
   Router — #/            홈
            #/deck/<id>   학습
            #/credits     이미지 출처
   ============================================================ */
(() => {
  const root = document.getElementById("view");
  let cleanup = null;

  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const hash = location.hash.replace(/^#/, "") || "/";
    const m = hash.match(/^\/deck\/([\w-]+)$/);
    if (m && KC.byId[m[1]]) {
      const deck = KC.byId[m[1]];
      document.title = `${deck.title.ko} · 한국어 카드 with Youjin`;
      cleanup = KC.mountStudy(root, deck);
    } else if (hash === "/credits") {
      document.title = "이미지 출처 · 한국어 카드 with Youjin";
      KC.mountCredits(root);
    } else {
      if (hash !== "/") history.replaceState(null, "", "#/");
      document.title = "한국어 카드 with Youjin";
      KC.mountHome(root);
    }
  }

  window.addEventListener("hashchange", route);
  route();
})();

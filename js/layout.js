/* ============================================================
   Layout — 사이트 공통 헤더/푸터 (홈, 출처 화면에서 사용)
   학습 화면은 카드에 집중하도록 헤더/푸터 없이 자체 상단바만 씀.
   ============================================================ */
KC.siteHeader = function siteHeader(active) {
  const link = (href, key, ko, en) =>
    `<a href="${href}"${active === key ? ' class="active" aria-current="page"' : ""}>${ko}<small>${en}</small></a>`;
  return `
    <header class="site-header">
      <div class="site-inner">
        <a class="brand" href="#/" aria-label="한국어 카드 with Youjin 홈 / Home">
          <span class="brand-mark" aria-hidden="true"><svg><use href="#ieung-mark"/></svg></span>
          <span class="brand-text">한국어 카드 <em>with Youjin</em><small>Korean Word Cards</small></span>
        </a>
        <nav class="site-nav" aria-label="메뉴 / Menu">
          ${link("#/", "home", "카드", "Decks")}
        </nav>
      </div>
    </header>`;
};

KC.siteFooter = function siteFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="site-footer">
      <div class="site-inner">
        <div class="foot-brand">
          <span class="brand-mark sm" aria-hidden="true"><svg><use href="#ieung-mark"/></svg></span>
          <div>
            <b>한국어 카드 <em>with Youjin</em></b>
            <span>한 장씩, 매일 조금씩.<br>Learn Korean, one card at a time.</span>
          </div>
        </div>
        <nav class="foot-links" aria-label="푸터 메뉴 / Footer">
          <a href="#/">카드 목록 · Decks</a>
          <a href="#/credits">이미지 출처 · Image credits</a>
        </nav>
        <p class="foot-legal">
          Illustrations by Microsoft Fluent Emoji (MIT). Photos by Openverse contributors, used under
          CC BY / CC BY-SA. Images remain the property of their respective owners.
        </p>
        <p class="foot-copy">© ${year} Made by Youjin. All rights reserved.</p>
      </div>
    </footer>`;
};

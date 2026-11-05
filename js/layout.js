/* ============================================================
   Layout — 사이트 공통 헤더/푸터 (홈, 출처 화면에서 사용)
   학습 화면은 카드에 집중하도록 헤더/푸터 없이 자체 상단바만 씀.
   ============================================================ */
/* 형제 앱. 한쪽만 링크가 걸려 있으면 묶음이 아니라 외딴 페이지로 보인다. */
const CALENDAR = "https://tutoryoujin.github.io/calendar-practice/";

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
        <div class="menu">
          <button class="menu-btn" type="button" aria-label="메뉴 열기 / Open menu"
                  aria-expanded="false" aria-controls="siteNav">
            <span class="bars" aria-hidden="true"></span>
          </button>
          <nav class="site-nav" id="siteNav" aria-label="메뉴 / Menu" hidden>
            ${link("#/", "home", "카드", "Cards")}
            ${link(CALENDAR, "calendar", "한국어 달력", "Korean Calendar")}
            ${link("#/credits", "credits", "이미지 출처", "Image credits")}
          </nav>
        </div>
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
          <a href="${CALENDAR}">한국어 달력 · Calendar</a>
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

/* ============================================================
   햄버거 메뉴 — 달력 앱과 같은 모양.
   화면을 innerHTML 로 통째로 다시 그리므로 버튼에 직접 걸지 않고
   document 에 한 번만 걸어 둔다.
   ============================================================ */
(() => {
  const nav = () => document.getElementById("siteNav");
  const btn = () => document.querySelector(".menu-btn");

  function setMenu(open) {
    const n = nav(), b = btn();
    if (!n || !b) return;
    b.setAttribute("aria-expanded", String(open));
    b.setAttribute("aria-label", open ? "메뉴 닫기 / Close menu" : "메뉴 열기 / Open menu");
    n.hidden = !open;
  }

  document.addEventListener("click", e => {
    const n = nav();
    if (!n) return;
    if (e.target.closest(".menu-btn")) { setMenu(n.hidden); return; }
    // 메뉴 안의 링크를 눌러도 닫는다 — 해시 라우팅이라 페이지가 다시 로드되지 않는다
    if (!n.hidden) setMenu(false);
  });

  document.addEventListener("keydown", e => {
    const n = nav();
    if (e.key === "Escape" && n && !n.hidden) { setMenu(false); btn() && btn().focus(); }
  });
})();

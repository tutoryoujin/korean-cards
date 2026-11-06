/* ============================================================
   Home — 덱 더미 + 진행률
   덱 하나가 카드 한 장. 세로로 겹쳐 쌓아 포개 둔 더미처럼 보이게 한다.
   ============================================================ */
KC.mountHome = function mountHome(root) {
  const { esc, folderArt, progress } = KC;

  const folders = KC.decks.map(deck => {
    const p = progress(deck);
    const pct = Math.round((p.done / p.total) * 100);
    const done = p.started && p.done === p.total;
    const meta = !p.started ? `${p.total}장 · 아직 안 열어봤어요`
      : done ? `${p.total}장 모두 외웠어요 🎉`
      : `${p.done} / ${p.total} 외웠어요`;
    const bar = p.started && !done
      ? `<div class="folder-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>` : "";
    return `
      <a class="folder c-${esc(deck.color || "gray")}" href="#/deck/${esc(deck.id)}">
        <span class="folder-label">${esc(deck.title.ko)}</span>
        <p class="folder-desc">${esc(deck.blurb || "")}</p>
        <p class="folder-gloss">${esc(deck.title.en)} · ${meta}</p>
        ${bar}
        <img class="folder-art" src="${folderArt(deck)}" alt="" loading="lazy"
             aria-hidden="true" draggable="false" data-emoji="${esc(deck.emoji || "")}">
      </a>`;
  }).join("");

  // 이응은 보통 손을 흔든다. 사흘 넘게 안 왔으면 졸고 있다 —
  // 매일 오는 학습자에게는 보이지 않는다.
  const away = KC.store.daysAway();
  const mood = away !== null && away >= 3 ? "sleepy" : "basic";

  root.innerHTML = `
    <div class="page">
      ${KC.siteHeader("home")}
      <main class="app home">
        <section class="home-hero">
          <h1>오늘은 어떤 카드로 공부할까요?</h1>
          <p>What would you like to learn today?</p>
        </section>
        <nav class="deck-stack" aria-label="덱 / Decks">
          ${folders}
          <div class="folder soon">
            <span class="folder-label">곧 추가돼요</span>
            <p class="folder-gloss">More decks coming soon</p>
            <button class="soon-art" type="button" aria-label="이응 / Ieung">${YJ.ieung(mood)}</button>
          </div>
        </nav>
      </main>
      ${KC.siteFooter()}
    </div>`;
  // 숨은 재미 — 이응을 누르면 메롱 하고 돌아온다
  const buddy = root.querySelector(".soon-art");
  let tease = 0;
  buddy.addEventListener("click", () => {
    clearTimeout(tease);
    buddy.innerHTML = YJ.ieung("tongue");
    tease = setTimeout(() => { if (buddy.isConnected) buddy.innerHTML = YJ.ieung(mood); }, 2800);
  });

  window.scrollTo(0, 0);
};

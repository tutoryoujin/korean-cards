/* ============================================================
   Home — 덱 목록 + 진행률
   ============================================================ */
KC.mountHome = function mountHome(root) {
  const { esc, imgSrc, colorOf, progress } = KC;

  const tiles = KC.decks.map(deck => {
    const cover = deck.cardById[deck.cover] || deck.cards[0];
    const p = progress(deck);
    const pct = Math.round((p.done / p.total) * 100);
    const status = !p.started ? `${p.total}장 · ${p.total} cards`
      : p.done === p.total ? `완료 · Done 🎉`
      : `${p.done} / ${p.total}`;
    return `
      <a class="deck-tile c-${colorOf(deck, cover)}" href="#/deck/${esc(deck.id)}">
        <div class="deck-cover">
          <img class="${deck.art === "photo" ? "photo" : "icon"}" src="${imgSrc(deck, cover)}" alt="" loading="lazy" data-emoji="${esc(deck.emoji || "")}">
        </div>
        <div class="deck-body">
          <div class="deck-name">${esc(deck.title.ko)}<small>${esc(deck.title.en)}</small></div>
          <div class="deck-meta">
            ${p.started ? `<div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>` : ""}
            <span>${status}</span>
          </div>
        </div>
      </a>`;
  }).join("");

  root.innerHTML = `
    <div class="page">
      ${KC.siteHeader("home")}
      <main class="app home">
        <section class="home-hero">
          <h1>오늘은 어떤 카드로 공부할까요?</h1>
          <p>What would you like to learn today?</p>
        </section>
        <nav class="deck-grid" aria-label="덱 / Decks">
          ${tiles}
          <div class="soon"><div><b>곧 추가돼요</b>More decks coming soon</div></div>
        </nav>
      </main>
      ${KC.siteFooter()}
    </div>`;
  window.scrollTo(0, 0);
};

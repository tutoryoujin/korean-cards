/* ============================================================
   Credits — 이미지 출처/라이선스 표기 (CC BY / BY-SA 요구사항)
   데이터: js/credits-data.js (tools/build_images.py 가 생성)
   ============================================================ */
KC.mountCredits = function mountCredits(root) {
  const { esc } = KC;
  const all = window.IMAGE_CREDITS || [];

  const ext = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;

  const sections = KC.decks.map(deck => {
    const items = all.filter(c => c.key.startsWith(deck.id + "/"));
    if (!items.length) return "";
    const head = `<h2>${esc(deck.title.ko)} <small>${esc(deck.title.en)}</small></h2>`;

    // 덱 전체가 한 출처(예: Fluent Emoji)면 한 줄로 요약
    const one = items.every(c => c.author === items[0].author && c.license === items[0].license);
    if (one) {
      const c = items[0];
      const home = c.source.replace(/\/tree\/main\/assets\/.*$/, "");
      return `${head}<p class="credit-summary">All ${items.length} illustrations: ${ext(home, c.author)} · ${ext(c.licenseUrl, c.license)}</p>`;
    }

    // 사진은 CC 요구사항(제목·저작자·출처·라이선스)에 맞춰 장마다 한 줄
    const li = items.map(c => {
      const cardId = c.key.slice(deck.id.length + 1);
      const card = deck.cardById[cardId];
      return `<li><b>${esc(card ? card.ko : cardId)}</b> ${ext(c.source, c.title)} by ${esc(c.author.replace(/^by\s+/i, ""))}, ${ext(c.licenseUrl, c.license)}</li>`;
    }).join("");
    return `${head}<ul class="credit-list">${li}</ul>`;
  }).join("");

  root.innerHTML = `
    <div class="page">
      ${KC.siteHeader("credits")}
      <main class="app credits">
        <section class="home-hero">
          <h1>이미지 출처</h1>
          <p>Image credits</p>
        </section>
        <p class="lead">Photos are cropped and resized from the originals. Each image keeps its original license.
          Illustrations: Microsoft Fluent Emoji (MIT).</p>
        ${sections}
      </main>
      ${KC.siteFooter()}
    </div>`;
  window.scrollTo(0, 0);
};

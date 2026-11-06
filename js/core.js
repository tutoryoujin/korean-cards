/* ============================================================
   Core — 덱 등록, 저장소, 공용 헬퍼.
   덱 파일(decks/*.js)은 KC.register({...}) 로 자신을 등록한다.
   ============================================================ */
window.KC = (() => {
  const decks = [];
  const byId = {};

  /**
   * Deck shape
   * {
   *   id, title: {ko, en}, emoji, cover: "<cardId>",
   *   color: "<palette name>",               // 홈 더미에서 이 덱의 색
   *   blurb: "<한 줄 소개>",                 // 홈 더미 설명. 두 줄을 넘기지 않는다
   *   folderArt: "<imgId>",                  // 겉면 그림. 없으면 cover. 반드시 투명 배경
   *   unit: {ko, en},                        // 완료 문구: "감정 표현 20개"
   *   art: "icon" | "photo",                 // img/<deckId>/<cardId>.webp
   *   groups: { key: {ko, en, color} },      // color = palette name (css/app.css)
   *   cards: [{ id, ko, en, note, group, emoji?, ex?: {ko, en} }]
   * }
   */
  function register(deck) {
    if (byId[deck.id]) throw new Error("duplicate deck id: " + deck.id);
    deck.cardById = Object.fromEntries(deck.cards.map(c => [c.id, c]));
    decks.push(deck);
    byId[deck.id] = deck;
  }

  const store = {
    key: id => "kcards:" + id,
    load(id) {
      try {
        const raw = localStorage.getItem(this.key(id));
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    save(id, state) {
      try { localStorage.setItem(this.key(id), JSON.stringify(state)); } catch (e) {}
    },
    /** 마지막으로 카드를 넘긴 시각. 졸린 이응을 언제 보일지 정한다 */
    touch() {
      try { localStorage.setItem("kcards:last", String(Date.now())); } catch (e) {}
    },
    /** 마지막 학습 뒤 지난 날 수. 기록이 없으면 null */
    daysAway() {
      try {
        const t = Number(localStorage.getItem("kcards:last"));
        return t ? (Date.now() - t) / 864e5 : null;
      } catch (e) { return null; }
    }
  };

  /** saved state가 현재 덱과 맞는지 (카드가 삭제·이름변경되면 무효) */
  function validState(deck, s) {
    return !!s && Array.isArray(s.queue) && Array.isArray(s.missed)
      && s.queue.every(id => deck.cardById[id]) && s.missed.every(id => deck.cardById[id]);
  }

  function progress(deck) {
    const total = deck.cards.length;
    const s = store.load(deck.id);
    if (!validState(deck, s)) return { done: 0, total, started: false };
    const remaining = s.phase === "card" ? s.missed.length + (s.queue.length - s.index) : s.missed.length;
    return { done: total - remaining, total, started: true, round: s.round };
  }

  const imgSrc = (deck, card) => `img/${deck.id}/${card.id}.webp`;
  /** 홈 더미 겉면 그림. 사진은 잘라 내면 그냥 잘린 사진으로 보이므로 투명 아이콘만 쓴다 */
  const folderArt = deck => `img/${deck.id}/${deck.folderArt || deck.cover}.webp`;
  const colorOf = (deck, card) => (deck.groups[card.group] && deck.groups[card.group].color) || "gray";

  const esc = s => String(s ?? "").replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  /** <img> 로드 실패 시 이모지로 대체 */
  function artFallback(img) {
    const emoji = img.dataset.emoji;
    if (!emoji) { img.remove(); return; }
    const span = document.createElement("span");
    span.className = img.classList.contains("folder-art") ? "folder-art emoji"
      : img.classList.contains("art-photo") || img.classList.contains("art-icon") ? "emoji" : "";
    span.textContent = emoji;
    span.setAttribute("aria-hidden", "true");
    img.replaceWith(span);
  }
  document.addEventListener("error", e => {
    if (e.target instanceof HTMLImageElement && e.target.dataset.emoji !== undefined) artFallback(e.target);
  }, true);

  return { decks, byId, register, store, validState, progress, imgSrc, folderArt, colorOf, esc };
})();

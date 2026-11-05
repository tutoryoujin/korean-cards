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
  const colorOf = (deck, card) => (deck.groups[card.group] && deck.groups[card.group].color) || "gray";

  const esc = s => String(s ?? "").replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  /** <img> 로드 실패 시 이모지로 대체 */
  function artFallback(img) {
    const emoji = img.dataset.emoji;
    if (!emoji) { img.remove(); return; }
    const span = document.createElement("span");
    span.className = img.classList.contains("art-photo") || img.classList.contains("art-icon") ? "emoji" : "";
    span.textContent = emoji;
    span.setAttribute("aria-hidden", "true");
    img.replaceWith(span);
  }
  document.addEventListener("error", e => {
    if (e.target instanceof HTMLImageElement && e.target.dataset.emoji !== undefined) artFallback(e.target);
  }, true);

  return { decks, byId, register, store, validState, progress, imgSrc, colorOf, esc };
})();

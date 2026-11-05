/* ============================================================
   Study — 카드 학습 화면. KC.mountStudy(root, deck) → cleanup()
   회차 방식: 못 외운 카드만 모아 다음 회차에서 다시.
   ============================================================ */
KC.mountStudy = function mountStudy(root, deck) {
  const { esc, imgSrc, colorOf, store } = KC;
  const total = deck.cards.length;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.innerHTML = `
    <div class="app">
      <header class="top">
        <div class="top-left">
          <a class="nav-back" href="#/" aria-label="홈 / Home"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a>
          <h1 class="title">${esc(deck.title.ko)}<span class="title-en">${esc(deck.title.en)}</span></h1>
        </div>
        <button class="pill" data-act="reset" type="button"><span class="ko">처음부터</span><span class="en">From the start</span></button>
      </header>
      <div class="status" aria-live="polite">
        <span class="round" data-el="round"></span>
        <div class="bar" aria-hidden="true"><i data-el="bar"></i></div>
        <span data-el="count"></span>
      </div>
      <main class="stage" data-el="stage"></main>
      <div class="actions" data-el="actions">
        <button class="btn" data-act="miss" type="button"><span class="ko">암기 못했어요</span><span class="en">Not memorized</span></button>
        <button class="btn known" data-act="know" type="button"><span class="ko">암기했어요</span><span class="en">Memorized</span></button>
      </div>
    </div>`;

  const el = name => root.querySelector(`[data-el="${name}"]`);
  const stage = el("stage");
  const missBtn = root.querySelector('[data-act="miss"]');
  const knowBtn = root.querySelector('[data-act="know"]');

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const freshState = () => ({ queue: shuffle(deck.cards.map(c => c.id)), index: 0, round: 1, missed: [], learnedThisRound: 0, phase: "card" });
  const saved = store.load(deck.id);
  let state = KC.validState(deck, saved) ? saved : freshState();
  const save = () => store.save(deck.id, state);
  let busy = false, suppressClick = false, celebrateNext = false, alive = true;

  const card = () => stage.querySelector(".card");

  function artHtml(c, cls) {
    const kind = deck.art === "photo" ? "photo" : "icon";
    return `<img class="${cls} ${kind}" src="${imgSrc(deck, c)}" alt="" draggable="false" decoding="async" data-emoji="${esc(c.emoji || "")}">`;
  }

  function preloadNext() {
    const next = deck.cardById[state.queue[state.index + 1]];
    if (next) { const im = new Image(); im.src = imgSrc(deck, next); }
  }

  function updateStatus() {
    el("round").innerHTML = `${state.round}회차 <span class="round-en">Round ${state.round}</span>`;
    const n = state.queue.length;
    const onCard = state.phase === "card";
    el("count").textContent = (onCard ? Math.min(state.index + 1, n) : n) + " / " + n;
    el("bar").style.width = (onCard ? (state.index / n) * 100 : 100) + "%";
    el("actions").style.visibility = onCard ? "visible" : "hidden";
    missBtn.disabled = knowBtn.disabled = !onCard;
  }

  function renderCard() {
    const c = deck.cardById[state.queue[state.index]];
    const photo = deck.art === "photo";
    const ex = c.ex ? `<p class="ex"><span class="ex-ko">${esc(c.ex.ko)}</span><span class="ex-en">${esc(c.ex.en)}</span></p>` : "";
    stage.innerHTML = `
      <button class="card c-${colorOf(deck, c)}" type="button" aria-label="${esc(c.ko)}, 탭해서 뒤집기 / tap to flip">
        <div class="swipe-tag miss" aria-hidden="true">암기 못했어요<small>Not memorized</small></div>
        <div class="swipe-tag know" aria-hidden="true">암기했어요<small>Memorized</small></div>
        <div class="inner">
          <div class="face front${photo ? " photo" : ""}">
            ${artHtml(c, photo ? "art-photo" : "art-icon")}
            <div class="word">${esc(c.ko)}</div>
            <div class="hint">탭해서 뒤집기, 옆으로 밀어서 넘기기<br>Tap to flip, swipe to move on</div>
          </div>
          <div class="face back" aria-hidden="true">
            <div class="chip">${artHtml(c, "")}${esc(c.ko)}</div>
            <p class="meaning">${esc(c.en)}</p>
            <p class="note">${esc(c.note)}</p>
            ${ex}
          </div>
        </div>
      </button>`;
    const cardEl = card();
    cardEl.addEventListener("click", () => {
      if (suppressClick) { suppressClick = false; return; }
      flip();
    });
    attachSwipe(cardEl);
    preloadNext();
  }

  /* Swipe: left = 암기 못했어요, right = 암기했어요 */
  function attachSwipe(cardEl) {
    let startX = 0, startY = 0, dx = 0, active = false, dragging = false;
    const miss = cardEl.querySelector(".swipe-tag.miss");
    const know = cardEl.querySelector(".swipe-tag.know");
    const THRESHOLD = Math.min(110, window.innerWidth * 0.25);

    cardEl.addEventListener("pointerdown", e => {
      if (busy) return;
      active = true; dragging = false; dx = 0;
      startX = e.clientX; startY = e.clientY;
    });
    cardEl.addEventListener("pointermove", e => {
      if (!active) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
        dragging = true;
        cardEl.classList.add("dragging");
        try { cardEl.setPointerCapture(e.pointerId); } catch (err) {}
      }
      cardEl.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      const p = Math.min(Math.abs(dx) / THRESHOLD, 1);
      miss.style.opacity = dx < 0 ? p : 0;
      know.style.opacity = dx > 0 ? p : 0;
    });
    const end = () => {
      if (!active) return;
      active = false;
      if (!dragging) return;
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 50);
      cardEl.classList.remove("dragging");
      cardEl.style.transform = "";
      if (Math.abs(dx) >= THRESHOLD) answer(dx > 0);
      else miss.style.opacity = know.style.opacity = 0;
    };
    cardEl.addEventListener("pointerup", end);
    cardEl.addEventListener("pointercancel", end);
  }

  function flip() {
    const cardEl = card();
    if (!cardEl) return;
    const flipped = cardEl.classList.toggle("flipped");
    cardEl.querySelector(".front").setAttribute("aria-hidden", flipped);
    cardEl.querySelector(".back").setAttribute("aria-hidden", !flipped);
  }

  function renderRoundEnd() {
    const r = state.round;
    if (state.missed.length === 0) {
      stage.innerHTML = `
        <section class="panel">
          <div class="emoji"><span class="pop" data-act="party" role="button" aria-label="다시 축하하기 / Celebrate again">🎉</span></div>
          <h2>모두 외웠어요!</h2>
          <p class="sub-en">You memorized them all!</p>
          <p>${r}회차 만에 ${esc(deck.unit.ko)} ${total}개를 다 외웠어요.<span class="p-en">You memorized all ${total} ${esc(deck.unit.en)} in ${r} ${r === 1 ? "round" : "rounds"}.</span></p>
          <button class="btn known" data-act="restart" type="button"><span class="ko">처음부터 다시 하기</span><span class="en">Start again from the beginning</span></button>
          <a class="btn" href="#/"><span class="ko">다른 카드 보러 가기</span><span class="en">Try another deck</span></a>
        </section>`;
      stage.querySelector('[data-act="restart"]').addEventListener("click", restart);
      stage.querySelector('[data-act="party"]').addEventListener("click", celebrate);
      if (celebrateNext) { celebrateNext = false; setTimeout(celebrate, 150); }
    } else {
      const chips = state.missed.map(id => {
        const c = deck.cardById[id];
        return `<span class="c-${colorOf(deck, c)}">${esc(c.ko)}</span>`;
      }).join("");
      const left = state.missed.length;
      stage.innerHTML = `
        <section class="panel">
          <div class="emoji" aria-hidden="true">💪</div>
          <h2>${r}회차 끝!</h2>
          <p class="sub-en">Round ${r} done!</p>
          <p>이번에 ${state.learnedThisRound}개를 외웠어요. 아직 ${left}개가 남았어요.<span class="p-en">You memorized ${state.learnedThisRound} this time. ${left} still left.</span></p>
          <div class="missed">${chips}</div>
          <button class="btn known" data-act="next" type="button"><span class="ko">남은 ${left}개 다시 보기</span><span class="en">Review the ${left} left</span></button>
        </section>`;
      stage.querySelector('[data-act="next"]').addEventListener("click", nextRound);
    }
  }

  /* Confetti celebration */
  function celebrate() {
    if (reduceMotion) return;
    try { navigator.vibrate && navigator.vibrate([40, 60, 40]); } catch (e) {}
    const cv = document.createElement("canvas");
    cv.className = "confetti";
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);

    const colors = ["#FFC93C", "#FF7AA8", "#5ED3A8", "#6FA8FF", "#FF8A65", "#A98BFF"];
    const emojis = ["🎉", "💖", "⭐", "🥰", "🦋", "🌸"];
    const parts = [];
    const make = (x, y, vx, vy) => {
      const isEmoji = Math.random() < 0.14;
      parts.push({
        x, y, vx, vy,
        w: 6 + Math.random() * 6, h: 10 + Math.random() * 8,
        color: colors[(Math.random() * colors.length) | 0],
        emoji: isEmoji ? emojis[(Math.random() * emojis.length) | 0] : null,
        size: 20 + Math.random() * 10,
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.3,
        wob: Math.random() * Math.PI * 2
      });
    };
    const G = 0.25, base = Math.sqrt(2 * G * H);
    [[0, 1], [W, -1]].forEach(([x, dir]) => {
      for (let i = 0; i < 70; i++) {
        const a = -Math.PI / 2 + dir * (0.12 + Math.random() * 0.55);
        const sp = base * (0.7 + Math.random() * 0.4);
        make(x, H + 10, Math.cos(a) * sp, Math.sin(a) * sp);
      }
    });
    for (let i = 0; i < 40; i++) make(Math.random() * W, -20 - Math.random() * H * 0.5, (Math.random() - 0.5) * 2, 1 + Math.random() * 2);

    const DURATION = 4200, FADE = 900;
    const t0 = performance.now();
    function tick(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = t > DURATION - FADE ? Math.max(0, (DURATION - t) / FADE) : 1;
      for (const p of parts) {
        p.vy = Math.min(p.vy + G, 5.5);
        p.vx *= 0.985;
        p.wob += 0.08;
        p.x += p.vx + Math.sin(p.wob) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.emoji) {
          ctx.font = p.size + "px sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.wob)), p.w, p.h * Math.abs(Math.cos(p.wob)) + 1);
        }
        ctx.restore();
      }
      if (t < DURATION) requestAnimationFrame(tick); else cv.remove();
    }
    requestAnimationFrame(tick);
  }

  function render() {
    if (!alive) return;
    updateStatus();
    if (state.phase === "card") renderCard(); else renderRoundEnd();
  }

  function answer(known) {
    if (busy || state.phase !== "card") return;
    const id = state.queue[state.index];
    if (known) state.learnedThisRound++; else state.missed.push(id);
    state.index++;
    if (state.index >= state.queue.length) {
      state.phase = "end";
      if (state.missed.length === 0) celebrateNext = true;
    }
    save();

    const cardEl = card();
    if (cardEl && !reduceMotion) {
      busy = true;
      cardEl.classList.add(known ? "leave-right" : "leave-left");
      setTimeout(() => { busy = false; render(); }, 220);
    } else {
      render();
    }
  }

  function nextRound() {
    state = { queue: shuffle(state.missed), index: 0, round: state.round + 1, missed: [], learnedThisRound: 0, phase: "card" };
    save();
    render();
  }

  function restart() {
    state = freshState();
    save();
    render();
  }

  missBtn.addEventListener("click", () => answer(false));
  knowBtn.addEventListener("click", () => answer(true));
  root.querySelector('[data-act="reset"]').addEventListener("click", () => {
    if (confirm("진행 상황을 지우고 처음부터 시작할까요?\nClear your progress and start from the beginning?")) restart();
  });

  function onKey(e) {
    if (e.target.closest && e.target.closest("button, a") && (e.key === " " || e.key === "Enter")) return;
    if (state.phase !== "card") return;
    if (e.key === " ") { e.preventDefault(); flip(); }
    else if (e.key === "ArrowLeft") answer(false);
    else if (e.key === "ArrowRight") answer(true);
  }
  document.addEventListener("keydown", onKey);
  document.body.classList.add("studying");

  render();

  return function cleanup() {
    alive = false;
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("studying");
  };
};

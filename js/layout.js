/* ============================================================
   이 앱의 셸 설정.
   헤더·푸터의 마크업과 동작은 js/shell.js (달력 앱과 공유) 에 있다.
   여기서는 앱마다 다른 값만 넘긴다.
   ============================================================ */
YJ.config({
  home: "#/",
  ko: "한국어 카드",
  en: "Korean Word Cards",
  h1: false, // 화면마다 자기 <h1> 이 따로 있다
  nav: [
    { href: "#/", key: "home", ko: "카드", en: "Cards" },
    // 형제 앱. 한쪽만 걸려 있으면 묶음이 아니라 외딴 페이지로 보인다.
    { href: "https://tutoryoujin.github.io/calendar-practice/", ko: "한국어 달력", en: "Korean Calendar" },
    { href: "#/credits", key: "credits", ko: "이미지 출처", en: "Image credits" }
  ],
  tagline: { ko: "한 장씩, 매일 조금씩.", en: "Learn Korean, one card at a time." },
  legal:
    "Illustrations by Microsoft Fluent Emoji (MIT). Photos by Openverse contributors, used under " +
    "CC BY / CC BY-SA. Images remain the property of their respective owners."
});

/* 학습 화면은 카드에 집중하도록 헤더/푸터 없이 자체 상단바만 쓴다. */
KC.siteHeader = function siteHeader(active) {
  return YJ.header(active);
};

KC.siteFooter = function siteFooter() {
  return YJ.footer();
};

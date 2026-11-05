"""공통 파일을 생성하고 두 앱에 복사한다.

    .venv/Scripts/python tools/sync_shared.py           # 생성 + 복사
    .venv/Scripts/python tools/sync_shared.py --check   # 어긋났는지만 확인 (CI용)

흐름:

    디자인 시스템 아티팩트            ← 사람이 고치는 곳
      ↓ (손으로 내려받아 교체)
    shared/tokens.json
      ↓ (이 스크립트가 생성)
    shared/tokens.css
      ↓ (이 스크립트가 복사)
    cards/css/tokens.css  ·  calendar/css/tokens.css

shared/shell.css 와 shared/shell.js 는 생성물이 아니라 원본이다.
여기서 고치고 이 스크립트를 돌린다.

달력 저장소는 이 저장소 옆에 있다고 가정한다 (materials/cards,
materials/calendar). 없으면 카드 쪽만 갱신하고 넘어간다.
"""
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED = os.path.join(ROOT, "shared")
SIBLING = os.path.normpath(os.path.join(ROOT, "..", "calendar"))

# 공통 파일 -> 각 앱에서의 자리
TARGETS = {
    "tokens.css": "css/tokens.css",
    "shell.css": "css/shell.css",
    "shell.js": "js/shell.js",
}

BANNER = """/* ────────────────────────────────────────────────────────────
   {name} — 복사본. 여기서 고치지 말 것.

   원본: korean-cards/shared/{name}
   고친 뒤  python tools/sync_shared.py  를 돌리면 두 앱에 퍼진다.
   sha256 {sha}
   ──────────────────────────────────────────────────────────── */
"""


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


# ---------------------------------------------------------------- tokens.css

def css_block(tokens, theme, indent):
    """tokens.json 의 색 토큰을 CSS 선언 줄로. theme 은 light | dark."""
    out = []
    for group, head in SECTIONS:
        rows = [t for t in tokens if t["name"] in group]
        if not rows:
            continue
        lines = []
        for t in rows:
            v = t["value"]
            if isinstance(v, str):          # "{other-token}" 별칭
                if theme != "light":
                    continue                # 별칭은 라이트 블록에서 한 번만
                v = "var(--%s)" % v.strip("{}")
            else:
                v = v[theme]
            lines.append("%s--%s: %s;" % (indent, t["name"], v))
        if not lines:                       # 다크에서 통째로 빠지는 묶음
            continue
        out.append("%s/* %s */" % (indent, head))
        out.extend(lines)
        out.append("")
    return "\n".join(out).rstrip()


ACCENTS = ["blue", "pink", "yellow", "mint", "lavender", "coral", "orange", "gray"]
SECTIONS = [
    (["bg", "surface", "ink", "muted", "line", "primary", "primary-ink", "sky", "sky-ink"],
     "바탕과 글자"),
    ([a + s for a in ACCENTS for s in ("-bg", "-ink")],
     "악센트 8쌍 — -bg 와 -ink 는 쌍이다. 섞으면 한쪽 테마에서 글자가 안 보인다"),
    (["ieung-body", "ieung-limb", "ieung-face", "ieung-blush"],
     "마스코트 이응 — 다크에서도 밝게 남는다. blue-bg 의 별칭이 아니다"),
    (["sun", "sat", "special"], "달력 전용"),
    ([t for t in ("cal-year", "cal-month", "cal-day", "cal-week", "ok", "bad")
      for t in (t + "-bg", t + "-ink")],
     "뜻 이름은 별칭이다. 여기에 hex 를 다시 적지 말 것"),
]


def build_tokens_css():
    data = json.loads(read(os.path.join(SHARED, "tokens.json")))
    colors = data["color"]["tokens"]
    scalars = [
        ("글꼴 — Nunito 가 영문·숫자, Jua 가 한글을 맡는다 (한 스택에서 글자별로 분기)", [
            ('--font-app', '"Nunito", "Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'),
            ('--font-display', '"Jua", "Nunito", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'),
            ('--font-reading', '"Pretendard Variable", Pretendard, -apple-system, '
                               'BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", '
                               'system-ui, sans-serif'),
        ]),
        ("간격", [("--" + t["name"], t["value"]) for t in data["spacing"]["tokens"]]),
        ("모서리", [("--" + t["name"], t["value"]) for t in data["radius"]["tokens"]]),
    ]
    shadows = {t["name"]: t["value"] for t in data["shadow"]["tokens"]}

    def scalar_block(indent):
        out = []
        for head, rows in scalars:
            out.append("%s/* %s */" % (indent, head))
            for k, v in rows:
                out.append("%s%s: %s;" % (indent, k, v))
            out.append("")
        return "\n".join(out).rstrip()

    def shadow_block(theme, indent):
        return "\n".join(
            "%s--%s: %s;" % (indent, k, v[theme]) for k, v in shadows.items())

    body = '''/* 한국어 with Youjin — 디자인 시스템 토큰.

   shared/tokens.json 에서 tools/sync_shared.py 가 생성한다. 직접 고치지 말 것.
   값을 바꾸려면 디자인 시스템 아티팩트에서 고치고 tokens.json 을 교체한 뒤
   스크립트를 다시 돌린다.
   https://claude.ai/artifact/C1LfGgisHTtDbmy7NyoUtF

   다크는 세 상태를 전부 정의한다. @media 안에만 있는 색이 하나라도 있으면
   사용자가 테마를 직접 고른 순간 그 색만 빠진다. */
:root {
%s

%s

  /* 그림자 — folder 는 위쪽으로 드리운다 */
%s

  color-scheme: light;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
%s

%s
    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
%s

%s
  color-scheme: dark;
}
''' % (css_block(colors, "light", "  "), scalar_block("  "), shadow_block("light", "  "),
       css_block(colors, "dark", "    "), shadow_block("dark", "    "),
       css_block(colors, "dark", "  "), shadow_block("dark", "  "))
    return body


# ---------------------------------------------------------------- sync

def main():
    check = "--check" in sys.argv
    generated = {"tokens.css": build_tokens_css()}

    problems = []

    # 1. 생성물이 shared/ 안의 것과 같은지
    for name, text in generated.items():
        path = os.path.join(SHARED, name)
        if check:
            if not os.path.exists(path) or read(path) != text:
                problems.append("shared/%s 가 tokens.json 과 어긋남" % name)
        else:
            write(path, text)
            print("generated shared/%s" % name)

    # 2. 두 앱의 복사본이 shared/ 와 같은지
    apps = [("cards", ROOT)]
    if os.path.isdir(os.path.join(SIBLING, ".git")):
        apps.append(("calendar", SIBLING))
    else:
        print("note: %s 가 없어 카드 쪽만 본다" % SIBLING)

    for name, rel in TARGETS.items():
        src = os.path.join(SHARED, name)
        if not os.path.exists(src):
            problems.append("shared/%s 가 없음" % name)
            continue
        body = read(src)
        stamped = BANNER.format(name=name, sha=sha(body)) + body
        for app, base in apps:
            dst = os.path.join(base, rel)
            if check:
                if not os.path.exists(dst) or read(dst) != stamped:
                    problems.append("%s/%s 가 shared/%s 와 어긋남" % (app, rel, name))
            else:
                write(dst, stamped)
                print("copied  %s/%s" % (app, rel))

    if check:
        if problems:
            print("\n어긋난 곳:")
            for p in problems:
                print("  -", p)
            print("\n고치려면: python tools/sync_shared.py")
            sys.exit(1)
        print("공통 파일 동기 상태 OK")


main()

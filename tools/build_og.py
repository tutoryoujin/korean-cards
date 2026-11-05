"""Render the Open Graph share image -> img/og.png (1200x630).

Usage:
    python3 -m venv .venv && .venv/bin/pip install Pillow
    .venv/bin/python tools/build_og.py

A fanned deck of three mini flip-cards (real card art from img/emotions/)
on the site palette, next to the title. Fonts (Jua, Nunito) are downloaded
once into tools/.fontcache/ — that folder is gitignored, the PNG is committed.
"""
import os, urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", ".fontcache")
OUT = os.path.join(ROOT, "img", "og.png")

W, H = 1200, 630
S = 2  # supersample factor — render 2x, downscale at the end

FONTS = {
    "Jua-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/jua/Jua-Regular.ttf",
    "Nunito.ttf": "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito%5Bwght%5D.ttf",
}

# css/app.css tokens (light theme)
BG = (238, 241, 248)
INK = (38, 48, 74)
MUTED = (107, 117, 144)
PRIMARY = (53, 80, 200)
SURFACE = (255, 255, 255)
LINE = (216, 222, 235)
GROUP = {
    "yellow": (255, 233, 168),
    "pink": (255, 211, 226),
    "mint": (205, 239, 226),
    "lavender": (226, 218, 250),
}

# fanned deck: (card art, label, group color, center x, center y, rotation)
CARDS = [
    ("emotions/pyeonanhaeyo", "편안해요", "mint", 712, 352, 10, 0.92),
    ("emotions/dugeungeoryeoyo", "두근거려요", "pink", 1058, 352, -10, 0.92),
    ("emotions/haengbokhaeyo", "행복해요", "yellow", 885, 300, -1, 1.0),
]


def font(name, size):
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        req = urllib.request.Request(FONTS[name], headers={"User-Agent": "korean-cards/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            open(path, "wb").write(r.read())
    f = ImageFont.truetype(path, size)
    if name == "Nunito.ttf":  # variable font — pin the weight
        try:
            f.set_variation_by_axes([800])
        except Exception:
            pass
    return f


def backdrop(size):
    """Near-white vertical wash + a few airy pastel glows."""
    w, h = size
    img = Image.new("RGBA", size, (255, 255, 255, 255))
    grad = Image.new("L", (1, h))
    for y in range(h):
        grad.putpixel((0, y), int(255 - 26 * (y / h)))  # subtle top->bottom cool-down
    img.paste(Image.new("RGBA", size, (232, 237, 249, 255)),
              (0, 0), ImageOps.invert(grad.resize(size)))

    # anchored just outside the corners, so only the edges tint and the
    # middle stays near-white (overlapping pastels turn gray fast)
    glows = [  # (cx%, cy%, r, rgb, alpha)
        (.80, -.16, 300, (255, 226, 146), 210),
        (1.10, .92, 300, (255, 192, 216), 210),
        (-.10, 1.02, 290, (182, 236, 214), 185),
        (-.09, -.10, 280, (203, 216, 255), 195),
    ]
    for fx, fy, r, rgb, a in glows:
        r *= S
        cx, cy = int(w * fx), int(h * fy)
        layer = Image.new("RGBA", size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgb + (a,))
        img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(r * 0.32)))
    return img


def sparkles(img):
    """Tiny confetti dots — just enough to feel playful."""
    d = ImageDraw.Draw(img, "RGBA")
    dots = [(126, 486, 9, (255, 196, 218)), (196, 540, 6, (255, 214, 120)),
            (64, 436, 5, (150, 188, 250)), (560, 172, 7, (255, 200, 140)),
            (614, 104, 5, (150, 220, 196)), (1148, 120, 8, (216, 206, 250)),
            (676, 566, 6, (255, 196, 218)), (96, 142, 6, (255, 214, 120))]
    for x, y, r, rgb in dots:
        x, y, r = x * S, y * S, r * S
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgb + (205,))


def mini_card(art, label, color, w, h):
    """One flip-card: white surface, pastel art panel, Korean label."""
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    pad, radius = 11 * S, 34 * S
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=SURFACE, outline=LINE, width=2 * S)

    panel = (pad, pad, w - pad, h - 62 * S)
    d.rounded_rectangle(panel, radius - 9 * S, fill=GROUP[color])

    im = Image.open(os.path.join(ROOT, "img", art + ".webp")).convert("RGBA")
    box = int((panel[3] - panel[1]) * 0.76)
    im.thumbnail((box, box), Image.LANCZOS)
    card.alpha_composite(im, ((w - im.width) // 2,
                              (panel[1] + panel[3] - im.height) // 2))

    f = font("Jua-Regular.ttf", 29 * S)
    d.text(((w) // 2, h - 34 * S), label, font=f, fill=INK, anchor="mm")
    return card


def drop(canvas, shape, cx, cy, blur, dy, alpha):
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    solid = Image.new("RGBA", shape.size, (31, 40, 63, alpha))
    sh.paste(solid, (cx - shape.width // 2, cy - shape.height // 2 + dy), shape)
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))


def main():
    w, h = W * S, H * S
    img = backdrop((w, h))
    sparkles(img)

    # ---- text block -------------------------------------------------
    d = ImageDraw.Draw(img)
    x = 78 * S
    lines = [
        (232, "한국어 카드", "Jua-Regular.ttf", 98, INK),
        (288, "Korean Cards with Youjin", "Nunito.ttf", 38, PRIMARY),
        (356, "뒤집으며 외우는 한국어 단어", "Jua-Regular.ttf", 31, MUTED),
        (398, "Flip, guess, repeat.", "Nunito.ttf", 26, MUTED),
    ]
    for y, text, fam, size, fill in lines:
        f = font(fam, size * S)
        d.text((x, y * S), text, font=f, fill=fill, anchor="ls")
        right = x / S + d.textlength(text, font=f) / S
        if right > 600:
            print(f"  warn: '{text}' reaches x={right:.0f} (deck starts ~600)")

    # ---- fanned deck ------------------------------------------------
    for art, label, color, cx, cy, rot, scale in CARDS:
        cw, ch = int(222 * scale) * S, int(278 * scale) * S
        card = mini_card(art, label, color, cw, ch).rotate(rot, Image.BICUBIC, expand=True)
        drop(img, card.getchannel("A"), cx * S, cy * S, 26 * S, 16 * S, 90)
        img.alpha_composite(card, (cx * S - card.width // 2, cy * S - card.height // 2))

    img.convert("RGB").resize((W, H), Image.LANCZOS).save(OUT, optimize=True)
    print("wrote", os.path.relpath(OUT, ROOT), os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()

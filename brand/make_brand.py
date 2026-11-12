"""Builds every handfeel brand asset from code. Change this file, run it, never touch the PNGs.

    python3 brand/make_brand.py

Needs: uharfbuzz, fonttools (pip) and resvg (brew install resvg).
Text is converted to outlines, so the SVGs render the same everywhere.
"""
from __future__ import annotations

import math
import subprocess
from functools import cache
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent
FONT = ROOT / "fonts" / "Bricolage.ttf"

C = {
    "ink": "#151412",        # dark ground, text on light
    "ink_2": "#1E1C19",      # raised surface on dark
    "ink_line": "#33302B",
    "paper": "#F4F1EA",      # light ground, text on dark
    "paper_2": "#E9E4D8",
    "clay": "#E0592A",       # the touch point. Large shapes and text on dark only
    "clay_text": "#A6401B",  # clay for text and links on light
    "muted_dark": "#A49E93", # secondary text on ink
    "muted_light": "#68625A",# secondary text on paper
}

FACES = {
    "display": {"wght": 700, "opsz": 96, "wdth": 100},
    "title": {"wght": 600, "opsz": 48, "wdth": 100},
    "text": {"wght": 450, "opsz": 14, "wdth": 100},
    "text_medium": {"wght": 550, "opsz": 14, "wdth": 100},
}

# ---------------------------------------------------------------- text to outlines


@cache
def _font(face: str) -> hb.Font:
    f = hb.Font(hb.Face(FONT.read_bytes()))
    f.set_variations(FACES[face])
    return f


def text(s: str, x: float, y: float, size: float, face: str = "text", fill: str = "#000",
         tracking: float = 0.0, anchor: str = "start") -> tuple[str, float]:
    """(<path>, width). y is the baseline, tracking in em."""
    font = _font(face)
    upem = font.face.upem
    buf = hb.Buffer()
    buf.add_str(s)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True})
    k = size / upem
    track = tracking * upem
    width = sum(p.x_advance + track for p in buf.glyph_positions) - (track if s else 0)
    if anchor == "middle":
        x -= width * k / 2
    elif anchor == "end":
        x -= width * k
    pen = SVGPathPen(None, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    cx = 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        t = TransformPen(pen, (k, 0, 0, -k, x + (cx + pos.x_offset) * k, y - pos.y_offset * k))
        font.draw_glyph_with_pen(info.codepoint, t)
        cx += pos.x_advance + track
    return f'<path d="{pen.getCommands()}" fill="{fill}"/>', width * k


def cap_height(face: str = "display") -> float:
    font = _font(face)
    gid = font.get_nominal_glyph(ord("h"))
    return font.get_glyph_extents(gid).y_bearing / font.face.upem


# ---------------------------------------------------------------- the mark
# 64-unit grid. A fingertip (dot) and the response to it (an open ring).
# The ring opens toward the bottom right, where a right thumb comes from.

CX, CY = 32.0, 32.0
DOT_R = 9.5
RING_R = 22.0
RING_W = 7.0
GAP_CENTER = 45.0  # degrees, y-down: bottom-right
GAP = 64.0
MARK_BOX = (CX - RING_R - RING_W / 2, CY - RING_R - RING_W / 2, CX + RING_R + RING_W / 2, CY + RING_R + RING_W / 2)


def _pt(deg: float, r: float) -> tuple[float, float]:
    a = math.radians(deg)
    return CX + r * math.cos(a), CY + r * math.sin(a)


def mark(ring: str, dot: str, x: float = 0, y: float = 0, s: float = 1) -> str:
    a0 = GAP_CENTER + GAP / 2
    a1 = GAP_CENTER - GAP / 2 + 360
    (x0, y0), (x1, y1) = _pt(a0, RING_R), _pt(a1, RING_R)
    arc = (f'<path d="M{x0:.3f} {y0:.3f}A{RING_R} {RING_R} 0 1 1 {x1:.3f} {y1:.3f}" fill="none" '
           f'stroke="{ring}" stroke-width="{RING_W}" stroke-linecap="round"/>')
    return (f'<g transform="translate({x:.2f} {y:.2f}) scale({s:.4f})">{arc}'
            f'<circle cx="{CX}" cy="{CY}" r="{DOT_R}" fill="{dot}"/></g>')


def mark_fit(ring: str, dot: str, cx: float, cy: float, h: float) -> str:
    x0, y0, x1, y1 = MARK_BOX
    s = h / (y1 - y0)
    return mark(ring, dot, cx - (x0 + x1) / 2 * s, cy - (y0 + y1) / 2 * s, s)


def lockup(x: float, y: float, h: float, ring: str, dot: str, word: str) -> tuple[str, float]:
    """Mark + wordmark. (x, y) top-left of the mark box, h = mark height. Returns (svg, width)."""
    x0, y0, x1, y1 = MARK_BOX
    s = h / (y1 - y0)
    parts = [mark(ring, dot, x - x0 * s, y - y0 * s, s)]
    # the x-height band of the wordmark sits on the mark's centre line
    asc = 0.72 * h
    size = asc / cap_height()
    baseline = y + h / 2 + asc / 2 - 0.02 * h
    gap = 0.30 * h
    path, w = text("handfeel", x + (x1 - x0) * s + gap, baseline, size, "display", word, tracking=-0.025)
    parts.append(path)
    return "".join(parts), (x1 - x0) * s + gap + w


def svg(w: float, h: float, body: str, bg: str | None = None, label: str = "handfeel") -> str:
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'role="img" aria-label="{label}">{rect}{body}</svg>\n')


def write(rel: str, content: str, png_width: int | None = None) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    if png_width:
        subprocess.run(["resvg", "-w", str(png_width), str(path), str(path.with_suffix(".png"))], check=True)
    print(rel)


# ---------------------------------------------------------------- assets


def logos() -> None:
    write("logo/mark-light.svg", svg(64, 64, mark(C["ink"], C["clay"])))
    write("logo/mark-dark.svg", svg(64, 64, mark(C["paper"], C["clay"])))
    write("logo/mark-ink.svg", svg(64, 64, mark(C["ink"], C["ink"])))
    for mode, bg, ring, word in (("light", None, C["ink"], C["ink"]), ("dark", None, C["paper"], C["paper"])):
        body, w = lockup(8, 8, 48, ring, C["clay"], word)
        write(f"logo/lockup-{mode}.svg", svg(round(w + 16), 64, body))


def favicons() -> None:
    tile = lambda size, r: (f'<rect width="{size}" height="{size}" rx="{r}" fill="{C["ink"]}"/>'
                            + mark_fit(C["paper"], C["clay"], size / 2, size / 2, size * 0.64))
    write("favicon/favicon.svg", svg(64, 64, tile(64, 14)), 32)
    write("favicon/apple-touch-icon.svg", svg(180, 180, tile(180, 0)), 180)
    write("favicon/icon-512.svg", svg(512, 512, tile(512, 0)), 512)
    write("banners/x-avatar.svg", svg(400, 400, f'<rect width="400" height="400" fill="{C["ink"]}"/>'
                                                + mark_fit(C["paper"], C["clay"], 200, 200, 230)), 400)


def social_preview() -> None:
    W, H = 1280, 640
    body = [f'<rect width="{W}" height="{H}" fill="{C["ink"]}"/>']
    lk, _ = lockup(96, 96, 72, C["paper"], C["clay"], C["paper"])
    body.append(lk)
    y = 330
    for line in ("Find the AI look", "in your mobile app."):
        p, _ = text(line, 96, y, 76, "display", C["paper"], tracking=-0.025)
        body.append(p)
        y += 88
    for i, line in enumerate(("Scanner and agent skill for Expo, React Native,", "Flutter, SwiftUI and Jetpack Compose.")):
        p, _ = text(line, 96, 526 + i * 36, 26, "text", C["muted_dark"])
        body.append(p)
    # a phone on the right, the mark pressing into its glass
    body.append(f'<rect x="1000" y="150" width="330" height="560" rx="64" fill="{C["ink_2"]}" stroke="{C["ink_line"]}" stroke-width="2"/>')
    body.append(mark_fit(C["paper"], C["clay"], 1140, 360, 140))
    write("banners/social-preview.svg", svg(W, H, "".join(body)), W)


def x_header() -> None:
    W, H = 1500, 500
    body = [f'<rect width="{W}" height="{H}" fill="{C["ink"]}"/>']
    p, _ = text("Apps that feel right in the hand.", 520, 268, 54, "display", C["paper"], tracking=-0.02)
    body.append(p)
    p, _ = text("npx handfeel scan .", 520, 332, 28, "text_medium", C["clay"])
    body.append(p)
    body.append(mark_fit(C["paper"], C["clay"], 1330, 250, 170))
    write("banners/x-header.svg", svg(W, H, "".join(body)), W)


def readme_banner() -> None:
    W, H = 1280, 320
    for mode, bg, fg, muted in (("dark", C["ink"], C["paper"], C["muted_dark"]), ("light", C["paper"], C["ink"], C["muted_light"])):
        body = [f'<rect width="{W}" height="{H}" rx="24" fill="{bg}"/>']
        lk, w = lockup(72, 96, 64, fg, C["clay"], fg)
        body.append(lk)
        p, _ = text("Find the AI look in your mobile app.", 72, 236, 34, "title", fg, tracking=-0.01)
        body.append(p)
        p, _ = text("Expo · React Native · Flutter · SwiftUI · Jetpack Compose", 72, 278, 22, "text", muted)
        body.append(p)
        write(f"banners/readme-banner-{mode}.svg", svg(W, H, "".join(body)), W)


def brand_sheet() -> None:
    W, H = 1200, 720
    body = [f'<rect width="{W}" height="{H}" fill="{C["paper"]}"/>']
    lk, _ = lockup(60, 60, 56, C["ink"], C["clay"], C["ink"])
    body.append(lk)
    body.append(f'<rect x="760" y="40" width="400" height="200" rx="24" fill="{C["ink"]}"/>')
    lk, _ = lockup(800, 112, 56, C["paper"], C["clay"], C["paper"])
    body.append(lk)
    x = 60
    for name in ("ink", "paper", "clay", "clay_text", "muted_light", "muted_dark"):
        stroke = f' stroke="{C["paper_2"]}" stroke-width="2"' if name == "paper" else ""
        body.append(f'<rect x="{x}" y="300" width="160" height="160" rx="16" fill="{C[name]}"{stroke}/>')
        p, _ = text(name, x, 492, 18, "text_medium", C["ink"])
        body.append(p)
        p, _ = text(C[name], x, 518, 16, "text", C["muted_light"])
        body.append(p)
        x += 180
    for i, size in enumerate((64, 32, 16)):
        body.append(mark_fit(C["ink"], C["clay"], 90 + i * 110, 640, size))
    p, _ = text("Bricolage Grotesque, one family, SIL OFL", 440, 650, 22, "text", C["ink"])
    body.append(p)
    write("_brand-sheet.svg", svg(W, H, "".join(body)), W)


def contrast(a: str, b: str) -> float:
    def lum(h: str) -> float:
        rgb = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
        return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
    l1, l2 = sorted((lum(a), lum(b)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


if __name__ == "__main__":
    logos()
    favicons()
    social_preview()
    x_header()
    readme_banner()
    brand_sheet()
    for fg, bg in (("paper", "ink"), ("clay", "ink"), ("clay_text", "paper"), ("muted_light", "paper"), ("muted_dark", "ink"), ("clay", "paper")):
        print(f"contrast {fg} on {bg}: {contrast(C[fg], C[bg]):.1f}:1")

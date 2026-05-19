"""
이음사주 앱 아이콘 생성기.
토스 콘솔 요건: 꽉 찬 사각형 PNG, 배경색 포함, 크롭 X.

Output: 1024x1024 PNG (자동 다운스케일은 토스 측에서 처리).
"""
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
OUTPUT = "/Users/choijihoon/ieum-saju-toss/assets/icon.png"

import os
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def lerp(a, b, t):
    return tuple(int(av + (bv - av) * t) for av, bv in zip(a, b))


def radial_orb(size: int, center_color: str, edge_color: str, alpha: int = 255) -> Image.Image:
    """원형 라디얼 그라데이션 만들기 (중심부터 가장자리로)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    cx = cy = size / 2
    r_max = size / 2
    c_in = hex_rgb(center_color)
    c_out = hex_rgb(edge_color)
    for y in range(size):
        for x in range(size):
            dx = x - cx
            dy = y - cy
            d = (dx * dx + dy * dy) ** 0.5
            if d > r_max:
                px[x, y] = (0, 0, 0, 0)
                continue
            t = d / r_max
            # 중심부 강한 하이라이트 (cx 0.35 cy 0.35 효과)
            t_smooth = t * t  # 가장자리쪽으로 더 빠르게 어두워지게
            r, g, b = lerp(c_in, c_out, t_smooth)
            px[x, y] = (r, g, b, alpha)
    return img


def make_icon():
    # 배경: 부드러운 라벤더 → 피치 그라데이션 (대각선)
    bg_top = hex_rgb("#F2EBFF")      # 라벤더 cream
    bg_bot = hex_rgb("#FFE9DD")      # 피치 cream
    bg = Image.new("RGB", (SIZE, SIZE), bg_top)
    px = bg.load()
    for y in range(SIZE):
        t = y / SIZE
        c = lerp(bg_top, bg_bot, t)
        for x in range(SIZE):
            px[x, y] = c

    # 라벤더·피치 orb — 충분히 크게
    orb_size = int(SIZE * 0.58)  # 직경 ~594px
    lavender = radial_orb(orb_size, "#E5D9FF", "#9D7BFF")
    peach    = radial_orb(orb_size, "#FFD9CC", "#FF8B6C", alpha=240)

    out = bg.convert("RGBA")

    # orb 배치 (중앙 정렬, 자연스럽게 겹치게)
    cx = SIZE / 2
    cy = SIZE / 2
    overlap = orb_size * 0.35
    lav_x = int(cx - orb_size + overlap // 2)
    pch_x = int(cx - overlap // 2)
    orb_y = int(cy - orb_size / 2)

    out.alpha_composite(lavender, (lav_x, orb_y))
    out.alpha_composite(peach,    (pch_x, orb_y))

    # 중앙 골드 스파클 + glow
    sparkle = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sparkle)
    sr = int(SIZE * 0.032)
    sd.ellipse(
        [cx - sr, cy - sr, cx + sr, cy + sr],
        fill=hex_rgb("#FFC857"),
    )
    glow = sparkle.filter(ImageFilter.GaussianBlur(radius=28))
    out = Image.alpha_composite(out, glow)
    out = Image.alpha_composite(out, sparkle)

    # 최종은 RGB (투명도 X) — 토스 요건
    final = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    final.paste(out, (0, 0), out)

    final.save(OUTPUT, "PNG", optimize=True)
    print(f"✅ 아이콘 생성 완료: {OUTPUT}")
    print(f"   크기: {SIZE}×{SIZE} RGB PNG (투명도 없음, 꽉 찬 사각형)")


if __name__ == "__main__":
    make_icon()

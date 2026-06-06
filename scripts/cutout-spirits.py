#!/usr/bin/env python3
"""흰 배경 정령 PNG → 투명(RGBA) 변환.

루트 {계열}{동물}/*.png (흰 배경) → public/spirits/{계열}{동물}/*.png (투명).
테두리 연결 flood-fill: 네 모서리에서 흰색을 sentinel(마젠타)로 채운 뒤
sentinel 픽셀만 알파 0으로. 캐릭터 내부 흰색(눈 하이라이트 등)은 보존.
numpy 불필요 — Pillow의 C-backed floodfill / point / ImageChops 사용.

원본(루트 디렉터리)은 건드리지 않는다. 이미 투명한 PNG는 그대로 통과(idempotent).

사용:
  python3 scripts/cutout-spirits.py            # 전체
  python3 scripts/cutout-spirits.py 새싹쥐      # 한 세트만 (드라이런용)
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = ROOT / "public" / "spirits"
LINES = ["새싹", "노을", "언덕", "달빛", "이슬"]
ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"]

SENTINEL = (255, 0, 255)  # 배경 채울 임시색 (셀셰이딩 캐릭터엔 거의 없는 마젠타)
THRESH = 36               # 근접 흰색 허용치(안티앨리어싱 경계 포함). 흰테 남으면 ↑


def is_already_transparent(img: "Image.Image") -> bool:
    """알파 채널 최소값이 255 미만이면 이미 투명 영역이 있다고 간주."""
    if "A" not in img.getbands():
        return False
    lo, _ = img.getchannel("A").getextrema()
    return lo < 255


def cutout(src_path: Path) -> "Image.Image":
    img = Image.open(src_path).convert("RGBA")
    if is_already_transparent(img):
        return img  # 외부 투명본 등은 그대로 통과
    rgb = img.convert("RGB")
    w, h = rgb.size
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(rgb, corner, SENTINEL, thresh=THRESH)
    r, g, b = rgb.split()
    mr = r.point(lambda v: 255 if v == SENTINEL[0] else 0)
    mg = g.point(lambda v: 255 if v == SENTINEL[1] else 0)
    mb = b.point(lambda v: 255 if v == SENTINEL[2] else 0)
    bg = ImageChops.multiply(ImageChops.multiply(mr, mg), mb)  # 255 = 배경
    alpha = ImageChops.invert(bg)                              # 0 = 배경(투명)
    out = img.copy()
    out.putalpha(alpha)
    return out


def main() -> None:
    only = sys.argv[1] if len(sys.argv) > 1 else None
    total = 0
    for line in LINES:
        for animal in ANIMALS:
            name = f"{line}{animal}"
            if only and only != name:
                continue
            src_dir = ROOT / name
            if not src_dir.is_dir():
                continue
            pngs = sorted(src_dir.glob("*.png"))
            if not pngs:
                continue
            out_dir = OUT_ROOT / name
            out_dir.mkdir(parents=True, exist_ok=True)
            for p in pngs:
                cutout(p).save(out_dir / p.name)
                total += 1
            print(f"  ✓ {name}: {len(pngs)} files")
    print(f"누끼 완료: {total} files → {OUT_ROOT}")


if __name__ == "__main__":
    main()

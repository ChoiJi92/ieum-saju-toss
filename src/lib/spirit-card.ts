import type { Spirit, Stage } from './spirit';
import { STAGE_LABEL } from './spirit';

/**
 * 내 정령 카드 — canvas로 공유용 이미지 생성 후 Web Share(파일) 또는 다운로드 폴백.
 * 코스모스 배경 + 정령 이미지 + 이름/등급/공식 + 오늘 한 줄. 720×960(3:4).
 */

const W = 720;
const H = 960;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 긴 문장을 maxWidth 기준 줄바꿈 (최대 maxLines줄, 초과 시 …) */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    } else cur = test;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && cur && lines[maxLines - 1] !== cur) lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…';
  return lines;
}

async function drawCard(spirit: Spirit, stage: Stage, oneLine?: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 배경 — 코스모스 그라데이션
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2A2046');
  bg.addColorStop(0.55, '#1E1635');
  bg.addColorStop(1, '#14101F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 별
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.8 + 0.5;
    ctx.globalAlpha = Math.random() * 0.6 + 0.25;
    ctx.fillStyle = Math.random() > 0.8 ? '#FFD27A' : Math.random() > 0.5 ? '#B79CFF' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 정령 후광
  const glow = ctx.createRadialGradient(W / 2, 360, 40, W / 2, 360, 270);
  glow.addColorStop(0, `${spirit.elem.raw}55`);
  glow.addColorStop(0.6, `${spirit.elem.raw}18`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 60, W, 620);

  // 정령 이미지 (없으면 이모지)
  const src = spirit.imageFor(stage);
  const img = src ? await loadImage(src) : null;
  if (img) {
    const size = 420;
    ctx.drawImage(img, (W - size) / 2, 150, size, size);
  } else {
    ctx.font = '220px serif';
    ctx.textAlign = 'center';
    ctx.fillText(spirit.zod.emoji, W / 2, 430);
  }

  ctx.textAlign = 'center';

  // 등급 별 + 라벨
  const stars = '★'.repeat(spirit.rarity.stars) + '☆'.repeat(4 - spirit.rarity.stars);
  ctx.font = '700 30px -apple-system, sans-serif';
  ctx.fillStyle = spirit.rarity.raw;
  ctx.fillText(`${stars}  ${spirit.rarity.ko}`, W / 2, 642);

  // 이름
  ctx.font = '800 64px -apple-system, sans-serif';
  ctx.fillStyle = '#F4EFFF';
  ctx.fillText(spirit.name, W / 2, 722);

  // 공식 (土토 + 쥐(子)) + 단계
  ctx.font = '700 26px -apple-system, sans-serif';
  ctx.fillStyle = '#FFD27A';
  ctx.fillText(`${spirit.formula} · ${STAGE_LABEL[stage]} 정령`, W / 2, 766);

  // 오늘 한 줄 (말풍선 카드) — 푸터와 겹치지 않게 위쪽 배치 (최대 2줄 = y896에서 끝)
  if (oneLine) {
    ctx.font = '600 25px -apple-system, sans-serif';
    const lines = wrapText(ctx, oneLine, W - 200, 2);
    const boxY = 786;
    const boxH = 38 + lines.length * 36;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, 70, boxY, W - 140, boxH, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 70, boxY, W - 140, boxH, 22);
    ctx.stroke();
    ctx.fillStyle = '#CFC4E8';
    lines.forEach((ln, i) => ctx.fillText(ln, W / 2, boxY + 44 + i * 36));
  }

  // 푸터 — 한 줄 박스 최대 하단(896)과 충분한 간격
  ctx.font = '700 22px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244,239,255,0.45)';
  ctx.fillText('이음사주 ✦ 나의 사주 정령', W / 2, H - 20);

  return canvas;
}

export type ShareResult = 'shared' | 'downloaded' | 'failed';

/** 정령 카드 생성 → 공유(지원 시) 또는 PNG 다운로드 폴백 */
export async function shareSpiritCard(spirit: Spirit, stage: Stage, oneLine?: string): Promise<ShareResult> {
  try {
    const canvas = await drawCard(spirit, stage, oneLine);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return 'failed';
    const file = new File([blob], `${spirit.name}-정령카드.png`, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: '내 사주 정령', text: `${spirit.name} — ${spirit.rarity.ko} 정령 ✦ 이음사주` });
        return 'shared';
      } catch {
        // 사용자가 공유 시트를 닫은 경우 등 → 다운로드 폴백 없이 조용히 종료
        return 'failed';
      }
    }
    // 폴백: 다운로드
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

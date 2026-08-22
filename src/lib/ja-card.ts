import type { Spirit, Stage } from './spirit';
import type { ShareResult } from './spirit-card';
import { spiritNameJa, titleJa, personaJa, RARITY_JA } from './i18n-ja';

/**
 * 일본어 공유 카드 — 720×960(3:4). spirit-card 와 동일한 canvas → Web Share/다운로드 폴백 구조.
 * 카피는 일본어, 브랜드는 "韓国の四柱推命"으로 출신을 명시한다.
 */

const W = 720;
const H = 960;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 일본어는 어절 공백이 없어 글자 단위 줄바꿈 */
function wrapJa(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
      if (lines.length === maxLines) break;
    } else cur += ch;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  return lines;
}

async function drawCard(spirit: Spirit, stage: Stage): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2A2046');
  bg.addColorStop(0.55, '#1E1635');
  bg.addColorStop(1, '#14101F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

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

  // 계열 후광
  const glow = ctx.createRadialGradient(W / 2, 340, 40, W / 2, 340, 280);
  glow.addColorStop(0, `${spirit.elem.raw}55`);
  glow.addColorStop(0.6, `${spirit.elem.raw}18`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 60, W, 620);

  const src = spirit.imageFor(stage);
  const img = src ? await loadImage(src) : null;
  ctx.textAlign = 'center';
  if (img) {
    const size = 400;
    ctx.drawImage(img, (W - size) / 2, 150, size, size);
  } else {
    ctx.font = '200px serif';
    ctx.fillText(spirit.zod.emoji, W / 2, 430);
  }

  const nameJa = spiritNameJa(spirit.elemKey, spirit.zodKey);
  const rarity = RARITY_JA[spirit.rarity.key];

  // 상단 라벨
  ctx.font = '800 24px -apple-system, sans-serif';
  ctx.fillStyle = '#FFD27A';
  ctx.fillText('韓国の四柱推命', W / 2, 92);

  // 등급 (별 + 라벨)
  const stars = '★'.repeat(spirit.rarity.stars) + '☆'.repeat(4 - spirit.rarity.stars);
  ctx.font = '700 30px -apple-system, sans-serif';
  ctx.fillStyle = spirit.rarity.raw;
  ctx.fillText(`${stars}  ${rarity.label}`, W / 2, 618);

  // 이름
  ctx.font = '800 62px -apple-system, sans-serif';
  ctx.fillStyle = '#F4EFFF';
  ctx.fillText(nameJa, W / 2, 694);

  // 타이틀 + 공식
  ctx.font = '700 26px -apple-system, sans-serif';
  ctx.fillStyle = '#FFD27A';
  ctx.fillText(`${spirit.elem.cn} + ${spirit.zod.cn} · ${titleJa(spirit.elemKey, spirit.zodKey)}`, W / 2, 738);

  // 성격 풀이 박스
  ctx.font = '600 25px -apple-system, sans-serif';
  const lines = wrapJa(ctx, personaJa(spirit.elemKey, spirit.zodKey), W - 200, 3);
  const boxY = 762;
  const lineHeight = 38;
  const boxH = 36 + lines.length * lineHeight;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, 70, boxY, W - 140, boxH, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 70, boxY, W - 140, boxH, 22);
  ctx.stroke();
  ctx.fillStyle = '#CFC4E8';
  lines.forEach((line, i) => ctx.fillText(line, W / 2, boxY + 44 + i * lineHeight));

  ctx.font = '700 22px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244,239,255,0.45)';
  ctx.fillText('韓国の四柱推命で見る、あなたの精霊', W / 2, H - 22);

  return canvas;
}

export type PreparedJaCard = { blob: Blob; file: File; key: string };

export async function prepareJaCard(spirit: Spirit, stage: Stage): Promise<PreparedJaCard | null> {
  const canvas = await drawCard(spirit, stage);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return null;
  const nameJa = spiritNameJa(spirit.elemKey, spirit.zodKey);
  return {
    blob,
    file: new File([blob], `${nameJa}.png`, { type: 'image/png' }),
    key: `${spirit.key}|${stage}`,
  };
}

export async function shareJaCard(spirit: Spirit, stage: Stage, prepared?: PreparedJaCard | null): Promise<ShareResult> {
  try {
    const card = prepared?.key === `${spirit.key}|${stage}` ? prepared : await prepareJaCard(spirit, stage);
    if (!card) return 'failed';
    const { blob, file } = card;
    const nameJa = spiritNameJa(spirit.elemKey, spirit.zodKey);
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: '韓国の四柱推命',
          text: `私の精霊は「${nameJa}」でした ✦ #韓国四柱推命 #精霊占い`,
        });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
        return 'failed';
      }
    }
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

import type { Spirit, Stage } from './spirit';
import { STAGE_LABEL } from './spirit';

/**
 * 정령/운세 카드 — canvas로 공유용 이미지 생성 후 Web Share(파일) 또는 다운로드 폴백.
 * 운세 카드는 정령 이미지·이름·오늘 한 줄·브랜드만 노출한다. 720×960(3:4).
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

function drawCenteredLines(ctx: CanvasRenderingContext2D, lines: string[], centerX: number, startY: number, lineHeight: number) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.direction = 'ltr';
  lines.forEach((line, index) => {
    const x = centerX - ctx.measureText(line).width / 2;
    ctx.fillText(line, x, startY + index * lineHeight);
  });
  ctx.restore();
}

type CardContext = 'spirit' | 'fortune';

function drawFortuneContent(ctx: CanvasRenderingContext2D, spirit: Spirit, oneLine?: string) {
  ctx.font = '800 24px -apple-system, sans-serif';
  ctx.fillStyle = '#FFD27A';
  ctx.fillText('오늘의 운세', W / 2, 92);

  ctx.font = '800 64px -apple-system, sans-serif';
  ctx.fillStyle = '#F4EFFF';
  ctx.fillText(spirit.name, W / 2, 690);

  if (!oneLine) return;
  ctx.font = '700 30px -apple-system, sans-serif';
  const lines = wrapText(ctx, oneLine, W - 170, 2);
  const boxY = 730;
  const lineHeight = 40;
  const boxH = 46 + lines.length * lineHeight;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, 70, boxY, W - 140, boxH, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 70, boxY, W - 140, boxH, 22);
  ctx.stroke();
  ctx.fillStyle = '#F4EFFF';
  drawCenteredLines(ctx, lines, W / 2, boxY + 48, lineHeight);
}

function drawSpiritContent(ctx: CanvasRenderingContext2D, spirit: Spirit, stage: Stage, oneLine?: string) {
  const stars = '★'.repeat(spirit.rarity.stars) + '☆'.repeat(4 - spirit.rarity.stars);
  ctx.font = '700 30px -apple-system, sans-serif';
  ctx.fillStyle = spirit.rarity.raw;
  ctx.fillText(`${stars}  ${spirit.rarity.ko}`, W / 2, 642);

  ctx.font = '800 64px -apple-system, sans-serif';
  ctx.fillStyle = '#F4EFFF';
  ctx.fillText(spirit.name, W / 2, 722);

  ctx.font = '700 26px -apple-system, sans-serif';
  ctx.fillStyle = '#FFD27A';
  ctx.fillText(`${spirit.formula} · ${STAGE_LABEL[stage]} 정령`, W / 2, 766);

  if (!oneLine) return;
  ctx.font = '600 25px -apple-system, sans-serif';
  const lines = wrapText(ctx, oneLine, W - 200, 2);
  const boxY = 786;
  const lineHeight = 36;
  const boxH = 38 + lines.length * lineHeight;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, 70, boxY, W - 140, boxH, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 70, boxY, W - 140, boxH, 22);
  ctx.stroke();
  ctx.fillStyle = '#CFC4E8';
  drawCenteredLines(ctx, lines, W / 2, boxY + 44, lineHeight);
}

async function drawCard(spirit: Spirit, stage: Stage, oneLine?: string, context: CardContext = 'spirit'): Promise<HTMLCanvasElement> {
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
  if (context === 'fortune') drawFortuneContent(ctx, spirit, oneLine);
  else drawSpiritContent(ctx, spirit, stage, oneLine);

  // 푸터 — 한 줄 박스 최대 하단(896)과 충분한 간격
  ctx.font = '700 22px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244,239,255,0.45)';
  ctx.fillText(context === 'fortune' ? '이음사주' : '이음사주 ✦ 나의 사주 정령', W / 2, H - 20);

  return canvas;
}

export type ShareResult = 'shared' | 'cancelled' | 'downloaded' | 'failed';

export type PreparedSpiritCard = {
  blob: Blob;
  file: File;
  key: string;
};

function preparationKey(spirit: Spirit, stage: Stage, oneLine: string | undefined, context: CardContext) {
  return JSON.stringify([spirit.key, stage, oneLine ?? '', context]);
}

/** 화면이 열린 동안 공유 파일을 미리 만들어 사용자 클릭의 활성 상태를 보존한다. */
export async function prepareSpiritCard(spirit: Spirit, stage: Stage, oneLine?: string, context: CardContext = 'spirit'): Promise<PreparedSpiritCard | null> {
  const canvas = await drawCard(spirit, stage, oneLine, context);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return null;
  return {
    blob,
    file: new File([blob], `${spirit.name}-정령카드.png`, { type: 'image/png' }),
    key: preparationKey(spirit, stage, oneLine, context),
  };
}

/** 정령 카드 생성 → 공유(지원 시) 또는 PNG 다운로드 폴백 */
export async function shareSpiritCard(
  spirit: Spirit,
  stage: Stage,
  oneLine?: string,
  context: CardContext = 'spirit',
  prepared?: PreparedSpiritCard | null,
): Promise<ShareResult> {
  try {
    const expectedKey = preparationKey(spirit, stage, oneLine, context);
    const card = prepared?.key === expectedKey
      ? prepared
      : await prepareSpiritCard(spirit, stage, oneLine, context);
    if (!card) return 'failed';
    const { blob, file } = card;
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        const isFortune = context === 'fortune';
        await nav.share({
          files: [file],
          title: isFortune ? '오늘의 운세' : '내 사주 정령',
          text: isFortune ? '오늘의 운세 ✦ 이음사주' : `${spirit.name} — ${spirit.rarity.ko} 정령 ✦ 이음사주`,
        });
        return 'shared';
      } catch (error) {
        // 사용자가 공유 시트를 닫은 경우 → 다운로드 폴백 없이 조용히 종료
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
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

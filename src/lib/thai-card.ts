import type { ThaiBirthDay } from './thai-astrology';
import type { ShareResult } from './spirit-card';
import type { Spirit, Stage } from './spirit';

/**
 * 태국 요일 공유 카드 — "나는 밤의 별 라후의 사람".
 * spirit-card 와 같은 canvas → Web Share(파일) / 다운로드 폴백 구조. 720×960(3:4).
 * 요일마다 카드 전체 색이 바뀐다 (수호색 오브 + 톤 텍스트) — "네 건 무슨 색?" 장치.
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

async function drawCard(day: ThaiBirthDay, userName: string, spirit: Spirit, stage: Stage): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const tone = day.accent ?? day.color.hex;

  // 배경 — 코스모스 그라데이션 (spirit-card 와 동일 계열)
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

  // 수호색 오브 — 카드의 주인공 (요일마다 색이 다름)
  const orbY = 330;
  const orbR = 130;
  const glow = ctx.createRadialGradient(W / 2, orbY, 20, W / 2, orbY, orbR * 2.2);
  glow.addColorStop(0, `${day.color.hex}66`);
  glow.addColorStop(0.6, `${day.color.hex}1f`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, orbY - orbR * 2.2, W, orbR * 4.4);

  const orb = ctx.createRadialGradient(W / 2 - orbR * 0.35, orbY - orbR * 0.4, orbR * 0.1, W / 2, orbY, orbR);
  orb.addColorStop(0, `${day.color.hex}66`);
  orb.addColorStop(0.65, `${day.color.hex}40`);
  orb.addColorStop(1, `${day.color.hex}22`);
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(W / 2, orbY, orbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, orbY, orbR, 0, Math.PI * 2);
  ctx.stroke();

  // 라후 전용 — 일식 코로나 링 (어두운 달이 빛 테두리를 두른 연출)
  if (day.key === 'wedNight') {
    ctx.save();
    ctx.shadowColor = tone;
    ctx.shadowBlur = 34;
    ctx.strokeStyle = '#D9D3F0';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(W / 2, orbY, orbR + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 카드의 얼굴 — 요일 전용 캐릭터(있으면) → 내 정령 → 이모지 순 폴백
  // 요일 캐릭터 에셋: public/thai/{dayKey}.png (v2 자료/태국 요일 캐릭터 프롬프트.md)
  const dayCharacter = await loadImage(`/thai/${day.key}.png?v=1`);
  const img = dayCharacter ?? (spirit.imageFor(stage) ? await loadImage(spirit.imageFor(stage)!) : null);
  if (img) {
    const size = 380;
    ctx.drawImage(img, (W - size) / 2, orbY - size / 2 + 20, size, size);
  } else {
    ctx.font = '190px serif';
    ctx.textAlign = 'center';
    ctx.fillText(spirit.zod.emoji, W / 2, orbY + 70);
  }

  ctx.textAlign = 'center';

  // 상단 라벨
  ctx.font = '800 24px -apple-system, sans-serif';
  ctx.fillStyle = tone;
  ctx.fillText('세계의 운세 · 태국편', W / 2, 92);

  // 이름 + 요일
  ctx.font = '700 30px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244,239,255,0.75)';
  ctx.fillText(`${userName}님은`, W / 2, 560);

  ctx.font = '800 62px -apple-system, sans-serif';
  ctx.fillStyle = '#F4EFFF';
  ctx.fillText(`${day.weekdayKr}의 사람`, W / 2, 634);

  // 수호신 — 쉬운 별칭 + 이름
  ctx.font = '800 32px -apple-system, sans-serif';
  ctx.fillStyle = tone;
  ctx.fillText(`${day.deity.plain} ${day.deity.name}`, W / 2, 690);

  // 키워드
  ctx.font = '700 26px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244,239,255,0.6)';
  ctx.fillText(day.keywords.join(' · '), W / 2, 736);

  // 하단 배지 — 라후는 희소 문구, 나머지는 행운색
  const isRahu = day.key === 'wedNight';
  const boxY = 772;
  if (isRahu) {
    const boxText = '✦ 여덟 중 가장 드문, 밤의 수호자';
    ctx.font = '700 27px -apple-system, sans-serif';
    const tw = ctx.measureText(boxText).width;
    ctx.fillStyle = `${tone}26`;
    roundRect(ctx, W / 2 - tw / 2 - 26, boxY, tw + 52, 58, 29);
    ctx.fill();
    ctx.strokeStyle = `${tone}66`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, W / 2 - tw / 2 - 26, boxY, tw + 52, 58, 29);
    ctx.stroke();
    ctx.fillStyle = '#F4EFFF';
    ctx.fillText(boxText, W / 2, boxY + 39);
  } else {
    ctx.font = '700 27px -apple-system, sans-serif';
    const line = `행운색 ${day.color.name}`;
    const tw = ctx.measureText(line).width + 44;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, W / 2 - tw / 2 - 26, boxY, tw + 52, 58, 29);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, W / 2 - tw / 2 - 26, boxY, tw + 52, 58, 29);
    ctx.stroke();
    // 색 견본 점 + 텍스트
    ctx.fillStyle = day.color.hex;
    ctx.beginPath();
    ctx.arc(W / 2 - tw / 2 + 12, boxY + 29, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F4EFFF';
    ctx.fillText(line, W / 2 + 12, boxY + 38);
  }

  // 푸터
  ctx.font = '700 22px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244,239,255,0.45)';
  ctx.fillText('이음사주 ✦ 태어난 요일로 보는 태국 점성술', W / 2, H - 24);

  return canvas;
}

export type PreparedThaiCard = { blob: Blob; file: File; key: string };

function preparationKey(day: ThaiBirthDay, userName: string, spirit: Spirit, stage: Stage) {
  return JSON.stringify([day.key, userName, spirit.key, stage]);
}

/** 화면이 열린 동안 미리 생성 — 클릭 시 사용자 활성 상태 보존 (spirit-card 패턴) */
export async function prepareThaiCard(day: ThaiBirthDay, userName: string, spirit: Spirit, stage: Stage): Promise<PreparedThaiCard | null> {
  const canvas = await drawCard(day, userName, spirit, stage);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return null;
  return {
    blob,
    file: new File([blob], `태국점성술-${day.weekdayKr}.png`, { type: 'image/png' }),
    key: preparationKey(day, userName, spirit, stage),
  };
}

/** 카드 공유(지원 시) 또는 PNG 다운로드 폴백 */
export async function shareThaiCard(
  day: ThaiBirthDay,
  userName: string,
  spirit: Spirit,
  stage: Stage,
  prepared?: PreparedThaiCard | null,
): Promise<ShareResult> {
  try {
    const card = prepared?.key === preparationKey(day, userName, spirit, stage)
      ? prepared
      : await prepareThaiCard(day, userName, spirit, stage);
    if (!card) return 'failed';
    const { blob, file } = card;
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: '태국 점성술',
          text: `나는 ${day.deity.plain} ${day.deity.name}의 사람 ✦ 이음사주`,
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

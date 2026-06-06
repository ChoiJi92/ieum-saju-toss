import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SpiritProfile } from '../lib/spirit-pet';

export function SpiritPetHero({
  spirit,
  compact = false,
  style,
}: {
  spirit: SpiritProfile;
  compact?: boolean;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const canShowImage = !!spirit.imageSrc && !failed;
  const size = compact ? 118 : 176;

  const motes = useMemo(
    () =>
      Array.from({ length: compact ? 7 : 11 }, (_, i) => ({
        left: `${12 + ((i * 29) % 76)}%`,
        top: `${10 + ((i * 43) % 78)}%`,
        delay: `${(i % 5) * 0.24}s`,
        scale: 0.62 + (i % 4) * 0.14,
      })),
    [compact],
  );

  return (
    <div className="v2-spirit-stage" style={style}>
      {motes.map((mote, i) => (
        <span
          key={i}
          className="v2-spirit-mote"
          style={{
            left: mote.left,
            top: mote.top,
            animationDelay: mote.delay,
            transform: `scale(${mote.scale})`,
          }}
        />
      ))}

      <div
        className="v2-spirit-aura"
        style={{
          width: size,
          height: size,
        }}
      >
        {canShowImage ? (
          <img
            src={spirit.imageSrc ?? undefined}
            alt={`${spirit.name} ${spirit.stageLabel}`}
            className="v2-spirit-image"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="v2-spirit-placeholder" aria-label={`${spirit.name} 이미지 준비 중`}>
            <span>{spirit.line === '새싹' ? '🌱' : spirit.line === '노을' ? '☀' : spirit.line === '언덕' ? '◆' : spirit.line === '달빛' ? '◐' : '✦'}</span>
            <strong>{spirit.animalLabel}</strong>
          </div>
        )}
      </div>

      {!compact && (
        <div className="v2-spirit-nameplate">
          <span>{spirit.lineLabel}</span>
          <strong>{spirit.name}</strong>
          <em>{spirit.stageLabel}</em>
        </div>
      )}
    </div>
  );
}

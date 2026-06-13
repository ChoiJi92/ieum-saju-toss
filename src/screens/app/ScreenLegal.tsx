import { V2Screen, V2TopBar } from './_kit';
import { TERMS_MD, PRIVACY_MD } from '../../lib/legal-text';

export default function ScreenLegal({ kind, back }: { kind: 'terms' | 'privacy'; back: () => void }) {
  const title = kind === 'terms' ? '서비스 이용약관' : '개인정보 처리방침';
  const md = kind === 'terms' ? TERMS_MD : PRIVACY_MD;
  return (
    <V2Screen seed={22}>
      <V2TopBar onBack={back} title={title} />
      <div style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--v2-ink-mid)', whiteSpace: 'pre-wrap', padding: '6px 2px 0', WebkitUserSelect: 'text', userSelect: 'text' }}>{md}</div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

import { CSSProperties, ReactNode } from 'react';
import { IETopBar } from '../components/ie';
import { useRouter } from '../lib/router';
import { TERMS_MD, PRIVACY_MD } from '../lib/legal-text';

/**
 * 12·13 약관·개인정보 처리방침 — 인앱 화면 (외부 노션 링크 대체).
 * 텍스트는 lib/legal-text.ts 에 보관. 마크다운 풍 텍스트를 React로 렌더.
 */

type Props = {
  kind: 'terms' | 'privacy';
};

const TITLE: Record<Props['kind'], string> = {
  terms: '서비스 이용약관',
  privacy: '개인정보 처리방침',
};

export default function ScreenLegal({ kind }: Props) {
  const { back } = useRouter();
  const md = kind === 'terms' ? TERMS_MD : PRIVACY_MD;

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title={TITLE[kind]} />
      <div
        className="ie-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 22px 40px',
          color: 'var(--cp-text)',
          WebkitUserSelect: 'text',
          userSelect: 'text',
        }}
      >
        {renderMarkdown(md)}
      </div>
    </div>
  );
}

/* ── 미니 마크다운 렌더러 ──────────────────────────────────
 * 지원: # / ## / ### 헤더, --- 구분선, **굵게**, - 리스트, 1. 번호 리스트,
 *      | 테이블 |, 단락. (이미지·링크 X — 약관 텍스트엔 불필요)
 */
function renderMarkdown(src: string): ReactNode[] {
  const lines = src.split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 빈 줄 스킵
    if (!line.trim()) {
      i++;
      continue;
    }

    // # / ## / ### 헤더
    if (line.startsWith('### ')) {
      out.push(<h3 key={key++} style={headingStyles.h3}>{inline(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      out.push(<h2 key={key++} style={headingStyles.h2}>{inline(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      out.push(<h1 key={key++} style={headingStyles.h1}>{inline(line.slice(2))}</h1>);
      i++;
      continue;
    }

    // 구분선 ---
    if (line.trim() === '---') {
      out.push(<hr key={key++} style={hrStyle} />);
      i++;
      continue;
    }

    // 테이블 (| ... |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      out.push(renderTable(tableLines, key++));
      continue;
    }

    // 번호 리스트 (1. 2. ...)
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      out.push(
        <ol key={key++} style={listStyles.ol}>
          {items.map((it, idx) => (
            <li key={idx} style={listStyles.li}>{inline(it)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 불릿 리스트 (- ...)
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      out.push(
        <ul key={key++} style={listStyles.ul}>
          {items.map((it, idx) => (
            <li key={idx} style={listStyles.li}>{inline(it)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 단락
    out.push(<p key={key++} style={paraStyle}>{inline(line)}</p>);
    i++;
  }

  return out;
}

/** **굵게** 인라인 마크다운 처리 */
function inline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    const m = rest.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/);
    if (!m) {
      parts.push(rest);
      break;
    }
    if (m[1]) parts.push(<span key={key++}>{m[1]}</span>);
    parts.push(<strong key={key++} style={{ fontWeight: 800, color: 'var(--cp-text)' }}>{m[2]}</strong>);
    rest = m[3];
  }
  return <>{parts}</>;
}

function renderTable(lines: string[], key: number): ReactNode {
  // 첫 행 = 헤더, 두 번째 행 = 구분(|---|), 나머지 = 데이터
  const rows = lines
    .filter((l) => !/^\|[\s\-:|]*\|$/.test(l))
    .map((l) => l.slice(1, -1).split('|').map((c) => c.trim()));
  if (rows.length === 0) return null;
  const [header, ...body] = rows;
  return (
    <div
      key={key}
      style={{
        margin: '12px 0 16px',
        borderRadius: 12,
        background: 'var(--cp-bg-paper)',
        border: '1px solid var(--cp-border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${header.length}, 1fr)`,
          background: 'var(--cp-bg)',
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--cp-text-mid)',
          letterSpacing: 0.3,
        }}
      >
        {header.map((h, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRight: i < header.length - 1 ? '1px solid var(--cp-border)' : 'none' }}>
            {inline(h)}
          </div>
        ))}
      </div>
      {body.map((row, ri) => (
        <div
          key={ri}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${header.length}, 1fr)`,
            fontSize: 12,
            color: 'var(--cp-text-mid)',
            borderTop: '1px solid var(--cp-border)',
            lineHeight: 1.5,
          }}
        >
          {row.map((cell, ci) => (
            <div
              key={ci}
              style={{
                padding: '10px 12px',
                borderRight: ci < row.length - 1 ? '1px solid var(--cp-border)' : 'none',
              }}
            >
              {inline(cell)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const headingStyles: Record<'h1' | 'h2' | 'h3', CSSProperties> = {
  h1: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: -0.5,
    margin: '12px 0 8px',
    color: 'var(--cp-text)',
  },
  h2: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: -0.3,
    margin: '22px 0 10px',
    color: 'var(--cp-text)',
  },
  h3: {
    fontSize: 14,
    fontWeight: 800,
    margin: '18px 0 8px',
    color: 'var(--cp-text)',
  },
};

const hrStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--cp-border)',
  margin: '20px 0',
};

const paraStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.75,
  color: 'var(--cp-text-mid)',
  margin: '8px 0',
};

const listStyles: Record<'ul' | 'ol' | 'li', CSSProperties> = {
  ul: {
    margin: '6px 0 10px 0',
    padding: '0 0 0 20px',
    listStyle: 'disc',
  },
  ol: {
    margin: '6px 0 10px 0',
    padding: '0 0 0 22px',
    listStyle: 'decimal',
  },
  li: {
    fontSize: 13,
    lineHeight: 1.75,
    color: 'var(--cp-text-mid)',
    margin: '4px 0',
  },
};

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const cardPath = fileURLToPath(new URL('../src/lib/spirit-card.ts', import.meta.url));
const source = await readFile(cardPath, 'utf8');
const prohibited = [
  /\bmyeongsik\b/i,
  /\b(?:birthDate|birthTime|profileId)\b/i,
  /\b(?:gender|sex)\b/i,
  /\b(?:year|month|day|hour|minute)\b/i,
  /\bprofile\.id\b/i,
  /생년월일|태어난 시간|성별/,
];

const violation = prohibited.find((pattern) => pattern.test(source));
if (violation) {
  console.error(`spirit card privacy: prohibited reference ${violation}`);
  process.exit(1);
}

console.log('spirit card privacy: ok');

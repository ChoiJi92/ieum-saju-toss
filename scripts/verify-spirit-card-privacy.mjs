import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

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

const sourceFile = ts.createSourceFile(cardPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const fortuneRenderer = sourceFile.statements.find(
  (node) => ts.isFunctionDeclaration(node) && node.name?.text === 'drawFortuneContent',
);

if (!fortuneRenderer || !ts.isFunctionDeclaration(fortuneRenderer)) {
  console.error('spirit card privacy: dedicated fortune renderer is required');
  process.exit(1);
}

const forbiddenFortuneFields = new Set(['rarity', 'formula', 'stage', 'STAGE_LABEL']);
const fortuneViolations = new Set();
const fortuneProperties = new Set();
const fortuneIdentifiers = new Set();
const fortuneLabels = new Set();

function inspectFortuneRenderer(node) {
  if (ts.isPropertyAccessExpression(node)) {
    fortuneProperties.add(node.getText(sourceFile));
    if (forbiddenFortuneFields.has(node.name.text)) fortuneViolations.add(node.name.text);
  }
  if (ts.isIdentifier(node)) {
    fortuneIdentifiers.add(node.text);
    if (forbiddenFortuneFields.has(node.text)) fortuneViolations.add(node.text);
  }
  if (ts.isStringLiteral(node)) fortuneLabels.add(node.text);
  ts.forEachChild(node, inspectFortuneRenderer);
}

inspectFortuneRenderer(fortuneRenderer);
if (fortuneViolations.size > 0) {
  console.error(`spirit card privacy: fortune renderer exposes derived fields ${[...fortuneViolations].join(', ')}`);
  process.exit(1);
}

if (!fortuneProperties.has('spirit.name') || !fortuneIdentifiers.has('oneLine') || !fortuneLabels.has('오늘의 운세')) {
  console.error('spirit card privacy: fortune renderer must include spirit name, fortune one-line, and 오늘의 운세');
  process.exit(1);
}

console.log('spirit card privacy: ok');

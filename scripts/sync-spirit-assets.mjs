import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const outRoot = join(root, 'public', 'spirits');

const lines = ['새싹', '노을', '언덕', '달빛', '이슬'];
const animals = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

mkdirSync(outRoot, { recursive: true });

let copied = 0;
for (const line of lines) {
  for (const animal of animals) {
    const name = `${line}${animal}`;
    const src = join(root, name);
    if (!existsSync(src) || !statSync(src).isDirectory()) continue;

    const pngs = readdirSync(src).filter((file) => file.endsWith('.png'));
    if (pngs.length === 0) continue;

    const dest = join(outRoot, name);
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });

    for (const file of pngs) {
      cpSync(join(src, file), join(dest, file));
      copied++;
    }
  }
}

console.log(`Synced ${copied} spirit image files to public/spirits`);

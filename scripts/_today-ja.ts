import { calculateSaju } from '@fullstackfamily/manseryeok';
import { makeSpirit, ZODIAC, type ElementKey, type ZodiacKey } from '../src/lib/spirit';
import { spiritNameJa, titleJa, personaJa, RARITY_JA, ELEMENTS_JA, ZODIAC_JA } from '../src/lib/i18n-ja';

const STEM: Record<string, ElementKey> = { '甲':'wood','乙':'wood','丙':'fire','丁':'fire','戊':'earth','己':'earth','庚':'metal','辛':'metal','壬':'water','癸':'water' };
const BR: Record<string, ZodiacKey> = Object.fromEntries((Object.keys(ZODIAC) as ZodiacKey[]).map(k => [ZODIAC[k].cn, k])) as Record<string, ZodiacKey>;

const d = new Date(); // 오늘 (KST 기준으로 실행)
const r = calculateSaju(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, { applyTimeCorrection: false });
const gz = r.dayPillarHanja;
const sp = makeSpirit(STEM[gz[0]] ?? 'wood', BR[gz[1]] ?? 'rat');
console.log('일진(日柱):', gz);
console.log('KO:', sp.name, '/', sp.rarity.ko, sp.rarity.stars + '성', '/', sp.formula);
console.log('JA:', spiritNameJa(sp.elemKey, sp.zodKey), '/', RARITY_JA[sp.rarity.key].label);
console.log('JA칭호:', titleJa(sp.elemKey, sp.zodKey));
console.log('JA성격:', personaJa(sp.elemKey, sp.zodKey));
console.log('오행JA:', JSON.stringify(ELEMENTS_JA[sp.elemKey]));
console.log('십이지JA:', JSON.stringify(ZODIAC_JA[sp.zodKey]));
console.log('이미지키:', sp.key);

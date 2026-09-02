#!/usr/bin/env python3
"""
정령 원본 PNG → WebP 두 벌 → Supabase Storage `spirits` 버킷.

  python3 scripts/upload-spirits.py                 # 전부
  python3 scripts/upload-spirits.py 달빛용 노을닭     # 일부만 (그림 교체 때)

원본: spirits-src/{정령}/{정령}-{NN}-{단계}.png  (1254px, gitignore — 로컬에만 있음)
결과: {full,thumb}/{elem}-{zod}/{NN}.webp
      full  768px  홈·오늘 운세·모달 (최대 표시 210px × 3x DPR)
      thumb 192px  도감 그리드 (52px × 118% × 3x)

왜 번들에 안 넣나: 242장 × 1.4MB 를 넣었더니 .ait 가 338MB — 토스 한도(압축 해제 100MB)의
4배였고, 처음 여는 사람이 알을 보기까지 그걸 다 받아야 했다. 번들 올릴 때마다 재방문자
전원이 다시 받았고. 지금은 번들 5MB, 이미지는 필요한 것만 그때그때.

왜 영문 슬러그인가: Storage 가 키에 한글을 허용하지 않는다(InvalidKey).
슬러그 규칙은 src/lib/spirit.ts 의 imageFor 와 반드시 같아야 한다.

서비스 키: `npx supabase projects api-keys --project-ref hpuczqxswupbujbeknls -o json` 의 service_role.
환경변수 SUPABASE_SERVICE_KEY 로 넘기거나, 없으면 CLI 에서 자동으로 꺼낸다.
"""
import io, json, os, re, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'spirits-src')
PROJECT = 'hpuczqxswupbujbeknls'
BASE = f'https://{PROJECT}.supabase.co/storage/v1/object/spirits/'
SIZES = {'full': 768, 'thumb': 192}
ELEM = {'새싹': 'wood', '노을': 'fire', '언덕': 'earth', '달빛': 'metal', '이슬': 'water'}
ZOD = {'쥐': 'rat', '소': 'ox', '호랑이': 'tiger', '토끼': 'rabbit', '용': 'dragon', '뱀': 'snake',
       '말': 'horse', '양': 'goat', '원숭이': 'monkey', '닭': 'rooster', '개': 'dog', '돼지': 'pig'}

def slug(korean: str) -> str:
    for e_ko, e in ELEM.items():
        if korean.startswith(e_ko) and (z := ZOD.get(korean[len(e_ko):])):
            return f'{e}-{z}'
    raise ValueError(f'정령 이름 해석 불가: {korean}')

def service_key() -> str:
    if k := os.environ.get('SUPABASE_SERVICE_KEY'): return k
    out = subprocess.check_output(['npx', 'supabase', 'projects', 'api-keys', '--project-ref', PROJECT, '-o', 'json'], text=True)
    return next(k['api_key'] for k in json.loads(out) if k['name'] == 'service_role')

def process(png: str, key: str):
    folder = os.path.basename(os.path.dirname(png))
    stage = re.search(r'-(\d\d)-', os.path.basename(png)).group(1)
    im = Image.open(png).convert('RGBA')
    results = []
    for kind, px in SIZES.items():
        buf = io.BytesIO()
        im.resize((px, px), Image.LANCZOS).save(buf, 'WEBP', quality=82, method=6)
        path = f'{kind}/{slug(folder)}/{stage}.webp'
        req = urllib.request.Request(BASE + path, data=buf.getvalue(), method='POST', headers={
            'Authorization': f'Bearer {key}', 'apikey': key, 'Content-Type': 'image/webp',
            'x-upsert': 'true', 'Cache-Control': 'public, max-age=31536000, immutable'})
        try:
            with urllib.request.urlopen(req, timeout=60) as r: results.append((path, r.status, buf.tell()))
        except urllib.error.HTTPError as e: results.append((path, f'{e.code} {e.read()[:60]}', 0))
    return results

def main():
    only = set(sys.argv[1:])
    pngs = [os.path.join(r, f) for r, _, fs in os.walk(SRC) for f in fs
            if f.endswith('.png') and re.search(r'-\d\d-', f) and (not only or os.path.basename(r) in only)]
    if not pngs: sys.exit(f'대상 없음: {SRC}')
    key = service_key()
    ok = bad = 0; total = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        for results in ex.map(lambda p: process(p, key), pngs):
            for path, st, size in results:
                if st == 200: ok += 1; total += size
                else: bad += 1; print('FAIL', path, st)
    print(f'{ok}장 업로드 ({total/1048576:.1f} MB), {bad}장 실패')

if __name__ == '__main__': main()

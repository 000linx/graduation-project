"""重新下载商品图片到本地静态目录"""
import os
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError

STATIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'backend', 'static', 'products')

IMAGES = [
    ('phonak_p90.jpg', 'https://picsum.photos/seed/phonak-p90/800/800'),
    ('oticon_more.jpg', 'https://picsum.photos/seed/oticon-more/800/800'),
    ('resound_one.jpg', 'https://picsum.photos/seed/resound-one/800/800'),
    ('signia_styletto.jpg', 'https://picsum.photos/seed/signia-styletto/800/800'),
    ('starkey_evolv.jpg', 'https://picsum.photos/seed/starkey-evolv/800/800'),
    ('widex_moment.jpg', 'https://picsum.photos/seed/widex-moment/800/800'),
    ('unitron_moxi.jpg', 'https://picsum.photos/seed/unitron-moxi/800/800'),
    ('oticon_opn.jpg', 'https://picsum.photos/seed/oticon-opn/800/800'),
    ('phonak_virto.jpg', 'https://picsum.photos/seed/phonak-virto/800/800'),
    ('siemens_lotus.jpg', 'https://picsum.photos/seed/siemens-lotus/800/800'),
]

def main():
    os.makedirs(STATIC_DIR, exist_ok=True)
    ok = 0
    for filename, url in IMAGES:
        dest = os.path.join(STATIC_DIR, filename)
        try:
            req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            resp = urlopen(req, timeout=30)
            data = resp.read()
            with open(dest, 'wb') as f:
                f.write(data)
            size_kb = len(data) / 1024
            print(f"  ✓ {filename} ({size_kb:.1f} KB)")
            ok += 1
        except Exception as e:
            print(f"  ✗ {filename}: {e}")

    print(f"\n成功: {ok}/{len(IMAGES)}")
    return 0 if ok == len(IMAGES) else 1

if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python3
"""Pone tu dominio y tu identificador de AdSense en la web (cifra-web/).

Uso: python3 cifra-src/tools/web-config.py midominio.com ca-pub-1234567890123456
"""
import pathlib, re, sys
W=pathlib.Path(__file__).resolve().parents[2]/'cifra-web'
if len(sys.argv)!=3 or not re.fullmatch(r'ca-pub-\d{16}',sys.argv[2]):
    sys.exit(__doc__)
domain=sys.argv[1].removeprefix('https://').removeprefix('http://').strip('/')
client=sys.argv[2]
for f in ['robots.txt','sitemap.xml']:
    p=W/f;s=p.read_text(encoding='utf-8')
    p.write_text(re.sub(r'https://[^/\s<]+/',f'https://{domain}/',s),encoding='utf-8')
(W/'ads.txt').write_text(f'google.com, {client.removeprefix("ca-")}, DIRECT, f08c47fec0942fa0\n',encoding='utf-8')
p=W/'anuncios-config.js';s=p.read_text(encoding='utf-8')
p.write_text(re.sub(r"CIFRA_ADSENSE_CLIENT = '[^']*'",f"CIFRA_ADSENSE_CLIENT = '{client}'",s),encoding='utf-8')
# Etiqueta de verificación de la cuenta de AdSense en todas las páginas.
for p in W.rglob('*.html'):
    s=p.read_text(encoding='utf-8')
    s=re.sub(r'\n<meta name="google-adsense-account"[^>]*>','',s)
    s=re.sub(r'(<meta charset="utf-8"\s*/?>)',lambda m:m.group(1)+f'\n<meta name="google-adsense-account" content="{client}">',s,count=1)
    p.write_text(s,encoding='utf-8')
print(f'Listo: dominio {domain}, AdSense {client}')

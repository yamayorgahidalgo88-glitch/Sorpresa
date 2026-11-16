#!/usr/bin/env python3
"""Genera el juego de la web (cifra-web/jugar/) a partir de la versión de CrazyGames.

Uso: python3 cifra-src/tools/build-cg.py && python3 cifra-src/tools/build-web.py
"""
import pathlib, shutil
ROOT=pathlib.Path(__file__).resolve().parents[2]
CG=ROOT/'cifra-crazygames'
OUT=ROOT/'cifra-web'/'jugar'

def replace(s,old,new):
    assert s.count(old)==1,old
    return s.replace(old,new)

html=(CG/'index.html').read_text(encoding='utf-8')
html=replace(html,'  <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n',
  '  <script src="../anuncios-config.js"></script>\n  <script src="../anuncios.js"></script>\n')
html=replace(html,'<html lang="en">','<html lang="es">')
html=replace(html,'  <title>CIFRA</title>','  <title>Jugar a CIFRA — juego de adivinar cifras</title>\n  <link rel="icon" href="../favicon-32.png" type="image/png" />')
html=replace(html,'<link rel="icon" href="favicon-32.png" type="image/png" />\n','')
html=replace(html,'<div class="version-tag">CIFRA · v1</div>',
  '<div class="version-tag"><a href="../" style="color:inherit">CIFRA · inicio</a> · <a href="../privacidad/" style="color:inherit">privacidad</a></div>')
(OUT/'index.html').write_text(html,encoding='utf-8')

online=(CG/'online.js').read_text(encoding='utf-8')
online=replace(online,"const SESSION_KEY='cifra-cg-online-session';\nconst APP_ID='cg';","const SESSION_KEY='cifra-web-online-session';\nconst APP_ID='web';")
(OUT/'online.js').write_text(online,encoding='utf-8')
for f in ['i18n.js','firebase-config.js']:
    shutil.copy(CG/f,OUT/f)
print('Juego web generado en',OUT.relative_to(ROOT))

#!/usr/bin/env python3
"""Inserta el banco de preguntas (cifra-src/preguntas/*.js) en cifra/index.html.

Uso: python3 cifra-src/tools/build.py
"""
import pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[2]
SRC=ROOT/'cifra-src'/'preguntas'
HTML=ROOT/'cifra'/'index.html'
START='/*__DATOS_INICIO__*/'
END='/*__DATOS_FIN__*/'

data='\n'.join(p.read_text(encoding='utf-8') for p in sorted(SRC.glob('*.js')))
adapter='''
// Identificador estable a partir del texto: no cambia aunque se añadan o reordenen preguntas.
function questionId(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}
const bank=RAW.map(x=>({text:x.t,answer:x.a,unit:x.u,year:!!x.y,dec:x.d||0,approx:!!x.ap,note:x.n||'',hint:x.h||'',category:x.cat,source:x.s,id:questionId(x.t)}));
'''
block=START+'\n'+data+'\n'+adapter+END+'\n'
html=HTML.read_text(encoding='utf-8')
if START in html:
    a=html.index(START); b=html.index(END)+len(END)
    if html[b:b+1]=='\n': b+=1
else:
    a=html.index('const SOURCES={'); b=html.index("let contextQuestionText=''")
html=html[:a]+block+html[b:]
HTML.write_text(html,encoding='utf-8')
n=len(re.findall(r"^\s*[NY]\('",data,flags=re.M))
print(f'{n} preguntas insertadas en {HTML.relative_to(ROOT)}')

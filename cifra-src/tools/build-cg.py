#!/usr/bin/env python3
"""Inserta el banco de preguntas en español e inglés en cifra-crazygames/index.html.

Solo entran las preguntas que tienen traducción (las muy ligadas a España se excluyen),
así todos los jugadores de una sala online tienen las mismas preguntas sea cual sea su idioma.

Uso: python3 cifra-src/tools/build-cg.py
"""
import pathlib, subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2]
ES=ROOT/'cifra-src'/'preguntas'
EN=ROOT/'cifra-src'/'en'
HTML=ROOT/'cifra-crazygames'/'index.html'
START='/*__DATOS_INICIO__*/'
END='/*__DATOS_FIN__*/'

check=subprocess.run(['node',str(ROOT/'cifra-src'/'tools'/'check-en.js')],capture_output=True,text=True)
print(check.stdout.strip())
if check.returncode or ' 0 desalineadas' not in check.stdout:
    raise SystemExit('Las traducciones no están alineadas; no se genera nada.')

read=lambda d:'\n'.join(p.read_text(encoding='utf-8') for p in sorted(d.glob('*.js')))
adapter='''
// Identificador estable a partir del texto en español: no cambia aunque se añadan o reordenen preguntas.
function questionId(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}
const bank=[];
for(const cat of [...new Set(RAW.map(q=>q.cat))]){
  const es=RAW.filter(q=>q.cat===cat),en=EN[cat]||[];
  es.forEach((x,i)=>{
    const t=en[i];if(!t||t.skip||t.a!==x.a)return;
    bank.push({text:x.t,textEn:t.t,answer:x.a,unit:x.u,unitEn:t.u||'',year:!!x.y,dec:x.d||0,approx:!!x.ap,note:x.n||'',noteEn:t.n||'',category:x.cat,source:x.s,id:questionId(x.t)});
  });
}
'''
block=START+'\n'+read(ES)+'\n'+read(EN)+'\n'+adapter+END+'\n'
html=HTML.read_text(encoding='utf-8')
a=html.index(START); b=html.index(END)+len(END)
if html[b:b+1]=='\n': b+=1
HTML.write_text(html[:a]+block+html[b:],encoding='utf-8')
print(f'Banco insertado en {HTML.relative_to(ROOT)}')

# Uso: python3 fixer.py archivo.js reemplazos.txt  (líneas: viejo ||| nuevo)
import sys
p,r=sys.argv[1],sys.argv[2]; s=open(p,encoding='utf-8').read()
for line in open(r,encoding='utf-8'):
    line=line.rstrip('\n')
    if not line.strip(): continue
    a,b=line.split(' ||| ')
    n=s.count(a); assert n>=1,('NO',a)
    s=s.replace(a,b)
open(p,'w',encoding='utf-8').write(s)

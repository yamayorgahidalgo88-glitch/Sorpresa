// Busca preguntas duplicadas o equivalentes (mismo dato con otra redacción).
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'..','preguntas');
const code=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n')+'\n;this.RAW=RAW;';
const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);
const STOP=new Set('el la los las de del en y a al que qué cuántos cuántas cuánto cuánta año años se su sus por un una con para como fue es lo le o e mide tiene tenía hay mismo primer primera primeros primeras ha han había entre sin desde hasta cuando cuál'.split(' '));
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9ñ ]/g,' ');
const toks=s=>new Set(norm(s).split(/\s+/).filter(w=>w.length>2&&!STOP.has(w)));
const R=ctx.RAW; let issues=0;
const seen=new Map();
for(const q of R){const k=norm(q.t).replace(/\s+/g,' ').trim(); if(seen.has(k)){issues++;console.log('EXACTA:',q.t);} seen.set(k,q);}
const T=R.map(q=>toks(q.t));
for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){
  const a=T[i],b=T[j]; let inter=0; for(const w of a) if(b.has(w)) inter++;
  const jac=inter/(a.size+b.size-inter);
  const same=R[i].a===R[j].a && !!R[i].y===!!R[j].y;
  if(same && jac>=0.2){issues++;console.log(`[${jac.toFixed(2)}${same?' MISMA RESPUESTA':''}]\n  ${R[i].t} (${R[i].a})\n  ${R[j].t} (${R[j].a})`);}
}
console.log(R.length,'preguntas;',issues,'posibles duplicados');

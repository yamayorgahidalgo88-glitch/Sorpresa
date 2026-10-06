// Señala pares que hablan del mismo sujeto y piden el mismo tipo de dato.
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'..','preguntas');
const code=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n')+'\n;this.RAW=RAW;';
const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);
const R=ctx.RAW;
const verb=q=>{const t=q.t.toLowerCase();for(const v of ['murió','nació','fundó','estrenó','publicó','salió','inauguró','ganó','apareció','lanzó','creó','pagó','recaudó','vendió','dura','duró','mide','medía','tiene','tenía','costaba','costó'])if(t.includes(v))return v;return '?';};
const subj=q=>{const s=new Set();for(const m of q.t.matchAll(/«([^»]+)»/g))s.add(m[1].toLowerCase());
  for(const m of q.t.slice(2).matchAll(/(?:[A-ZÁÉÍÓÚÑ][\wáéíóúñ'’.-]+(?:\s(?:de|del|la|el|y)?\s?[A-ZÁÉÍÓÚÑ][\wáéíóúñ'’.-]+)*)/g)){const w=m[0].toLowerCase();if(!['en','qué','cuántos','cuántas','a','el','la','los','las','desde'].includes(w))s.add(w);}return s;};
const S0=R.map(subj),V=R.map(verb);const freq={};for(const s of S0)for(const x of s)freq[x]=(freq[x]||0)+1;const S=S0.map(s=>new Set([...s].filter(x=>freq[x]<=3&&x.length>2)));let n=0;
for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){
  if(!!R[i].y!==!!R[j].y||R[i].u!==R[j].u)continue;
  if(V[i]!==V[j])continue;
  const shared=[...S[i]].filter(x=>S[j].has(x));
  if(shared.length){n++;console.log(`${shared.join('|')}\n  ${R[i].t} (${R[i].a})\n  ${R[j].t} (${R[j].a})`);}
}
console.log(n,'pares');

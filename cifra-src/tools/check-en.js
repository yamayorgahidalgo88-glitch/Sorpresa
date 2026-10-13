// Comprueba que cada traducción está alineada con su pregunta en español.
const fs=require('fs'),path=require('path'),vm=require('vm');
const read=d=>fs.readdirSync(d).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(d,f),'utf8')).join('\n');
const ctx={};vm.createContext(ctx);
vm.runInContext(read(path.join(__dirname,'..','preguntas'))+'\n'+read(path.join(__dirname,'..','en'))+'\n;this.RAW=RAW;this.EN=EN;',ctx);
let bad=0,tot=0,skip=0;const texts=new Set();
for(const cat of [...new Set(ctx.RAW.map(q=>q.cat))]){
  const es=ctx.RAW.filter(q=>q.cat===cat),en=ctx.EN[cat];
  if(!en){console.log('SIN TRADUCIR:',cat,es.length);continue;}
  if(en.length!==es.length){console.log(`${cat}: ${en.length} traducciones para ${es.length} preguntas`);}
  for(let i=0;i<Math.max(es.length,en.length);i++){
    const a=es[i],b=en[i];
    if(!a||!b||a.a!==b.a){bad++;console.log(`${cat} #${i}: ES ${a?.a} «${a?.t}» ≠ EN ${b?.a} «${b?.t}»`);if(bad>5)process.exit(1);continue;}
    if(b.skip){skip++;continue;}
    tot++;
    if(!a.y&&!b.u&&a.u)console.log(`${cat} #${i}: falta unidad (${a.u}) «${b.t}»`);
    if(texts.has(b.t))console.log('TEXTO REPETIDO:',b.t);texts.add(b.t);
  }
}
console.log(tot,'traducidas;',skip,'excluidas;',bad,'desalineadas');

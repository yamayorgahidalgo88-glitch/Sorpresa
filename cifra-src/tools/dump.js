const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'..','preguntas');
const code=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n')+'\n;this.RAW=RAW;';
const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);
const cat=process.argv[2];
const qs=ctx.RAW.filter(q=>!cat||q.cat===cat);
if(!cat){const c={};for(const q of ctx.RAW)c[q.cat]=(c[q.cat]||0)+1;console.log(c);}
else qs.forEach((q,i)=>console.log(`${i}|${q.a}|${q.y?'AÑO':q.u}|${q.t}${q.n?' || N: '+q.n:''}`));

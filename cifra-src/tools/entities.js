const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'..','preguntas');
const code=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n')+'\n;this.RAW=RAW;this.CI=typeof CONTEXT_INFO!=="undefined"?CONTEXT_INFO:{};';
const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);
const keys=Object.keys(ctx.CI);
const has=(t)=>keys.some(k=>{const cs=/^[A-ZÁÉÍÓÚÑÜ]/.test(k);const re=new RegExp('(^|[^\\p{L}\\p{N}])'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^\\p{L}\\p{N}])',cs?'u':'iu');return re.test(t);});
const missing=ctx.RAW.filter(q=>!has(q.t));
if(process.argv[2]==='--missing'){for(const q of missing)console.log(q.t);}
console.log(ctx.RAW.length,'preguntas;',keys.length,'fichas;',missing.length,'sin nombre subrayado');

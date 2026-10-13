// Lista las preguntas en inglés que aún no tienen ningún nombre subrayado.
const fs=require('fs'),path=require('path'),vm=require('vm');
const read=d=>fs.readdirSync(d).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(d,f),'utf8')).join('\n');
const ctx={};vm.createContext(ctx);
vm.runInContext(read(path.join(__dirname,'..','preguntas'))+'\n'+read(path.join(__dirname,'..','en'))+'\n;this.EN=EN;this.CI=typeof CONTEXT_INFO_EN!=="undefined"?CONTEXT_INFO_EN:{};',ctx);
const keys=Object.keys(ctx.CI);
const has=t=>keys.some(k=>{const cs=/^[A-Z0-9]/.test(k);return new RegExp('(^|[^\\p{L}\\p{N}])'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^\\p{L}\\p{N}])',cs?'u':'iu').test(t);});
const NUM=/\d|(?<![\p{L}])(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|million|billion|decade|decades|century|dozen)(?![\p{L}])/iu;
let miss=0;
for(const [cat,list] of Object.entries(ctx.EN))for(const e of list){if(e.skip)continue;if(!has(e.t)){miss++;if(process.argv[2]==='--list')console.log(cat+' | '+e.t);}}
for(const [k,v] of Object.entries(ctx.CI))if(NUM.test(v.replace(/“[^”]*”/g,'').replace(/\b[A-Z][\w’]*\s?\d+\b/g,'')))console.log('FICHA CON CIFRA:',k,'=>',v);
console.log(keys.length,'fichas EN;',miss,'preguntas sin subrayado');

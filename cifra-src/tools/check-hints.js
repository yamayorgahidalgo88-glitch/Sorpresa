// Revisa que pistas y fichas no contengan cifras ni palabras numéricas.
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'..','preguntas');
const code=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n')+'\n;this.RAW=RAW;this.SOURCES=SOURCES;this.CONTEXT_INFO=typeof CONTEXT_INFO!=="undefined"?CONTEXT_INFO:{};';
const strip=s=>String(s).replace(/«[^»]*»/g,'').replace(/\b\d+-[A-Z]\b/g,'').replace(/\b[A-ZÁÉÍÓÚ][\wáéíóúñ]*\s?\d+\b/g,'');
const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);
const NUM=/\d|(?<![\p{L}])(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieci\w*|veinte|veinti\w*|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|cientos|doscient\w*|trescient\w*|quinient\w*|mil|miles|millón|millones|billón|docena|decena|década|décadas|milenio|milenios|centenar\w*|doble|triple)(?![\p{L}])|siglo\s+[IVXL]+/iu;
let bad=0;
if(process.argv[2]!=='--info-only') for(const q of ctx.RAW){ if(NUM.test(strip(q.h))){bad++;console.log('PISTA:',q.t,'=>',q.h);} }
for(const [k,v] of Object.entries(ctx.CONTEXT_INFO)){ if(NUM.test(strip(v))){bad++;console.log('FICHA:',k,'=>',v);} }
console.log(ctx.RAW.length,'preguntas;',bad,'avisos');

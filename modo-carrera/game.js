"use strict";
/* Modo Carrera Míster · datos reales EA SPORTS FC 26 (ver data.js) */

/* ================= utilidades ================= */
const R=()=>Math.random();
const ri=(a,b)=>Math.floor(a+R()*(b-a+1));
const pick=a=>a[Math.floor(R()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function gauss(){let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function poisson(l){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=R();}while(p>L);return k-1;}
function wpick(items,wf){const ws=items.map(wf);const t=ws.reduce((a,b)=>a+b,0);let r=R()*t;for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i];}return items[items.length-1];}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function money(v){const a=Math.abs(v);if(a>=1e6)return (v/1e6).toFixed(a>=1e8?0:1).replace('.',',').replace(/,0$/,'')+' M€';if(a>=1e3)return Math.round(v/1e3)+' mil €';return Math.round(v)+' €';}
function roundMoney(v){if(v>=1e7)return Math.round(v/5e5)*5e5;if(v>=1e6)return Math.round(v/1e5)*1e5;if(v>=1e5)return Math.round(v/1e4)*1e4;return Math.max(10000,Math.round(v/1e3)*1e3);}
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

/* ================= datos base ================= */
const DB=window.DB;
const POS=['POR','LD','DFC','LI','MCD','MC','MCO','ED','EI','DC'];
const GROUP={POR:'POR',LD:'DEF',DFC:'DEF',LI:'DEF',MCD:'MED',MC:'MED',MCO:'MED',ED:'DEL',EI:'DEL',DC:'DEL'};
const NEAR={LD:['LI','DFC','ED'],LI:['LD','DFC','EI'],DFC:['MCD','LD','LI'],MCD:['MC','DFC'],MC:['MCD','MCO'],MCO:['MC','DC','ED','EI'],ED:['EI','MCO','DC'],EI:['ED','MCO','DC'],DC:['MCO','ED','EI']};
function posPen(p,slot){if(p.pos===slot)return 0;if(p.alt&&p.alt.includes(slot))return 1;if(p.pos==='POR'||slot==='POR')return 35;return (NEAR[p.pos]||[]).includes(slot)?4:10;}
const STAT_LBL={field:['RIT','TIR','PAS','REG','DEF','FÍS'],POR:['EST','PAR','SAQ','REF','VEL','COL']};
const PROFILE={POR:[0,0,-8,2,-10,0],DC:[2,5,-6,1,-38,2],ED:[8,0,-2,6,-40,-8],EI:[8,0,-2,6,-40,-8],MCO:[0,2,4,6,-30,-10],MC:[-6,-4,5,2,-10,0],MCD:[-8,-12,2,-4,3,5],DFC:[-10,-35,-15,-20,4,6],LD:[5,-25,-4,-6,0,-2],LI:[5,-25,-4,-6,0,-2]};
const FORMATIONS={
 '4-3-3':[['POR',50,90],['LD',86,70],['DFC',62,75],['DFC',38,75],['LI',14,70],['MC',72,48],['MCD',50,56],['MC',28,48],['ED',84,22],['DC',50,14],['EI',16,22]],
 '4-3-3 (MCO)':[['POR',50,90],['LD',86,70],['DFC',62,75],['DFC',38,75],['LI',14,70],['MC',70,52],['MCO',50,40],['MC',30,52],['ED',84,22],['DC',50,14],['EI',16,22]],
 '4-2-3-1':[['POR',50,90],['LD',86,70],['DFC',62,75],['DFC',38,75],['LI',14,70],['MCD',63,56],['MCD',37,56],['ED',84,30],['MCO',50,34],['EI',16,30],['DC',50,13]],
 '4-4-2':[['POR',50,90],['LD',86,70],['DFC',62,75],['DFC',38,75],['LI',14,70],['ED',86,42],['MC',62,50],['MC',38,50],['EI',14,42],['DC',62,16],['DC',38,16]],
 '4-1-4-1':[['POR',50,90],['LD',86,70],['DFC',62,75],['DFC',38,75],['LI',14,70],['MCD',50,60],['ED',86,40],['MC',62,46],['MC',38,46],['EI',14,40],['DC',50,14]],
 '4-1-2-1-2':[['POR',50,90],['LD',86,70],['DFC',62,75],['DFC',38,75],['LI',14,70],['MCD',50,58],['MC',74,46],['MC',26,46],['MCO',50,34],['DC',62,15],['DC',38,15]],
 '4-4-1-1':[['POR',50,90],['LD',86,70],['DFC',62,75],['DFC',38,75],['LI',14,70],['ED',86,44],['MC',62,52],['MC',38,52],['EI',14,44],['MCO',50,32],['DC',50,14]],
 '3-4-3':[['POR',50,90],['DFC',74,74],['DFC',50,77],['DFC',26,74],['LD',88,48],['MC',62,52],['MC',38,52],['LI',12,48],['ED',82,22],['DC',50,14],['EI',18,22]],
 '3-5-2':[['POR',50,90],['DFC',74,74],['DFC',50,77],['DFC',26,74],['LD',89,46],['MC',67,50],['MCD',50,58],['MC',33,50],['LI',11,46],['DC',62,16],['DC',38,16]],
 '5-3-2':[['POR',50,90],['LD',89,64],['DFC',70,74],['DFC',50,77],['DFC',30,74],['LI',11,64],['MC',72,48],['MCD',50,54],['MC',28,48],['DC',62,17],['DC',38,17]],
 '5-4-1':[['POR',50,90],['LD',89,64],['DFC',70,74],['DFC',50,77],['DFC',30,74],['LI',11,64],['ED',84,42],['MC',60,48],['MC',40,48],['EI',16,42],['DC',50,16]]
};
const MENT=['Muy defensiva','Defensiva','Equilibrada','Ofensiva','Muy ofensiva'];
const MENT_OWN=[0.72,0.86,1,1.14,1.28],MENT_OPP=[0.74,0.87,1,1.12,1.25];
const TRAIN={descanso:{n:'Descanso',fit:34,grow:0.6},normal:{n:'Normal',fit:24,grow:1},intensivo:{n:'Intensivo',fit:14,grow:1.4}};

/* países: nombre en la base (inglés) -> [ISO, nombre en español] */
const NATION={'Spain':['ES','España'],'France':['FR','Francia'],'Germany':['DE','Alemania'],'Italy':['IT','Italia'],'England':['ENG','Inglaterra'],'Scotland':['SCT','Escocia'],'Wales':['WLS','Gales'],'Northern Ireland':['','Irlanda del Norte'],'Republic of Ireland':['IE','Irlanda'],
 'Portugal':['PT','Portugal'],'Netherlands':['NL','Países Bajos'],'Belgium':['BE','Bélgica'],'Brazil':['BR','Brasil'],'Argentina':['AR','Argentina'],'Uruguay':['UY','Uruguay'],'Colombia':['CO','Colombia'],'Ecuador':['EC','Ecuador'],'Chile':['CL','Chile'],'Paraguay':['PY','Paraguay'],'Peru':['PE','Perú'],'Venezuela':['VE','Venezuela'],'Mexico':['MX','México'],'United States':['US','Estados Unidos'],'Canada':['CA','Canadá'],'Jamaica':['JM','Jamaica'],'Panama':['PA','Panamá'],'Costa Rica':['CR','Costa Rica'],'Honduras':['HN','Honduras'],
 'Morocco':['MA','Marruecos'],'Algeria':['DZ','Argelia'],'Tunisia':['TN','Túnez'],'Egypt':['EG','Egipto'],'Senegal':['SN','Senegal'],"Côte d'Ivoire":['CI','Costa de Marfil'],'Ghana':['GH','Ghana'],'Nigeria':['NG','Nigeria'],'Cameroon':['CM','Camerún'],'Mali':['ML','Malí'],'Guinea':['GN','Guinea'],'Congo DR':['CD','R. D. del Congo'],'Burkina Faso':['BF','Burkina Faso'],'Gambia':['GM','Gambia'],'Gabon':['GA','Gabón'],'Angola':['AO','Angola'],'Togo':['TG','Togo'],'Cabo Verde':['CV','Cabo Verde'],'Equatorial Guinea':['GQ','Guinea Ecuatorial'],'South Africa':['ZA','Sudáfrica'],'Guinea-Bissau':['GW','Guinea-Bisáu'],'Benin':['BJ','Benín'],'Zambia':['ZM','Zambia'],'Zimbabwe':['ZW','Zimbabue'],'Comoros':['KM','Comoras'],'Mauritania':['MR','Mauritania'],'Sierra Leone':['SL','Sierra Leona'],'Central African Republic':['CF','R. Centroafricana'],'Congo':['CG','Congo'],
 'Denmark':['DK','Dinamarca'],'Sweden':['SE','Suecia'],'Norway':['NO','Noruega'],'Finland':['FI','Finlandia'],'Iceland':['IS','Islandia'],'Switzerland':['CH','Suiza'],'Austria':['AT','Austria'],'Poland':['PL','Polonia'],'Czechia':['CZ','Chequia'],'Slovakia':['SK','Eslovaquia'],'Hungary':['HU','Hungría'],'Croatia':['HR','Croacia'],'Serbia':['RS','Serbia'],'Slovenia':['SI','Eslovenia'],'Bosnia and Herzegovina':['BA','Bosnia'],'Montenegro':['ME','Montenegro'],'North Macedonia':['MK','Macedonia del Norte'],'Albania':['AL','Albania'],'Kosovo':['XK','Kosovo'],'Greece':['GR','Grecia'],'Türkiye':['TR','Turquía'],'Romania':['RO','Rumanía'],'Bulgaria':['BG','Bulgaria'],'Ukraine':['UA','Ucrania'],'Russia':['RU','Rusia'],'Georgia':['GE','Georgia'],'Armenia':['AM','Armenia'],'Israel':['IL','Israel'],'Lithuania':['LT','Lituania'],'Luxembourg':['LU','Luxemburgo'],
 'Japan':['JP','Japón'],'Korea Republic':['KR','Corea del Sur'],'Australia':['AU','Australia'],'New Zealand':['NZ','Nueva Zelanda'],'Saudi Arabia':['SA','Arabia Saudí'],'Iran':['IR','Irán'],'China PR':['CN','China'],'Indonesia':['ID','Indonesia'],'Haiti':['HT','Haití'],'Suriname':['SR','Surinam'],'Dominican Republic':['DO','R. Dominicana'],'Curaçao':['CW','Curazao']};
const SUBFLAG={ENG:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',SCT:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',WLS:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}'};
function flag(n){const x=NATION[n];if(!x||!x[0])return '';const c=x[0];if(SUBFLAG[c])return SUBFLAG[c];if(c.length!==2)return '';return String.fromCodePoint(...[...c].map(ch=>127397+ch.charCodeAt(0)));}
function natName(n){return NATION[n]?NATION[n][1]:n;}

/* nombres para canteranos y regenerados */
const NAMES={
 Spain:{first:['Álvaro','Pablo','Sergio','Javier','Marcos','Hugo','Daniel','Adrián','Iker','Unai','Raúl','Diego','Carlos','Rubén','Jorge','Mario','Víctor','Alejandro','Óscar','Gonzalo','Nico','Pedro','Aitor','Borja','Rodrigo','Samuel','Lucas','Martín','Íñigo','Gorka','Mikel','Pau','Jordi','Joan','Sergi','Rafa','Manu','Izan','Marc','Eric'],
   last:['García','Fernández','López','Martínez','Sánchez','Pérez','Gómez','Martín','Jiménez','Ruiz','Hernández','Díaz','Moreno','Muñoz','Álvarez','Romero','Navarro','Torres','Domínguez','Gil','Vázquez','Serrano','Ramos','Blanco','Molina','Morales','Ortega','Delgado','Castro','Ortiz','Rubio','Marín','Sanz','Iglesias','Medina','Garrido','Cortés','Castillo','Santos','Lozano','Guerrero','Cano','Prieto','Méndez','Calvo','Gallego','Vidal','León','Herrera','Peña','Cabrera','Vega','Fuentes','Carrasco','Reyes','Nieto','Aguilar','Pascual','Lorenzo','Hidalgo','Montero','Ibáñez','Ferrer','Durán','Benítez','Mora','Arias','Crespo','Soler','Parra','Bravo','Etxeberria','Aguirre','Arrieta','Puig','Roca']},
 England:{first:['Harry','Jack','Oliver','George','Charlie','Alfie','Mason','Callum','Jordan','Kyle','Reece','Declan','Conor','Lewis','Jamie','Ben','Tom','Sam','Ryan','Josh','Archie','Freddie','Jude','Cole'],last:['Smith','Jones','Taylor','Brown','Wilson','Davies','Evans','Walker','Wright','Robinson','Thompson','White','Hughes','Edwards','Green','Hall','Wood','Harris','Clarke','Jackson','Turner','Hill','Ward','Morris','Cooper','Palmer','Rice','Mainoo']},
 France:{first:['Lucas','Théo','Hugo','Mathis','Antoine','Jules','Raphaël','Moussa','Ousmane','Aurélien','Maxence','Rayan','Enzo','Kylian','Bradley','Warren','Désiré'],last:['Martin','Bernard','Dubois','Lefebvre','Moreau','Laurent','Girard','Fofana','Camara','Diallo','Lemaire','Roux','Mendy','Kone','Traoré','Petit','Durand','Lambert']},
 Germany:{first:['Leon','Jonas','Florian','Niklas','Kai','Julian','Lukas','Timo','Felix','Jamal','Maximilian','Paul','Finn','Nico','Tim'],last:['Müller','Schmidt','Wagner','Becker','Hoffmann','Krämer','Weber','Fischer','Brandt','Schulz','Koch','Richter','Wolf','Neuhaus','Schäfer']},
 Italy:{first:['Lorenzo','Federico','Nicolò','Alessandro','Matteo','Gianluca','Davide','Sandro','Andrea','Francesco','Riccardo','Giacomo','Tommaso','Simone'],last:['Rossi','Bianchi','Romano','Esposito','Ricci','Colombo','Conti','Greco','Bruno','Gallo','Costa','Fontana','Moretti','Marino','Barbieri','Lombardi']},
 Argentina:{first:['Lautaro','Thiago','Facundo','Julián','Enzo','Valentín','Agustín','Franco','Nahuel','Matías','Gonzalo','Leandro'],last:['Acosta','Correa','Ferreyra','Paredes','Medina','Ríos','Sosa','Funes','Godoy','Romero','Molina','Ledesma']},
 Brazil:{first:['Gabriel','Matheus','Vinícius','João','Lucas','Rafael','Bruno','Thiago','Igor','Caio','Felipe','Danilo'],last:['Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Ribeiro','Almeida','Carvalho','Rocha','Nascimento']},
 Portugal:{first:['João','Rúben','Diogo','Gonçalo','Rafael','Nuno','Tiago','André','Bernardo','Francisco'],last:['Ferreira','Gomes','Mendes','Neves','Cardoso','Leão','Ramos','Pinto','Teixeira','Fonseca']},
 Uruguay:{first:['Federico','Rodrigo','Manuel','Facundo','Maxi','Ronald','Sebastián'],last:['Valverde','Araujo','Olivera','Ugarte','Giménez','Viña','Pereiro']},
 Colombia:{first:['Luis','James','Jhon','Daniel','Juan','Andrés','Camilo'],last:['Díaz','Arias','Mina','Muñoz','Lerma','Borré','Córdoba']},
 Morocco:{first:['Achraf','Youssef','Hakim','Sofyan','Azzedine','Bilal','Ilias','Abde','Ayoub'],last:['Amrabat','Ounahi','El Khannouss','Ezzalzouli','Akhomach','Saibari','Bennani','Brahimi']},
 Senegal:{first:['Sadio','Ismaïla','Pape','Idrissa','Nicolas','Kalidou','Iliman','Habib'],last:['Sarr','Gueye','Diatta','Ndiaye','Diallo','Cissé','Dieng','Faye']},
 Nigeria:{first:['Victor','Samuel','Ademola','Wilfred','Kelechi','Alex','Calvin'],last:['Chukwueze','Ndidi','Iwobi','Aina','Ejuke','Onyeka','Osayi']},
 Netherlands:{first:['Frenkie','Cody','Xavi','Teun','Ryan','Denzel','Joey','Micky'],last:['de Jong','Bakker','Visser','Smit','de Vries','Timber','Koopmeiners','van de Ven']}
};
const REGION_NATS={SA:['Argentina','Brazil','Uruguay','Colombia'],EU:['France','Portugal','Germany','Italy','Netherlands','England'],AF:['Morocco','Senegal','Nigeria']};
const COUNTRY_NAT={'España':'Spain','Inglaterra':'England','Italia':'Italy','Alemania':'Germany','Francia':'France'};
function pickNat(region,country){const local=COUNTRY_NAT[country]||'Spain';
  if(region==='LOC')return R()<0.85?local:pick(['Argentina','Brazil','Uruguay','France','Morocco']);
  if(REGION_NATS[region])return pick(REGION_NATS[region]);
  return R()<0.7?local:pick(Object.keys(NAMES));}
function genName(nat){const d=NAMES[nat]||NAMES.Spain;const f=pick(d.first),l=pick(d.last);return f.charAt(0)+'. '+l;}

/* ================= estado ================= */
let S=null;
const UI={view:'home',sqSort:'pos',selSlot:null,mk:{pos:'',maxAge:40,minOvr:70,maxPrice:0,q:'',league:'',page:0},leagueTab:'tabla',leagueDiv:null,round:null,newClub:null,startDiv:0,match:null,pendingSubOut:null};
const SAVE_KEY='modo_carrera_mister_real_v2';

function P(id){return S.players[id];}
function me(){return S.clubs[S.user.clubId];}
function userDiv(){return S.divs[me().div];}
function seasonLabel(off){const y=2025+S.season-1+(off||0);return y+'/'+String((y+1)%100).padStart(2,'0');}

/* índice de plantillas: se reconstruye al cambiar jugadores de club */
let ROSTER=null;
function invalidate(){ROSTER=null;}
function roster(){if(!ROSTER){ROSTER=new Map();for(const k in S.players){const p=S.players[k];if(p.clubId==null)continue;let a=ROSTER.get(p.clubId);if(!a)ROSTER.set(p.clubId,a=[]);a.push(p);}}return ROSTER;}
function squad(cid,incYouth){const a=roster().get(cid)||[];return incYouth?a.slice():a.filter(p=>!p.youth);}

function baseValue(p){let v=50000*Math.exp(0.18*(p.ovr-45));const a=p.age;
  const af=a<=20?1.5:a<=23?1.35:a<=27?1.15:a<=29?0.95:a<=31?0.7:a<=33?0.45:0.25;
  const potB=a<=24?1+Math.max(0,p.pot-p.ovr)*0.035:1;return v*af*potB;}
function valueOf(p){let v=baseValue(p)*(p.vm||1);if(p.contract<=1&&p.clubId!=null)v*=0.8;return roundMoney(v);}
function wageFor(p,rep){const v=valueOf(p);return Math.max(1000,Math.round(v*0.0016*(0.7+rep*0.12)/500)*500);}
function stats6(p){if(p.st&&p.pos!=='POR'&&p.st.some(x=>x>0)){const d=p.ovr-p.ovr0;return p.st.map(v=>clamp(v+d,20,99));}
  const pr=PROFILE[p.pos];return pr.map((o,i)=>clamp(Math.round(p.ovr+o+(p.var?p.var[i]:0)),20,99));}
function ovrClass(o){return o>=80?'o80':o>=75?'o75':o>=70?'o70':'';}
function newStats(){return {apps:0,goals:0,assists:0,rsum:0,yel:0,red:0,cs:0};}
function repFromLevel(l){return clamp((l-58)/5.5,1,5);}

function makePlayer(o){
  const id=S.nextId++;const club=o.clubId!=null?S.clubs[o.clubId]:null;
  const nat=o.nat||pickNat(o.region,club?club.country:'España');
  const age=o.age;const ovr=clamp(Math.round(o.ovr),40,94);
  const pot=o.pot!=null?o.pot:clamp(Math.round(ovr+Math.max(0,26-age)*(0.8+R()*1.6)+ri(0,3)),ovr,95);
  const p={id,name:genName(nat),nat,age,pos:o.pos,alt:[o.pos],ovr,ovr0:ovr,pot,clubId:o.clubId??null,youth:!!o.youth,contract:o.contract??ri(1,5),wage:0,vm:1,
    morale:ri(60,80),fitness:100,injury:0,susp:0,yellows:0,prog:0,listed:false,stats:newStats(),hist:[],var:[0,0,0,0,0,0].map(()=>ri(-4,4)),num:0,gen:1};
  p.wage=p.youth?1000:wageFor(p,club?club.rep:2);
  S.players[id]=p;invalidate();return p;}

function assignNumbers(cid){const used=new Set();const sq=squad(cid,true).sort((a,b)=>b.ovr-a.ovr);
  sq.forEach(p=>{if(p.num&&!used.has(p.num))used.add(p.num);else p.num=0;});
  const pref={POR:[1,13,25],LD:[2,12,22],DFC:[4,5,3,15,24],LI:[3,23,18],MCD:[6,16,14],MC:[8,14,16,20],MCO:[10,21,19],ED:[7,17,11],EI:[11,17,7],DC:[9,19,18]};
  sq.forEach(p=>{if(p.num)return;let n=(pref[p.pos]||[]).find(x=>!used.has(x));if(!n){n=26;while(used.has(n))n++;}p.num=n;used.add(n);});}

function newGame(managerName,clubIdx){
  S={v:2,nextId:1,season:1,week:0,W:0,user:{name:managerName||'Míster',clubId:clubIdx,history:[],trophies:0},clubs:[],players:{},divs:[],news:[],neg:{},scout:null,
     board:{conf:60,target:10,objective:''},training:'normal',msgId:1,over:false,seasonDone:false};
  DB.divs.forEach((d,i)=>S.divs.push({id:d.id,name:d.n,country:d.c,tier:d.t,sw:d.sw,clubs:d.clubs.slice(),fx:[],rw:[]}));
  DB.clubs.forEach((c,i)=>S.clubs.push({id:i,name:c.n,short:c.s,c1:c.c1,c2:c.c2,stadium:c.st,league:c.l,div:c.d,ext:c.d<0,country:c.d>=0?DB.divs[c.d].c:'',
    budget:c.b,budget0:c.b,wageBudget:c.w,formation:'4-3-3',ment:2,lineup:null,lvl0:70,rep:2}));
  DB.players.forEach(r=>{const id=S.nextId++;const alt=r[1].split('/');
    const p={id,name:r[0],pos:alt[0],alt,ovr:r[2],ovr0:r[2],pot:Math.max(r[2],r[3]),age:r[6],nat:DB.nats[r[7]],clubId:r[8]<0?null:r[8],youth:false,
      contract:r[8]<0?0:(r[6]<=23?ri(2,5):r[6]<=29?ri(1,4):ri(1,2)),wage:Math.max(500,r[5]),vm:1,morale:ri(62,82),fitness:100,injury:0,susp:0,yellows:0,prog:0,listed:false,
      stats:newStats(),hist:[],st:r.slice(9,15),foot:r[15],num:0};
    if(r[4]>0)p.vm=clamp(r[4]/baseValue(p),0.3,3);
    S.players[id]=p;});
  invalidate();
  S.clubs.forEach(c=>{if(c.ext){const sq=squad(c.id).sort((a,b)=>b.ovr-a.ovr).slice(0,11);c.lvl0=sq.length?sq.reduce((s,p)=>s+p.ovr,0)/sq.length:68;}
    else{c.formation=pickFormation(c.id);c.lvl0=clubLevel(c.id);maintainSquad(c.id,true);assignNumbers(c.id);}
    c.rep=repFromLevel(c.lvl0);});
  me().formation='4-3-3';
  startSeason(true);
  addNews('Bienvenido, '+esc(S.user.name),`La directiva de ${esc(me().name)} te presenta como nuevo entrenador. Objetivo para la temporada ${seasonLabel()}: <b>${S.board.objective}</b>. Presupuesto de fichajes: <b>${money(me().budget)}</b>. El mercado de verano está abierto.`,'info');
  save();
}
function pickFormation(cid){const sq=squad(cid);const cnt=g=>sq.filter(p=>GROUP[p.pos]===g||p.alt.some(a=>GROUP[a]===g)).length;
  const dfc=sq.filter(p=>p.pos==='DFC').length,wing=sq.filter(p=>p.pos==='ED'||p.pos==='EI').length,mco=sq.filter(p=>p.pos==='MCO').length,dc=sq.filter(p=>p.pos==='DC').length;
  if(dfc>=6&&R()<0.4)return pick(['3-5-2','3-4-3','5-3-2']);if(wing>=4)return pick(['4-3-3','4-2-3-1']);if(dc>=4)return '4-4-2';if(mco>=2)return pick(['4-2-3-1','4-1-2-1-2']);return pick(['4-3-3','4-2-3-1','4-4-2','4-1-4-1']);}

/* ================= temporada ================= */
function makeFixtures(d){
  const ids=shuffle(d.clubs.slice());const n=ids.length;const rounds=[];const arr=ids.slice();
  const streak={};ids.forEach(id=>streak[id]=0);
  for(let r=0;r<n-1;r++){const rd=[];for(let i=0;i<n/2;i++){let h=arr[i],a=arr[n-1-i];
      if(streak[h]>streak[a]||(streak[h]===streak[a]&&R()<0.5))[h,a]=[a,h];
      streak[h]=streak[h]>0?streak[h]+1:1;streak[a]=streak[a]<0?streak[a]-1:-1;
      rd.push({h,a,hg:null,ag:null,played:false,ev:[]});}
    rounds.push(rd);arr.splice(1,0,arr.pop());}
  d.fx=rounds.concat(rounds.map(rd=>rd.map(f=>({h:f.a,a:f.h,hg:null,ag:null,played:false,ev:[]}))));
}
function clubLevel(cid){const c=S.clubs[cid];if(c.ext)return c.lvl0;const xi=bestXI(cid,c.formation,true);return xi.reduce((s,id,i)=>s+(id?P(id).ovr-posPen(P(id),FORMATIONS[c.formation][i][0]):50),0)/11;}
function startSeason(first){
  S.week=0;S.seasonDone=false;
  S.divs.forEach(makeFixtures);
  S.W=Math.max(...S.divs.map(d=>d.fx.length));
  S.divs.forEach(d=>{const Rn=d.fx.length;d.rw=d.fx.map((_,r)=>Rn>1?Math.round(r*(S.W-1)/(Rn-1)):0);});
  setObjective();
  if(!first)S.board.conf=clamp(S.board.conf,35,80);
  S.clubs.forEach(c=>{c.lineup=null;});
}
function setObjective(){
  const d=userDiv();const n=d.clubs.length;
  const ranked=d.clubs.map(id=>({id,l:clubLevel(id)})).sort((a,b)=>b.l-a.l);
  const idx=ranked.findIndex(x=>x.id===S.user.clubId);let target,obj;
  if(d.tier===1){
    if(idx===0){target=1;obj='Ganar la liga';}
    else if(idx<=3){target=4;obj='Clasificarse para la Champions League (top 4)';}
    else if(idx<=6){target=7;obj='Clasificarse para competición europea (top 7)';}
    else if(idx<=n-7){target=Math.round(n*0.6);obj=`Terminar en mitad de tabla (top ${Math.round(n*0.6)})`;}
    else {target=n-d.sw;obj='Evitar el descenso';}
  } else {
    if(idx<d.sw){target=d.sw;obj='Lograr el ascenso directo';}
    else if(idx<=6){target=6;obj='Pelear por el ascenso (top 6)';}
    else if(idx<=n-7){target=Math.round(n*0.6);obj=`Terminar en mitad de tabla (top ${Math.round(n*0.6)})`;}
    else {target=n-4;obj='Evitar los puestos de descenso';}
  }
  S.board.target=target;S.board.objective=obj;
}
function table(di){
  const d=S.divs[di];const t={};d.clubs.forEach(id=>t[id]={id,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0,form:[]});
  d.fx.forEach(rd=>rd.forEach(f=>{if(!f.played)return;const h=t[f.h],a=t[f.a];if(!h||!a)return;
    h.pj++;a.pj++;h.gf+=f.hg;h.gc+=f.ag;a.gf+=f.ag;a.gc+=f.hg;
    if(f.hg>f.ag){h.g++;a.p++;h.pts+=3;h.form.push('W');a.form.push('L');}else if(f.hg<f.ag){a.g++;h.p++;a.pts+=3;a.form.push('W');h.form.push('L');}else{h.e++;a.e++;h.pts++;a.pts++;h.form.push('D');a.form.push('D');}}));
  return Object.values(t).sort((x,y)=>y.pts-x.pts||(y.gf-y.gc)-(x.gf-x.gc)||y.gf-x.gf||S.clubs[x.id].name.localeCompare(S.clubs[y.id].name));
}
function myPosition(){return table(me().div).findIndex(r=>r.id===S.user.clubId)+1;}
function posLabel(){const r=table(me().div).find(x=>x.id===S.user.clubId);return r&&r.pj?myPosition()+'º':'—';}
const SUMMER_END=4,WINTER_START=21,WINTER_END=25;
function windowOpen(){return S.week<=SUMMER_END||(S.week>=WINTER_START&&S.week<=WINTER_END);}
function userRoundAtWeek(w){const d=userDiv();let r=0;d.rw.forEach((x,i)=>{if(x<=w)r=i+1;});return r;}
function windowLabel(){if(S.week<=SUMMER_END)return 'Mercado de verano abierto (hasta J'+userRoundAtWeek(SUMMER_END)+')';
  if(S.week>=WINTER_START&&S.week<=WINTER_END)return 'Mercado de invierno abierto (hasta J'+userRoundAtWeek(WINTER_END)+')';
  return S.week<WINTER_START?'Mercado cerrado · invierno desde J'+(userRoundAtWeek(WINTER_START-1)+1):'Mercado cerrado hasta verano';}
function nextFixture(){const d=userDiv();const uid=S.user.clubId;for(let r=0;r<d.fx.length;r++){const f=d.fx[r].find(x=>x.h===uid||x.a===uid);if(f&&!f.played)return {fx:f,round:r,week:d.rw[r]};}return null;}
function userHasMatchAt(w){const d=userDiv();return d.rw.some((x,r)=>x===w&&d.fx[r].some(f=>(f.h===S.user.clubId||f.a===S.user.clubId)&&!f.played));}

/* ================= alineaciones ================= */
function available(p){return p.injury===0&&p.susp===0;}
function bestXI(cid,formation,ignoreFit){
  const slots=FORMATIONS[formation]||FORMATIONS['4-3-3'];const pool=squad(cid).filter(available);const used=new Set();const xi=new Array(11).fill(null);
  const order=slots.map((s,i)=>i).sort((a,b)=>(slots[a][0]==='POR'?-1:0)-(slots[b][0]==='POR'?-1:0));
  const score=(p,pos)=>p.ovr-posPen(p,pos)-(ignoreFit?0:Math.max(0,70-p.fitness)*0.35);
  for(const natural of [true,false])for(const i of order){if(xi[i])continue;const pos=slots[i][0];let best=null,bs=-1e9;
    for(const p of pool){if(used.has(p.id)||(natural&&posPen(p,pos)>1))continue;const sc=score(p,pos);if(sc>bs){bs=sc;best=p;}}
    if(best){xi[i]=best.id;used.add(best.id);}}
  return xi;
}
function bench(cid,xi){const s=new Set(xi);return squad(cid).filter(p=>!s.has(p.id)&&available(p)).sort((a,b)=>b.ovr-a.ovr).slice(0,9).map(p=>p.id);}
function userLineup(){const c=me();if(!c.lineup||c.lineup.length!==11)c.lineup=bestXI(c.id,c.formation);return c.lineup;}
function lineupProblems(){const xi=userLineup();const out=[];xi.forEach((id,i)=>{const p=id&&P(id);if(!p||p.clubId!==S.user.clubId||p.youth||!available(p))out.push(i);});return out;}
function fixLineup(){const c=me();const xi=userLineup();const probs=lineupProblems();if(!probs.length)return;
  const used=new Set(xi.filter((id,i)=>!probs.includes(i)));const pool=squad(c.id).filter(p=>available(p)&&!used.has(p.id));
  probs.forEach(i=>{const pos=FORMATIONS[c.formation][i][0];let best=null,bs=-1e9;pool.forEach(p=>{if(used.has(p.id))return;const sc=p.ovr-posPen(p,pos)-Math.max(0,70-p.fitness)*.35;if(sc>bs){bs=sc;best=p;}});xi[i]=best?best.id:null;if(best)used.add(best.id);});}

/* ================= motor de partido ================= */
const COM={
 miss:['{p} prueba desde fuera del área, pero se marcha desviado.','Disparo de {p} que se va por encima del larguero.','{p} remata de cabeza, sin dirección.','Contra rápida, {p} dispara y el balón roza el palo.','{p} se perfila y chuta… ¡fuera por poco!'],
 save:['¡Paradón de {k}! Saca el disparo de {p}.','{p} lo intenta con potencia, {k} atrapa sin problemas.','Mano a mano de {p}, gana {k}.','{k} vuela para desviar el chut de {p} a córner.'],
 goal:['¡GOOOL! {p} la manda a la red.','¡GOL de {p}! Definición perfecta.','¡GOL! {p} empuja el balón a placer.','¡Golazo de {p} desde la frontal!','¡GOL! Cabezazo imparable de {p}.'],
 assist:[' Gran pase de {a}.',' Asistencia de {a}.',' Centro medido de {a}.',''],
 yellow:['Tarjeta amarilla para {p} por una entrada tardía.','Amarilla a {p} por protestar.','{p} corta la contra con falta y ve la amarilla.'],
 red:['¡Tarjeta roja directa para {p}! Su equipo se queda con diez.','¡Segunda amarilla a {p}! Expulsado.'],
 inj:['{p} se duele y tiene que ser atendido. No puede continuar.'],
 sub:['Cambio en {t}: entra {i}, sale {o}.']
};
const fill=(s,o)=>s.replace(/\{(\w)\}/g,(m,k)=>o[k]??'');
function makeSide(cid,isUser){
  const c=S.clubs[cid];let xi;
  if(isUser){fixLineup();xi=userLineup().slice();}else xi=bestXI(cid,c.formation);
  const slots=FORMATIONS[c.formation].map(s=>s[0]);
  const side={cid,isUser,slots,xi,bench:bench(cid,xi),subs:0,ment:isUser?c.ment:2,goals:0,shots:0,sot:0,on:{},mins:{},fit:{},contrib:{},yellows:{},red:new Set(),saves:0};
  xi.forEach(id=>{if(id){side.on[id]=0;side.fit[id]=P(id).fitness;side.contrib[id]={g:0,a:0};}});
  return side;
}
function sideStrength(s){let sum=0;s.xi.forEach((id,i)=>{if(!id||s.red.has(id))return;const p=P(id);const f=s.fit[id]??p.fitness;
  sum+=(p.ovr-posPen(p,s.slots[i]))*(0.84+0.16*f/100)+(p.morale-60)/20;});
  const missing=s.xi.filter(id=>!id||s.red.has(id)).length;const n=11-missing;return n?sum/n-missing*2.5:0;}
function createMatch(fx,live){
  const uid=S.user.clubId;
  return {fx,live,min:0,half:1,st1:ri(1,3),st2:ri(2,6),ended:false,paused:false,ev:[],home:makeSide(fx.h,fx.h===uid),away:makeSide(fx.a,fx.a===uid)};}
function lambdas(m){const h=m.home,a=m.away;const d=sideStrength(h)+1.6-sideStrength(a);
  const lh=1.14*Math.exp(0.058*d)*MENT_OWN[h.ment]*MENT_OPP[a.ment],la=1.04*Math.exp(-0.058*d)*MENT_OWN[a.ment]*MENT_OPP[h.ment];
  return [clamp(lh,0.15,5),clamp(la,0.15,5)];}
function onPitch(s){return s.xi.filter(id=>id&&!s.red.has(id));}
function slotOf(s,id){return s.slots[s.xi.indexOf(id)];}
function shooter(s){return wpick(onPitch(s),id=>{const w={DC:6,ED:3.2,EI:3.2,MCO:3,MC:1.3,MCD:.6,LD:.5,LI:.5,DFC:.45,POR:.01}[slotOf(s,id)]||1;return w*Math.pow(1.06,P(id).ovr-70);});}
function assister(s,ex){const c=onPitch(s).filter(id=>id!==ex);if(!c.length)return null;return wpick(c,id=>({MCO:4,MC:3,ED:3.5,EI:3.5,DC:2,LD:1.6,LI:1.6,MCD:1.2,DFC:.4,POR:.05}[slotOf(s,id)]||1)*Math.pow(1.05,P(id).ovr-70));}
function keeper(s){return onPitch(s).find(id=>slotOf(s,id)==='POR')||onPitch(s)[0];}
function nm(id){const p=P(id);return p?p.name:'—';}
function push(m,min,type,text,side){m.ev.push({min,type,text,side});}
function stepMinute(m){
  if(m.ended)return;m.min++;const min=m.min;const dm=m.half===1?Math.min(min,45):Math.min(min,90);
  const [lh,la]=lambdas(m);
  [[m.home,m.away,lh],[m.away,m.home,la]].forEach(([s,o,l])=>{
    const side=s===m.home?'h':'a';
    onPitch(s).forEach(id=>{s.fit[id]=Math.max(20,(s.fit[id]??100)-0.22-R()*0.12);});
    if(R()<l*9/90){s.shots++;const sh=shooter(s);if(!sh)return;
      if(R()<0.36){s.sot++;
        if(R()<0.31){s.goals++;const as=R()<0.72?assister(s,sh):null;s.contrib[sh].g++;if(as)s.contrib[as].a++;
          m.fx.ev.push({t:'g',side,pid:sh,as,min:dm});
          push(m,dm,'goal',fill(pick(COM.goal),{p:nm(sh)})+(as?fill(pick(COM.assist),{a:nm(as)}):''),side);}
        else{o.saves++;if(m.live&&R()<0.6)push(m,dm,'save',fill(pick(COM.save),{p:nm(sh),k:nm(keeper(o))}),side);}}
      else if(m.live&&R()<0.45)push(m,dm,'miss',fill(pick(COM.miss),{p:nm(sh)}),side);}
    if(R()<0.021){const pl=pick(onPitch(s));if(pl){s.yellows[pl]=(s.yellows[pl]||0)+1;
      if(s.yellows[pl]>=2){s.red.add(pl);m.fx.ev.push({t:'r',pid:pl,min:dm});push(m,dm,'card-r',fill(COM.red[1],{p:nm(pl)}),side);}
      else push(m,dm,'card-y',fill(pick(COM.yellow),{p:nm(pl)}),side);}}
    if(R()<0.0006){const pl=pick(onPitch(s).filter(id=>slotOf(s,id)!=='POR'));if(pl){s.red.add(pl);s.straight=(s.straight||[]).concat(pl);m.fx.ev.push({t:'r',pid:pl,min:dm});push(m,dm,'card-r',fill(COM.red[0],{p:nm(pl)}),side);}}
    if(R()<0.0016){const pl=pick(onPitch(s));if(pl){s.injured=(s.injured||[]).concat(pl);push(m,dm,'inj',fill(COM.inj[0],{p:nm(pl)}),side);autoSub(m,s,pl,true);}}
  });
  const mh=midStr(m.home),ma=midStr(m.away);m.home.pt=(m.home.pt||0)+mh/(mh+ma);m.away.pt=(m.away.pt||0)+ma/(mh+ma);
  [m.home,m.away].forEach(s=>{if(s.isUser&&m.live)return;if([58,68,78].includes(min)&&m.half===2&&s.subs<5){const tired=onPitch(s).filter(id=>slotOf(s,id)!=='POR').sort((a,b)=>s.fit[a]-s.fit[b]);if(tired.length&&s.fit[tired[0]]<80)autoSub(m,s,tired[0],false);}});
  if(m.half===1&&min>=45+m.st1){m.half=2;m.min=45;push(m,45,'info','Descanso. '+scoreStr(m),'');if(m.live){m.paused=true;}}
  else if(m.half===2&&min>=90+m.st2){m.ended=true;push(m,90,'info','¡Final del partido! '+scoreStr(m),'');}
}
function midStr(s){let sum=0,n=0;s.xi.forEach((id,i)=>{if(!id||s.red.has(id))return;if(GROUP[s.slots[i]]==='MED'){sum+=P(id).ovr;n++;}});return Math.max(1,(n?sum/n:60)-55+n*3);}
function scoreStr(m){return `${S.clubs[m.home.cid].short} ${m.home.goals}-${m.away.goals} ${S.clubs[m.away.cid].short}`;}
function autoSub(m,s,outId,forced){
  if(s.subs>=5||!s.bench.length){if(forced)s.red.add(outId);return false;}
  const pos=slotOf(s,outId);const inId=s.bench.slice().sort((a,b)=>(P(b).ovr-posPen(P(b),pos))-(P(a).ovr-posPen(P(a),pos)))[0];
  doSub(m,s,outId,inId);return true;}
function doSub(m,s,outId,inId){const i=s.xi.indexOf(outId);if(i<0)return;const min=m.half===1?Math.min(45,m.min):Math.min(90,m.min);
  s.mins[outId]=(s.mins[outId]||0)+(min-s.on[outId]);delete s.on[outId];
  s.xi[i]=inId;s.bench=s.bench.filter(x=>x!==inId);s.on[inId]=min;s.fit[inId]=P(inId).fitness;s.contrib[inId]=s.contrib[inId]||{g:0,a:0};s.subs++;
  push(m,min,'sub',fill(COM.sub[0],{t:S.clubs[s.cid].short,i:nm(inId),o:nm(outId)}),s===m.home?'h':'a');}
function simToEnd(m){let g=0;while(!m.ended&&g++<200){m.paused=false;stepMinute(m);}}

function finalizeMatch(m){
  const fx=m.fx;fx.hg=m.home.goals;fx.ag=m.away.goals;fx.played=true;
  const ratings={};const userGame=m.home.isUser||m.away.isUser;
  [[m.home,m.away],[m.away,m.home]].forEach(([s,o])=>{
    onPitch(s).forEach(id=>{s.mins[id]=(s.mins[id]||0)+(90-s.on[id]);});
    s.red.forEach(id=>{if(s.on[id]!=null){const ev=fx.ev.find(e=>e.t==='r'&&e.pid===id);s.mins[id]=(s.mins[id]||0)+((ev?ev.min:90)-s.on[id]);}});
    const res=s.goals>o.goals?1:s.goals<o.goals?-1:0;
    Object.keys(s.mins).forEach(k=>{const id=+k;const p=P(id);if(!p)return;const mins=s.mins[id];if(mins<=0)return;
      const c=s.contrib[id]||{g:0,a:0};const g=GROUP[p.pos];
      let r=6.1+gauss()*0.35+c.g*1.0+c.a*0.6+res*0.35+(p.ovr-72)*0.02;
      if(g==='DEF'||g==='POR')r+=o.goals===0?0.6:-0.18*o.goals;
      if(g==='POR')r+=s.saves*0.12;
      if(s.yellows[id])r-=0.2;if(s.red.has(id)&&!(s.injured||[]).includes(id))r-=1.5;
      if(mins<25)r=6.2+(r-6.2)*0.5;r=clamp(Math.round(r*10)/10,3,10);ratings[id]=r;
      p.stats.apps++;p.stats.goals+=c.g;p.stats.assists+=c.a;p.stats.rsum+=r;
      if((g==='DEF'||g==='POR')&&o.goals===0&&mins>=60)p.stats.cs++;
      p.fitness=clamp(Math.round(s.fit[id]??p.fitness),15,100);
      p.morale=clamp(p.morale+(r>=7.5?4:r<6?-3:1),15,100);
      p.played=true;});
    Object.entries(s.yellows).forEach(([id,n])=>{const p=P(+id);if(!p)return;p.stats.yel++;p.yellows++;if(n<2&&p.yellows%5===0)p.susp=Math.max(p.susp,1);});
    s.red.forEach(id=>{const p=P(id);if(!p||(s.injured||[]).includes(id))return;p.stats.red++;p.susp=Math.max(p.susp,(s.straight||[]).includes(id)?2:1);});
    (s.injured||[]).forEach(id=>{const p=P(id);if(p)p.injury=ri(1,6);});
    squad(s.cid).forEach(p=>{p.morale=clamp(p.morale+res*2,15,100);});
  });
  if(userGame)fx.ratings=ratings;
  return ratings;
}
function quickSim(fx){const m=createMatch(fx,false);simToEnd(m);finalizeMatch(m);return m;}
/* simulación rápida para el resto de divisiones */
function fastSim(fx){
  const m=createMatch(fx,false);const [lh,la]=lambdas(m);
  [[m.home,poisson(lh),'h'],[m.away,poisson(la),'a']].forEach(([s,g,side])=>{
    for(let i=0;i<g;i++){const sh=shooter(s);if(!sh)break;const as=R()<0.72?assister(s,sh):null;s.goals++;s.contrib[sh].g++;if(as)s.contrib[as].a++;fx.ev.push({t:'g',side,pid:sh,as,min:ri(1,90)});}
    s.shots=g*3+ri(3,9);s.sot=g+ri(1,4);s.saves=ri(1,5);
    onPitch(s).forEach(id=>{s.fit[id]=Math.max(30,s.fit[id]-18-R()*8);});
    const ny=poisson(1.8);for(let i=0;i<ny;i++){const pl=pick(onPitch(s));if(pl)s.yellows[pl]=1;}
    if(R()<0.11){const pl=pick(onPitch(s));if(pl){s.injured=[pl];}}
    m.half=2;for(let i=0;i<3&&s.bench.length;i++){m.min=ri(58,80);const out=pick(onPitch(s).filter(id=>slotOf(s,id)!=='POR'&&!(s.injured||[]).includes(id)));if(out)doSub(m,s,out,s.bench[0]);}
  });
  fx.ev.sort((a,b)=>a.min-b.min);finalizeMatch(m);
}

/* ================= semana ================= */
function processWeek(w){
  invalidate();const ud=me().div;
  S.divs.forEach((d,di)=>{d.rw.forEach((wk,r)=>{if(wk!==w)return;d.fx[r].forEach(f=>{if(f.played)return;if(di===ud)quickSim(f);else fastSim(f);});});});
  weeklyUpdate(w);
}
function weeklyUpdate(w){
  const tr=TRAIN[S.training];const myLvl=clubLevel(S.user.clubId);const myXI=me().lineup||[];
  const divPlayed=new Set();S.divs.forEach((d,di)=>{if(d.rw.includes(w))divPlayed.add(di);});
  for(const k in S.players){const p=S.players[k];
    const club=p.clubId!=null?S.clubs[p.clubId]:null;const isMine=p.clubId===S.user.clubId;
    if(p.played)p.played=false;else if(club&&!club.ext&&!p.youth&&p.susp>0&&divPlayed.has(club.div))p.susp--;
    if(p.injury>0)p.injury--;
    p.fitness=clamp(p.fitness+(isMine?tr.fit:24),15,100);
    develop(p,isMine?tr.grow:1);
    if(isMine&&!p.youth&&!myXI.includes(p.id)&&p.ovr>=myLvl-1)p.morale=clamp(p.morale-2,15,100);
  }
  if(windowOpen()){aiOffers();aiTransfers();}
  expireOffers();scoutTick();
  if(w===18||w===36){const exp=squad(S.user.clubId).filter(p=>p.contract<=1);if(exp.length)addNews('Contratos a punto de expirar',`Estos jugadores terminan contrato a final de temporada y se irán gratis si no los renuevas:<br>${exp.map(p=>`${esc(p.name)} (${p.pos}, ${p.ovr})`).join('<br>')}`,'info');}
}
function finishUserWeek(myGoals){
  const nf=nextFixtureWeek;processWeek(nf);S.week=nf+1;
  if(myGoals){const d=myGoals[0]-myGoals[1];const pos=myPosition();
    let delta=d>0?2:d<0?-1.5:0.3;if(pos<=S.board.target)delta+=0.5;else if(pos>S.board.target+3)delta-=0.5;
    S.board.conf=clamp(S.board.conf+delta,0,100);}
  while(S.week<S.W&&!userHasMatchAt(S.week)){processWeek(S.week);S.week++;}
  if(S.week>=S.W)S.seasonDone=true;
  if(S.board.conf<=4&&userRoundAtWeek(S.week)>=15&&!S.seasonDone)fired('La directiva ha perdido la confianza en tu proyecto tras una racha de malos resultados.');
  save();
}
let nextFixtureWeek=0;
function develop(p,mult){
  const a=p.age;const af=a<=18?1.1:a<=20?1:a<=22?0.8:a<=24?0.6:a<=26?0.4:a<=28?0.22:a<=30?0.1:0;
  if(p.ovr<p.pot&&af>0){p.prog+=(p.pot-p.ovr)*af*0.7*mult*(0.6+R()*0.8)*(p.youth?0.9:1);
    while(p.prog>=100&&p.ovr<p.pot){p.prog-=100;p.ovr++;}}
  if(a>=32&&R()<0.025*(a-31))p.ovr=Math.max(45,p.ovr-1);
}

/* ================= mercado ================= */
function isStarter(p){if(p.clubId==null)return false;const c=S.clubs[p.clubId];if(c.ext)return p.ovr>=c.lvl0;return bestXI(c.id,c.formation,true).includes(p.id);}
function negKey(p){return S.season+'-'+(S.week<WINTER_START?'v':'i')+'-'+p.id;}
function askingPrice(p){if(p.clubId==null)return {ask:0,tries:0,agreed:0};const key=negKey(p);
  if(!S.neg[key])S.neg[key]={ask:roundMoney(valueOf(p)*(1.08+(isStarter(p)?0.25:0)+R()*0.15)*(p.contract<=1?0.85:1)),tries:0,agreed:0};
  return S.neg[key];}
function wageDemand(p){const buyer=me();const curRep=p.clubId!=null?S.clubs[p.clubId].rep:buyer.rep;
  return Math.max(Math.round(p.wage*1.05/500)*500,Math.round(wageFor(p,buyer.rep)*(1.1+Math.max(0,curRep-buyer.rep)*0.12)/500)*500);}
function willingness(p){const lvl=clubLevel(S.user.clubId);const c=me();const cur=p.clubId!=null?S.clubs[p.clubId]:null;
  if(cur&&cur.rep>c.rep+1.5&&p.ovr>lvl+3)return 'No quiere dar un paso atrás en su carrera.';
  if(p.ovr>lvl+9&&c.rep<4)return 'Considera que tu proyecto no está a su nivel.';
  if(userDiv().tier===2&&p.ovr>lvl+6)return 'No quiere jugar en segunda división.';
  return null;}
function wageBill(cid){return squad(cid,true).reduce((s,p)=>s+p.wage,0);}
function signPlayer(p,fee,wage,years){
  const c=me();const from=p.clubId!=null?S.clubs[p.clubId]:null;
  c.budget-=fee;if(from)from.budget+=fee;
  p.clubId=c.id;p.youth=false;p.wage=wage;p.contract=years;p.listed=false;p.morale=80;p.num=0;p.yellows=0;invalidate();
  assignNumbers(c.id);if(from&&!from.ext)assignNumbers(from.id);
  addNews('Fichaje cerrado: '+esc(p.name),`${esc(p.name)} (${p.pos}, ${p.ovr}) se une a ${esc(c.name)}${from?' procedente de '+esc(from.name):' como agente libre'}. Traspaso: <b>${money(fee)}</b>. Salario: ${money(wage)}/sem durante ${years} temporadas.`,'info');
  save();}
function sellPlayer(p,toCid,fee){const c=me();const to=S.clubs[toCid];c.budget+=fee;to.budget-=fee;p.clubId=toCid;p.listed=false;p.wage=Math.max(p.wage,wageFor(p,to.rep));p.contract=ri(2,5);p.num=0;invalidate();
  if(c.lineup)c.lineup=c.lineup.map(id=>id===p.id?null:id);
  if(!to.ext)assignNumbers(toCid);addNews('Venta cerrada: '+esc(p.name),`${esc(p.name)} deja ${esc(c.name)} rumbo a ${esc(to.name)} por <b>${money(fee)}</b>.`,'info');}
function buyerClubFor(p){const v=valueOf(p);const cands=S.clubs.filter(c=>c.id!==S.user.clubId&&c.budget>v*0.8&&Math.abs(c.lvl0-p.ovr)<8);if(!cands.length)return null;
  return wpick(cands,c=>Math.max(0.1,6-Math.abs(c.lvl0-p.ovr+2)/2)*(c.ext?0.5:1));}
function aiOffers(){
  const lvl=clubLevel(S.user.clubId);
  squad(S.user.clubId).forEach(p=>{
    if(S.news.some(n=>n.type==='offer'&&!n.done&&n.data.pid===p.id))return;
    const chance=p.listed?0.35:(p.ovr>=lvl+2?0.05:0.012);
    if(R()<chance){const b=buyerClubFor(p);if(!b)return;const fee=roundMoney(valueOf(p)*(p.listed?0.75+R()*0.3:1.05+R()*0.35));
      addNews(`Oferta de ${esc(b.name)} por ${esc(p.name)}`,`${esc(b.name)} ofrece <b>${money(fee)}</b> por ${esc(p.name)} (${p.pos}, ${p.ovr}). Valor de mercado: ${money(valueOf(p))}. La oferta caduca en 2 semanas.`,'offer',{pid:p.id,cid:b.id,fee,exp:S.week+2});}
  });
}
function expireOffers(){S.news.forEach(n=>{if(n.type==='offer'&&!n.done&&n.season===S.season&&n.data.exp<S.week)n.done='Caducada';});}
function aiTransfers(){
  const all=Object.values(S.players);
  for(let k=0;k<6;k++){const buyer=pick(S.clubs.filter(c=>!c.ext&&c.id!==S.user.clubId));
    const cands=all.filter(p=>p.clubId!==S.user.clubId&&p.clubId!==buyer.id&&!p.youth&&p.ovr>=buyer.lvl0-1&&p.ovr<=buyer.lvl0+4&&valueOf(p)*1.15<buyer.budget&&(p.clubId==null||S.clubs[p.clubId].rep<=buyer.rep+0.3));
    if(!cands.length)continue;const p=pick(cands);const from=p.clubId!=null?S.clubs[p.clubId]:null;const fee=from?roundMoney(valueOf(p)*1.15):0;
    buyer.budget-=fee;if(from)from.budget+=fee;p.clubId=buyer.id;p.wage=Math.max(p.wage,wageFor(p,buyer.rep));p.contract=ri(2,5);p.num=0;invalidate();assignNumbers(buyer.id);
    if(p.ovr>=76&&(buyer.div===me().div||(from&&from.div===me().div)||p.ovr>=82))addNews(`${esc(p.name)} ficha por ${esc(buyer.name)}`,`${esc(buyer.name)} incorpora a ${esc(p.name)} (${p.ovr})${from?' desde '+esc(from.name)+' por '+money(fee):' como agente libre'}.`,'rumor');
    maintainSquad(buyer.id);if(from&&!from.ext)maintainSquad(from.id);}
}
function maintainSquad(cid,quiet){if(cid===S.user.clubId&&!quiet)return;const c=S.clubs[cid];if(c.ext)return;const sq=squad(cid);
  const need={POR:2,DEF:7,MED:7,DEL:4};const cnt={POR:0,DEF:0,MED:0,DEL:0};sq.forEach(p=>cnt[GROUP[p.pos]]++);
  Object.keys(need).forEach(g=>{while(cnt[g]<need[g]){const pos=pick(POS.filter(x=>GROUP[x]===g));makePlayer({pos,ovr:c.lvl0-4+ri(-3,2),age:ri(19,28),clubId:cid});cnt[g]++;}});
  if(cid!==S.user.clubId){const sq2=squad(cid).sort((a,b)=>a.ovr-b.ovr);while(sq2.length>32){const p=sq2.shift();p.clubId=null;p.contract=0;}invalidate();}
  assignNumbers(cid);}

/* ================= cantera ================= */
const SCOUT_LV=[{n:'Básico',cost:150000,pot:[60,78]},{n:'Profesional',cost:400000,pot:[66,85]},{n:'Élite',cost:900000,pot:[72,92]}];
const REGIONS={LOC:'Tu país',SA:'Sudamérica',EU:'Europa',AF:'África'};
function scoutTick(){if(!S.scout)return;S.scout.weeks--;if(S.scout.weeks>0)return;const lv=SCOUT_LV[S.scout.lv];const n=ri(2,4);const names=[];
  for(let i=0;i<n;i++){const age=ri(15,17);const pot=ri(lv.pot[0],lv.pot[1]);const ovr=clamp(pot-ri(18,30)+(age-15)*2,42,64);
    const p=makePlayer({pos:pick(POS),ovr,age,pot,clubId:S.user.clubId,youth:true,region:S.scout.region,contract:3});names.push(`${esc(p.name)} ${flag(p.nat)} (${p.pos}, ${p.ovr})`);}
  addNews('Informe de ojeo: '+REGIONS[S.scout.region],`Tu ojeador ha encontrado ${n} jóvenes talentos que ya están en tu cantera:<br>${names.join('<br>')}`,'info');S.scout=null;}

/* ================= fin de temporada ================= */
function topScorer(di){const d=S.divs[di];const set=new Set(d.clubs);let best=null;for(const k in S.players){const p=S.players[k];if(p.clubId!=null&&set.has(p.clubId)&&(!best||p.stats.goals>best.stats.goals))best=p;}return best;}
function endSeason(){
  invalidate();
  const c=me();const ud=c.div;const tb=table(ud);const pos=myPosition();const d=userDiv();
  const top=topScorer(ud);
  const met=pos<=S.board.target;
  S.board.conf=clamp(S.board.conf+(met?15+(S.board.target-pos)*3:-(pos-S.board.target)*5),0,100);
  if(pos===1)S.user.trophies++;
  S.user.history.push({season:seasonLabel(),club:c.name,div:d.name,pos,pts:tb[pos-1].pts,objective:S.board.objective,met});
  const champions=S.divs.filter(x=>x.tier===1).map(x=>({div:x.name,club:S.clubs[table(S.divs.indexOf(x))[0].id].name}));
  const summary={pos,div:d.name,champion:S.clubs[tb[0].id].name,top:top?`${top.name} (${S.clubs[top.clubId].short}) · ${top.stats.goals} goles`:'—',met,objective:S.board.objective,champions,moves:[]};
  // ascensos y descensos por país
  const before=c.div;
  S.divs.forEach((d1,i1)=>{if(d1.tier!==1)return;const i2=S.divs.findIndex(x=>x.country===d1.country&&x.tier===2);if(i2<0)return;const d2=S.divs[i2];
    const down=table(i1).slice(-d1.sw).map(r=>r.id),up=table(i2).slice(0,d1.sw).map(r=>r.id);
    d1.clubs=d1.clubs.filter(id=>!down.includes(id)).concat(up);d2.clubs=d2.clubs.filter(id=>!up.includes(id)).concat(down);
    down.forEach(id=>{const cl=S.clubs[id];cl.div=i2;cl.budget0=roundMoney(cl.budget0*0.55);});
    up.forEach(id=>{const cl=S.clubs[id];cl.div=i1;cl.budget0=roundMoney(Math.max(cl.budget0*1.8,15e6));cl.wageBudget=Math.round(cl.wageBudget*1.3);});
    if(d1.country===d.country)summary.moves.push({up:up.map(id=>S.clubs[id].name),down:down.map(id=>S.clubs[id].name),d1:d1.name,d2:d2.name});});
  const userRelegated=S.divs[before].tier===2&&d.tier===1;const userPromoted=c.div!==before&&S.divs[c.div].tier===1;
  if(c.div!==before){if(S.divs[c.div].tier===2){S.board.conf=clamp(S.board.conf-20,0,100);summary.relegatedUser=true;}else{S.board.conf=clamp(S.board.conf+15,0,100);summary.promotedUser=true;}}
  // reputación
  S.divs.forEach((dv,di)=>table(di).forEach((r,i)=>{const cl=S.clubs[r.id];cl.rep=clamp(cl.rep+(dv.tier===1&&i<4?0.1:i>dv.clubs.length-4?-0.1:0),1,5);}));
  // jugadores
  const left=[];
  for(const k in S.players){const p=S.players[k];
    if(p.stats.apps)p.hist.push({s:seasonLabel(),c:p.clubId!=null?S.clubs[p.clubId].short:'—',...p.stats});
    p.stats=newStats();p.yellows=0;p.susp=0;p.age++;
    if(p.age>=30){p.ovr=Math.max(45,p.ovr-ri(0,Math.min(4,p.age-29)));p.pot=Math.min(p.pot,p.ovr+1);}
    if(p.age>=27)p.pot=Math.min(p.pot,Math.max(p.ovr,p.pot-ri(0,1)));
    if(p.youth&&p.age>=19){p.youth=false;p.contract=Math.max(p.contract,2);p.wage=Math.max(2000,wageFor(p,c.rep));}
    if(p.age>=34&&R()<0.3+(p.age-34)*0.2){if(p.clubId===S.user.clubId)left.push(p.name+' se retira');delete S.players[p.id];continue;}
    if(p.clubId!=null&&!p.youth){p.contract--;
      if(p.contract<=0){if(p.clubId===S.user.clubId){left.push(p.name+' (fin de contrato)');p.clubId=null;p.contract=0;}
        else if(R()<0.75||S.clubs[p.clubId].ext)p.contract=ri(1,4);else{p.clubId=null;p.contract=0;}}}
    p.fitness=100;p.injury=0;p.morale=clamp(p.morale,55,85);p.listed=p.clubId===S.user.clubId?p.listed:false;
  }
  invalidate();summary.left=left;
  // canteranos, presupuestos de la IA
  S.clubs.forEach(cl=>{if(cl.ext)return;
    for(let i=0;i<2;i++)makePlayer({pos:pick(POS),ovr:cl.lvl0-14+ri(-3,3),age:17,clubId:cl.id,youth:cl.id===S.user.clubId,contract:3});
    if(cl.id===S.user.clubId)return;
    maintainSquad(cl.id);cl.budget=roundMoney(Math.max(cl.budget,0)*0.3+cl.budget0*(0.85+R()*0.3));cl.lvl0=clubLevel(cl.id);
    cl.wageBudget=Math.round(Math.max(cl.wageBudget,wageBill(cl.id)*1.05)/1000)*1000;});
  // agentes libres nuevos
  for(let i=0;i<12;i++)makePlayer({pos:pick(POS),ovr:ri(60,74),age:ri(22,33),clubId:null,contract:0});
  // presupuesto del usuario
  const n=d.clubs.length;const prize=(n+1-pos)*(d.tier===1?1.5e6:0.3e6);
  c.budget=roundMoney(Math.max(0,c.budget)*0.5+c.budget0*(met?1.15:0.85)+prize);
  c.wageBudget=Math.round(Math.max(c.wageBudget,wageBill(c.id)*1.08)/1000)*1000;
  summary.budget=c.budget;summary.prize=prize;summary.conf=Math.round(S.board.conf);
  summary.fired=S.board.conf<25;
  if(summary.fired)summary.reason=summary.relegatedUser?'El equipo ha descendido y la directiva prescinde de tus servicios.':'No has cumplido el objetivo y la directiva ha decidido destituirte.';
  S.lastSummary=summary;
  return summary;
}
function fillFromReserves(){const c=me();const lvl=c.lvl0||70;const added=[];
  const need={POR:2,DEF:6,MED:6,DEL:4};const cnt={POR:0,DEF:0,MED:0,DEL:0};squad(c.id).forEach(p=>cnt[GROUP[p.pos]]++);
  Object.keys(need).forEach(g=>{while(cnt[g]<need[g]){added.push(makePlayer({pos:pick(POS.filter(x=>GROUP[x]===g)),ovr:lvl-9+ri(-3,2),age:ri(18,22),clubId:c.id,contract:2}));cnt[g]++;}});
  while(squad(c.id).length<18)added.push(makePlayer({pos:pick(POS.filter(x=>x!=='POR')),ovr:lvl-9+ri(-3,2),age:ri(18,22),clubId:c.id,contract:2}));
  if(added.length){assignNumbers(c.id);addNews('Refuerzos del filial',`La plantilla se había quedado corta. Suben desde el filial: ${added.map(p=>`${esc(p.name)} (${p.pos}, ${p.ovr})`).join(', ')}.`,'info');}}
function beginNextSeason(){S.season++;S.lastSummary=null;fillFromReserves();me().lineup=null;startSeason(false);
  addNews('Nueva temporada '+seasonLabel(),`Competición: <b>${esc(userDiv().name)}</b>. Objetivo: <b>${S.board.objective}</b>. Presupuesto de fichajes: <b>${money(me().budget)}</b>. El mercado de verano está abierto.`,'info');save();}
function fired(reason){S.over=true;S.firedReason=reason;save();}
function jobOffers(){const lvl=me().lvl0;const c=S.clubs.filter(x=>!x.ext&&x.id!==S.user.clubId&&x.lvl0<=lvl+1);return shuffle(c.sort((a,b)=>b.lvl0-a.lvl0).slice(0,15)).slice(0,3);}
function takeJob(cid){S.over=false;S.user.clubId=cid;const c=me();c.lineup=null;c.ment=2;S.board.conf=55;
  if(S.seasonDone)beginNextSeason();else{setObjective();fillFromReserves();}
  addNews('Nuevo reto: '+esc(c.name),`Has sido presentado como nuevo entrenador de ${esc(c.name)} (${esc(userDiv().name)}). Presupuesto: <b>${money(c.budget)}</b>.`,'info');save();}

/* ================= noticias y guardado ================= */
function addNews(title,body,type,data){S.news.unshift({id:S.msgId++,title,body,type,data:data||{},read:false,week:S.week,season:S.season,done:null});if(S.news.length>120)S.news.length=120;}
function unread(){return S?S.news.filter(n=>!n.read).length:0;}
/* guardado comprimido con gzip nativo del navegador (la partida ocupa varios MB sin comprimir) */
const META_KEY=SAVE_KEY+'_meta';
function toB64(buf){const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s);}
async function gz(txt){const st=new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'));return toB64(await new Response(st).arrayBuffer());}
async function gunz(b64){const bin=atob(b64);const b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);
  return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();}
async function packSave(){const txt=JSON.stringify(S);return window.CompressionStream?'gz:'+await gz(txt):txt;}
async function parseSave(t){if(!t)return null;t=t.trim();if(t.startsWith('gz:'))t=await gunz(t.slice(3));return JSON.parse(t);}
let saveSeq=0,saveWarned=false;
function save(){if(!S)return;const seq=++saveSeq;const meta=JSON.stringify({name:S.user.name,club:S.clubs[S.user.clubId].name,season:S.season,over:!!S.over});
  packSave().then(z=>{if(seq!==saveSeq)return;localStorage.setItem(SAVE_KEY,z);localStorage.setItem(META_KEY,meta);})
    .catch(e=>{if(!saveWarned){saveWarned=true;toast('No se ha podido guardar la partida en este navegador. Usa «Exportar partida» en Club.');}});}
async function load(){try{return await parseSave(localStorage.getItem(SAVE_KEY));}catch(e){return null;}}
function loadMeta(){try{return JSON.parse(localStorage.getItem(META_KEY));}catch(e){return null;}}

/* ================= interfaz ================= */
const root=document.getElementById('root');
const ICONS={
 home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 squad:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c3 .3 5.5 2.6 5.5 5.8"/>',
 tactics:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><circle cx="12" cy="12" r="3"/>',
 market:'<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
 youth:'<path d="M12 21V11"/><path d="M12 11c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z"/>',
 league:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z"/>',
 inbox:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 club:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'
};
const NAV=[['home','Inicio'],['squad','Plantilla'],['tactics','Táctica'],['market','Mercado'],['youth','Cantera'],['league','Ligas'],['inbox','Bandeja'],['club','Club']];
const icon=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
function crest(c,big){const l=isLight(c.c1);return `<span class="crest${big?' big':''}${c.short.length>3?' long':''}" style="background:linear-gradient(135deg,${c.c1} 0 50%,${c.c2} 50% 100%);color:${l?'#111':'#fff'};text-shadow:0 1px 2px ${l?'#fff':'#000'}">${esc(c.short)}</span>`;}
function isLight(hex){const n=parseInt(hex.slice(1),16);const r=n>>16,g=n>>8&255,b=n&255;return (r*299+g*587+b*114)/1000>150;}
function posTag(pos){return `<span class="pos ${GROUP[pos]}">${pos}</span>`;}
function ovrTag(o){return `<span class="ovr ${ovrClass(o)}">${o}</span>`;}
function stars(r){r=Math.round(r*2)/2;return '★'.repeat(Math.floor(r))+(r%1?'½':'')+'<span style="opacity:.25">'+'★'.repeat(5-Math.ceil(r))+'</span>';}
function status(p){const t=[];if(p.injury)t.push(`<span class="pill bad">Lesión ${p.injury}s</span>`);if(p.susp)t.push(`<span class="pill warn">Sanción ${p.susp}</span>`);if(p.listed)t.push('<span class="pill info">Transferible</span>');if(p.contract<=1&&!p.youth&&p.clubId!=null)t.push('<span class="pill warn">Contrato 1 año</span>');return t.join(' ');}
function toast(msg){const t=document.createElement('div');t.className='toast';t.innerHTML=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
function clubPlace(c){return c.stadium||c.league;}

function render(){
  if(!S){renderStart();return;}
  if(S.over){renderFired();return;}
  const c=me();const nf=nextFixture();
  const views={home:vHome,squad:vSquad,tactics:vTactics,market:vMarket,youth:vYouth,league:vLeague,inbox:vInbox,club:vClub};
  const un=unread();
  root.innerHTML=`<div id="app">
   <nav class="nav" aria-label="Secciones">
    <div class="brand">Modo <span>Carrera</span></div>
    ${NAV.map(([k,l])=>`<button class="${UI.view===k?'on':''}" data-go="${k}">${icon(k)}<span>${l}</span>${k==='inbox'&&un?`<span class="dot">${un}</span>`:''}</button>`).join('')}
    <div class="src small muted">Datos: EA SPORTS FC 26</div>
   </nav>
   <main>
    <div class="topbar">${crest(c)}<div><h1>${esc(c.name)}</h1><div class="small muted">${esc(S.user.name)} · ${esc(userDiv().name)} · ${seasonLabel()} · ${S.seasonDone||!nf?'Fin de temporada':'Jornada '+(nf.round+1)+'/'+userDiv().fx.length}</div></div>
     <div class="meta"><div class="stat"><div class="label">Presupuesto</div><div class="v num">${money(c.budget)}</div></div>
     <div class="stat"><div class="label">Posición</div><div class="v num">${posLabel()}</div></div>
     <div class="stat"><div class="label">Directiva</div><div class="v num" style="color:${confColor()}">${Math.round(S.board.conf)}%</div></div></div></div>
    ${views[UI.view]()}
   </main></div>`;
  if(UI.match)renderMatch();
}
function confColor(){const v=S.board.conf;return v>=60?'var(--good)':v>=35?'var(--warn)':'var(--bad)';}

/* ---------- inicio ---------- */
function vHome(){
  const c=me();const nf=nextFixture();
  if(S.seasonDone||!nf){const sm=S.lastSummary;
    return `<div class="card"><h3>Fin de la temporada ${seasonLabel()}</h3>${sm?seasonSummaryHTML(sm):`<p>Se han jugado todas las jornadas. Revisa el balance y prepara la próxima temporada.</p><button class="btn primary" data-act="endSeason">Ver balance de la temporada</button>`}</div>`;}
  const fx=nf.fx;const home=fx.h===c.id;const opp=S.clubs[home?fx.a:fx.h];
  const tb=table(c.div);const row=id=>tb.find(r=>r.id===id);
  const probs=lineupProblems();const lv=id=>Math.round(clubLevel(id));
  const d=userDiv();const uid=c.id;
  const upcoming=d.fx.slice(nf.round+1,nf.round+5).map((rd,i)=>{const f=rd.find(x=>x.h===uid||x.a===uid);if(!f)return '';const o=S.clubs[f.h===uid?f.a:f.h];return `<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--line);flex-wrap:nowrap"><span class="label">J${nf.round+2+i}</span><span class="row" style="gap:8px;flex-wrap:nowrap;min-width:0">${crest(o)} <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(o.name)}</span></span><span class="pill">${f.h===uid?'Casa':'Fuera'}</span></div>`;}).join('');
  const news=S.news.slice(0,4).map(n=>`<div class="msg ${n.read?'':'unread'}" data-msg="${n.id}"><div style="min-width:0"><div class="t">${n.title}</div><div class="small muted">${n.type==='offer'&&!n.done?'<b style="color:var(--accent)">Requiere respuesta</b>':'Temporada '+seasonLabel(n.season-S.season)}</div></div></div>`).join('');
  const team=id=>`<div class="team">${crest(S.clubs[id],true)}<div class="name">${esc(S.clubs[id].name)}</div><div class="small muted num">Media ${lv(id)} · ${row(id).pts} pts</div><div class="form">${formHTML(c.div,id)}</div></div>`;
  return `<div class="grid g2">
   <div class="card" style="grid-column:1/-1">
    <div class="row between"><span class="label">Jornada ${nf.round+1} · ${esc(clubPlace(S.clubs[fx.h]))}</span><span class="pill ${windowOpen()?'good':''}">${windowLabel()}</span></div>
    <div class="fixture-hero">${team(fx.h)}<div class="vs">VS</div>${team(fx.a)}</div>
    ${probs.length?`<p class="small" style="color:var(--warn)">Tu once tiene ${probs.length} jugador(es) lesionados, sancionados o que ya no están. Se sustituirán automáticamente al empezar.</p>`:''}
    <div class="row" style="justify-content:center;margin-top:6px">
      <button class="btn primary" data-act="play">Jugar partido</button>
      <button class="btn" data-act="sim">Simular resultado</button>
      <button class="btn" data-go="tactics">Ajustar alineación</button>
    </div>
   </div>
   <div class="card"><h3>Entrenamiento semanal</h3>
    <p class="small muted">Más intensidad acelera la progresión, pero cansa a la plantilla.</p>
    <div class="row">${Object.entries(TRAIN).map(([k,t])=>`<button class="btn ${S.training===k?'primary':''}" data-train="${k}">${t.n}</button>`).join('')}</div>
    <div class="small muted" style="margin-top:8px">Recuperación +${TRAIN[S.training].fit}% · Progresión ×${TRAIN[S.training].grow}</div>
   </div>
   <div class="card"><h3>Directiva</h3>
    <div class="label">Objetivo</div><div style="font-weight:600;margin-bottom:8px">${esc(S.board.objective)}</div>
    <div class="label">Confianza</div><div class="bar" style="margin:6px 0"><i style="width:${S.board.conf}%;background:${confColor()}"></i></div>
    <div class="small muted">${row(c.id).pj===0?'La temporada aún no ha empezado.':'Vas '+myPosition()+'º. '+(myPosition()<=S.board.target?'Cumpliendo el objetivo.':'Por debajo del objetivo (puesto '+S.board.target+').')}</div>
   </div>
   <div class="card"><h3>Próximos partidos</h3>${upcoming||'<p class="muted">Última jornada.</p>'}</div>
   <div class="card" style="padding:8px 4px"><h3 style="padding:8px 12px 0">Bandeja de entrada</h3>${news}<div style="padding:8px 12px"><button class="btn sm" data-go="inbox">Ver todo</button></div></div>
  </div>`;
}
function formHTML(di,cid){const r=table(di).find(x=>x.id===cid);return r?r.form.slice(-5).map(f=>`<span class="${f}">${{W:'V',D:'E',L:'D'}[f]}</span>`).join(''):'';}
function seasonSummaryHTML(sm){const mv=sm.moves[0];return `<div class="grid g3" style="margin:10px 0">
  <div><div class="label">Tu posición</div><div style="font:800 40px/1 var(--display)">${sm.pos}º</div><div class="small muted">${esc(sm.div)}</div></div>
  <div><div class="label">Campeón</div><div style="font-weight:600">${esc(sm.champion)}</div></div>
  <div><div class="label">Máximo goleador</div><div style="font-weight:600">${esc(sm.top)}</div></div>
  <div><div class="label">Objetivo</div><div>${esc(sm.objective)} <span class="pill ${sm.met?'good':'bad'}">${sm.met?'Cumplido':'No cumplido'}</span></div></div>
  ${mv?`<div><div class="label">Bajan a ${esc(mv.d2)}</div><div class="small">${mv.down.map(esc).join(', ')}</div></div><div><div class="label">Suben a ${esc(mv.d1)}</div><div class="small">${mv.up.map(esc).join(', ')}</div></div>`:''}</div>
  ${sm.promotedUser?'<p style="color:var(--good);font-weight:600">¡Ascenso conseguido! La próxima temporada jugarás en primera.</p>':''}
  ${sm.relegatedUser?'<p style="color:var(--bad);font-weight:600">El equipo ha descendido a segunda división.</p>':''}
  <p class="small muted">Campeones: ${sm.champions.map(x=>`${esc(x.div)}: <b>${esc(x.club)}</b>`).join(' · ')}</p>
  ${sm.left.length?`<p class="small muted">Bajas en tu plantilla: ${sm.left.map(esc).join(', ')}.</p>`:''}
  <p>Premio por clasificación: <b>${money(sm.prize)}</b>. Nuevo presupuesto: <b>${money(sm.budget)}</b>. Confianza de la directiva: <b>${sm.conf}%</b>.</p>
  ${sm.fired?`<p style="color:var(--bad);font-weight:600">${esc(sm.reason)}</p><button class="btn primary" data-act="toFired">Continuar</button>`:`<button class="btn primary" data-act="nextSeason">Empezar temporada ${seasonLabel(1)}</button>`}`;}

/* ---------- plantilla ---------- */
function sortPlayers(arr,key){const po=p=>POS.indexOf(p.pos);const f={pos:(a,b)=>po(a)-po(b)||b.ovr-a.ovr,ovr:(a,b)=>b.ovr-a.ovr,pot:(a,b)=>b.pot-a.pot,age:(a,b)=>a.age-b.age,value:(a,b)=>valueOf(b)-valueOf(a),goals:(a,b)=>b.stats.goals-a.stats.goals,fit:(a,b)=>a.fitness-b.fitness,wage:(a,b)=>b.wage-a.wage}[key]||(()=>0);return arr.sort(f);}
function posList(p){return p.alt.length>1?`<span class="small muted">${p.alt.slice(1).join(' ')}</span>`:'';}
function vSquad(){
  const c=me();const sq=sortPlayers(squad(c.id),UI.sqSort);const xi=new Set(userLineup());
  const th=(k,l)=>`<th class="sort" data-sort="${k}">${l}${UI.sqSort===k?' ▾':''}</th>`;
  return `<div class="card"><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">Primer equipo · ${sq.length} jugadores</h3><span class="small muted num">Masa salarial ${money(wageBill(c.id))}/sem de ${money(c.wageBudget)}</span></div>
  <div class="tbl-wrap"><table><thead><tr><th>#</th>${th('pos','Pos')}<th>Nombre</th>${th('ovr','Med')}${th('pot','Pot')}${th('age','Edad')}${th('fit','Forma')}<th>Moral</th>${th('goals','G/A')}<th>Nota</th>${th('value','Valor')}${th('wage','Salario')}<th>Estado</th></tr></thead><tbody>
  ${sq.map(p=>`<tr class="click" data-player="${p.id}"><td class="muted">${p.num}</td><td>${posTag(p.pos)} ${posList(p)}</td><td><b>${esc(p.name)}</b> ${flag(p.nat)}${xi.has(p.id)?' <span class="pill good">XI</span>':''}</td><td>${ovrTag(p.ovr)}</td><td class="muted">${p.pot}</td><td>${p.age}</td>
   <td><div class="bar" style="width:60px"><i style="width:${p.fitness}%;background:${p.fitness>75?'var(--good)':p.fitness>55?'var(--warn)':'var(--bad)'}"></i></div></td><td>${moraleTxt(p.morale)}</td><td>${p.stats.goals}/${p.stats.assists}</td><td>${p.stats.apps?(p.stats.rsum/p.stats.apps).toFixed(1):'–'}</td><td>${money(valueOf(p))}</td><td class="muted">${money(p.wage)}</td><td>${status(p)}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}
function moraleTxt(m){return m>=80?'<span style="color:var(--good)">Muy alta</span>':m>=62?'Alta':m>=45?'<span class="muted">Normal</span>':m>=30?'<span style="color:var(--warn)">Baja</span>':'<span style="color:var(--bad)">Muy baja</span>';}

function playerModal(id){
  const p=P(id);if(!p)return;const mine=p.clubId===S.user.clubId;const club=p.clubId!=null?S.clubs[p.clubId]:null;
  const st=stats6(p);const lbl=p.pos==='POR'?STAT_LBL.POR:STAT_LBL.field;
  const hist=p.hist.slice(-5).reverse().map(h=>`<tr><td>${h.s}</td><td>${esc(h.c)}</td><td>${h.apps}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.apps?(h.rsum/h.apps).toFixed(1):'–'}</td></tr>`).join('');
  let actions='';
  if(mine&&!p.youth)actions=`<button class="btn" data-act="toggleList" data-id="${p.id}">${p.listed?'Quitar de transferibles':'Declarar transferible'}</button>
    <button class="btn" data-act="renew" data-id="${p.id}">Renovar contrato</button><button class="btn danger" data-act="release" data-id="${p.id}">Rescindir</button>`;
  else if(mine&&p.youth)actions=`<button class="btn primary" data-act="promote" data-id="${p.id}">Subir al primer equipo</button><button class="btn danger" data-act="releaseYouth" data-id="${p.id}">Despedir</button>`;
  else actions=`<button class="btn primary" data-act="bid" data-id="${p.id}">${club?'Hacer oferta':'Ofrecer contrato'}</button>`;
  modal(`<div class="row" style="gap:14px;align-items:flex-start;flex-wrap:nowrap">
    <div class="ovr ${ovrClass(p.ovr)}" style="width:72px;height:72px;border-radius:12px;font-size:34px;flex:none">${p.ovr}</div>
    <div style="min-width:0;flex:1"><h2>${esc(p.name)}</h2><div class="row" style="gap:8px">${p.alt.map(posTag).join(' ')} <span>${flag(p.nat)} ${esc(natName(p.nat))}</span><span class="muted">${p.age} años</span><span class="muted">Potencial ${p.pot}</span></div>
    <div class="small muted" style="margin-top:4px">${club?esc(club.name)+(club.ext?' · '+esc(club.league):''):'Agente libre'}${p.youth?' · Cantera':''} · ${p.clubId!=null?'Contrato '+p.contract+' temp. · ':''}${money(p.wage)}/sem · Valor ${money(valueOf(p))}</div><div style="margin-top:6px">${status(p)}</div></div></div>
   <div class="statgrid" style="margin:14px 0">${st.map((v,i)=>`<div><span class="label">${lbl[i]}</span><b class="num" style="color:${v>=80?'var(--good)':v>=65?'var(--fg)':v>=50?'var(--warn)':'var(--bad)'}">${v}</b></div>`).join('')}</div>
   <div class="row" style="gap:18px;margin-bottom:10px"><div><span class="label">Temporada</span><div class="num">${p.stats.apps} PJ · ${p.stats.goals} G · ${p.stats.assists} A · nota ${p.stats.apps?(p.stats.rsum/p.stats.apps).toFixed(2):'–'}</div></div>
   <div><span class="label">Forma física</span><div>${p.fitness}%</div></div><div><span class="label">Moral</span><div>${moraleTxt(p.morale)}</div></div></div>
   ${hist?`<div class="tbl-wrap"><table><thead><tr><th>Temp.</th><th>Club</th><th>PJ</th><th>G</th><th>A</th><th>Nota</th></tr></thead><tbody>${hist}</tbody></table></div>`:''}
   <div class="row" style="margin-top:14px">${actions}<button class="btn" data-close style="margin-left:auto">Cerrar</button></div>`);
}

/* ---------- táctica ---------- */
function vTactics(){
  const c=me();const xi=userLineup();const slots=FORMATIONS[c.formation];const inXI=new Set(xi);
  const benchList=sortPlayers(squad(c.id).filter(p=>!inXI.has(p.id)),'pos');const sel=UI.selSlot;
  const pitch=slots.map((s,i)=>{const p=xi[i]?P(xi[i]):null;const pen=p?posPen(p,s[0]):0;const bad=p&&!available(p);
    return `<div class="slot ${sel===i?'sel':''}" style="left:${s[1]}%;top:${s[2]}%" data-slot="${i}"><div class="sp">${s[0]}</div><div class="chip ${bad?'bad':pen>1?'oop':''}">${p?p.ovr-pen:'–'}</div><div class="nm">${p?esc(p.name.split(' ').slice(-1)[0]):'Vacío'}</div></div>`;}).join('');
  return `<div class="grid g2">
   <div class="card"><div class="row between" style="margin-bottom:10px"><h3 style="margin:0">Once inicial</h3><span class="small muted">Media <b class="num">${clubLevel(c.id).toFixed(1)}</b></span></div>
    <div class="row" style="margin-bottom:12px"><label class="label" for="formation">Formación</label><select id="formation" data-change="formation">${Object.keys(FORMATIONS).map(f=>`<option ${f===c.formation?'selected':''}>${f}</option>`).join('')}</select>
     <label class="label" for="ment">Mentalidad</label><select id="ment" data-change="ment">${MENT.map((m,i)=>`<option value="${i}" ${i===c.ment?'selected':''}>${m}</option>`).join('')}</select></div>
    <div class="pitch"><div class="circle"></div>${pitch}</div>
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="autoXI">Mejor once automático</button><span class="small muted">${sel!=null?'Elige un suplente o toca otra posición del campo para intercambiar.':'Toca una posición del campo para cambiar al jugador.'}</span></div>
    <p class="small muted" style="margin-top:8px">Borde naranja: fuera de posición (penaliza la media). Borde rojo: lesionado o sancionado.</p>
   </div>
   <div class="card"><h3>Suplentes y reservas</h3>
    <div class="tbl-wrap"><table><thead><tr><th>Pos</th><th>Nombre</th><th>Med</th><th>Forma</th><th></th></tr></thead><tbody>
    ${benchList.map(p=>`<tr class="click" data-benchp="${p.id}"><td>${posTag(p.pos)}</td><td>${esc(p.name)} ${status(p)}</td><td>${ovrTag(p.ovr)}</td><td class="num">${p.fitness}%</td><td>${sel!=null?`<span class="pill info">Meter</span>`:''}</td></tr>`).join('')}
    </tbody></table></div></div>
  </div>`;
}

/* ---------- mercado ---------- */
function vMarket(){
  const f=UI.mk;const uid=S.user.clubId;
  let list=[];for(const k in S.players){const p=S.players[k];if(p.clubId===uid||p.youth)continue;
    if(f.pos&&!p.alt.includes(f.pos))continue;if(p.age>f.maxAge||p.ovr<f.minOvr)continue;if(f.maxPrice&&valueOf(p)>f.maxPrice)continue;
    if(f.league){if(f.league==='free'){if(p.clubId!=null)continue;}else if(f.league==='ext'){if(p.clubId==null||!S.clubs[p.clubId].ext)continue;}else{if(p.clubId==null||S.clubs[p.clubId].div!==+f.league)continue;}}
    if(f.q){const q=f.q.toLowerCase();if(!p.name.toLowerCase().includes(q)&&!(p.clubId!=null&&S.clubs[p.clubId].name.toLowerCase().includes(q)))continue;}
    list.push(p);}
  list.sort((a,b)=>b.ovr-a.ovr||a.age-b.age);
  const total=list.length;const pageSize=40;list=list.slice(f.page*pageSize,(f.page+1)*pageSize);
  const c=me();const listed=squad(c.id).filter(p=>p.listed);
  return `<div class="card" style="margin-bottom:14px"><div class="row between"><div><span class="label">Estado</span><div style="font-weight:600">${windowLabel()}</div></div>
   <div><span class="label">Presupuesto de fichajes</span><div class="num" style="font-weight:600">${money(c.budget)}</div></div>
   <div><span class="label">Salarios</span><div class="num" style="font-weight:600">${money(wageBill(c.id))} / ${money(c.wageBudget)} sem</div></div></div>
   ${listed.length?`<p class="small muted" style="margin:10px 0 0">En venta: ${listed.map(p=>esc(p.name)).join(', ')}. Las ofertas llegan a tu bandeja con el mercado abierto.</p>`:''}</div>
  <div class="card"><h3>Buscar jugadores</h3>
   <div class="row" style="margin-bottom:12px">
    <input type="text" id="mk-q" placeholder="Jugador o club" value="${esc(f.q)}" data-mk="q" style="flex:1;min-width:140px">
    <select id="mk-league" data-mk="league"><option value="">Todas las ligas</option>${S.divs.map((d,i)=>`<option value="${i}" ${f.league===String(i)?'selected':''}>${esc(d.name)}</option>`).join('')}<option value="ext" ${f.league==='ext'?'selected':''}>Resto del mundo</option><option value="free" ${f.league==='free'?'selected':''}>Agentes libres</option></select>
    <select id="mk-pos" data-mk="pos"><option value="">Todas las posiciones</option>${POS.map(p=>`<option ${f.pos===p?'selected':''}>${p}</option>`).join('')}</select>
    <select id="mk-age" data-mk="maxAge">${[40,30,26,23,21].map(a=>`<option value="${a}" ${f.maxAge==a?'selected':''}>${a===40?'Cualquier edad':'≤ '+a+' años'}</option>`).join('')}</select>
    <select id="mk-ovr" data-mk="minOvr">${[50,60,65,70,75,80,85].map(a=>`<option value="${a}" ${f.minOvr==a?'selected':''}>Media ≥ ${a}</option>`).join('')}</select>
    <select id="mk-price" data-mk="maxPrice">${[0,2e6,5e6,10e6,25e6,50e6,100e6].map(a=>`<option value="${a}" ${f.maxPrice==a?'selected':''}>${a?'Valor ≤ '+money(a):'Cualquier precio'}</option>`).join('')}</select>
   </div>
   <div class="tbl-wrap"><table><thead><tr><th>Pos</th><th>Nombre</th><th>Med</th><th>Pot</th><th>Edad</th><th>Club</th><th>Valor</th><th>Salario</th></tr></thead><tbody>
   ${list.map(p=>{const cl=p.clubId!=null?S.clubs[p.clubId]:null;return `<tr class="click" data-player="${p.id}"><td>${posTag(p.pos)}</td><td><b>${esc(p.name)}</b> ${flag(p.nat)}</td><td>${ovrTag(p.ovr)}</td><td class="muted">${p.pot}</td><td>${p.age}</td><td>${cl?`<span class="row" style="gap:6px;flex-wrap:nowrap">${crest(cl)} ${esc(cl.name)}</span>`:'<span class="pill good">Libre</span>'}</td><td>${money(valueOf(p))}</td><td class="muted">${money(p.wage)}</td></tr>`;}).join('')||'<tr><td colspan="8" class="muted">Sin resultados con estos filtros.</td></tr>'}
   </tbody></table></div>
   <div class="row between" style="margin-top:10px"><span class="small muted">${total} jugadores</span><div class="row"><button class="btn sm" data-page="-1" ${f.page===0?'disabled':''}>Anterior</button><button class="btn sm" data-page="1" ${(f.page+1)*pageSize>=total?'disabled':''}>Siguiente</button></div></div>
  </div>`;
}
function bidModal(id,stage,extra){
  const p=P(id);const c=me();const club=p.clubId!=null?S.clubs[p.clubId]:null;
  if(!windowOpen()){modal(`<h2>Mercado cerrado</h2><p>Podrás negociar por ${esc(p.name)} cuando abra el mercado (${S.week<WINTER_START?'en invierno':'el próximo verano'}).</p><button class="btn" data-close>Cerrar</button>`);return;}
  const refuse=willingness(p);
  if(refuse){modal(`<h2>${esc(p.name)}</h2><p>El jugador rechaza negociar: <b>${refuse}</b></p><button class="btn" data-close>Cerrar</button>`);return;}
  if(squad(c.id).length>=40){modal(`<h2>Plantilla completa</h2><p>Tienes 40 jugadores en el primer equipo. Vende o rescinde a alguno antes de fichar.</p><button class="btn" data-close>Cerrar</button>`);return;}
  if(club&&stage!=='contract'){
    const neg=askingPrice(p);const val=valueOf(p);
    if(neg.agreed){bidModal(id,'contract',{fee:neg.agreed});return;}
    const sug=[0.9,1,1.15,1.3].map(x=>roundMoney(val*x));
    modal(`<h2>Oferta por ${esc(p.name)}</h2><div class="small muted">${esc(club.name)} · ${p.pos} · ${p.ovr} · ${p.age} años · Valor ${money(val)}</div>
     <p>Intentos restantes con ${esc(club.name)}: <b>${3-neg.tries}</b>. Presupuesto disponible: <b>${money(c.budget)}</b>.</p>
     ${extra&&extra.msg?`<p style="color:${extra.ok?'var(--good)':'var(--warn)'}">${esc(extra.msg)}</p>`:''}
     <label class="label" for="fee">Traspaso ofrecido (€)</label>
     <div class="row" style="margin:6px 0 10px"><input type="number" id="fee" value="${extra&&extra.counter?extra.counter:sug[1]}" step="100000" min="0" style="flex:1"></div>
     <div class="row" style="margin-bottom:14px">${sug.map(s=>`<button class="btn sm" data-setfee="${s}">${money(s)}</button>`).join('')}</div>
     <div class="row"><button class="btn primary" data-act="sendBid" data-id="${p.id}" ${neg.tries>=3?'disabled':''}>Enviar oferta</button>${extra&&extra.counter?`<button class="btn" data-act="acceptCounter" data-id="${p.id}" data-fee="${extra.counter}">Aceptar ${money(extra.counter)}</button>`:''}<button class="btn" data-close style="margin-left:auto">Cancelar</button></div>`);
    return;}
  const fee=extra?extra.fee||0:0;const dem=wageDemand(p);
  modal(`<h2>Contrato · ${esc(p.name)}</h2>${fee?`<p class="small" style="color:var(--good)">Traspaso acordado: <b>${money(fee)}</b>.</p>`:'<p class="small muted">Agente libre: sin coste de traspaso.</p>'}
   <p>Pretensiones del jugador: <b>${money(dem)}/sem</b>. Margen salarial: <b>${money(c.wageBudget-wageBill(c.id))}/sem</b>.</p>
   ${extra&&extra.msg?`<p style="color:var(--warn)">${esc(extra.msg)}</p>`:''}
   <div class="row" style="margin-bottom:12px"><label class="label" for="wage">Salario semanal</label><input type="number" id="wage" value="${dem}" step="500" min="0" style="flex:1">
   <label class="label" for="years">Años</label><select id="years">${[1,2,3,4,5].map(y=>`<option ${y===4?'selected':''}>${y}</option>`).join('')}</select></div>
   <div class="row"><button class="btn primary" data-act="sendContract" data-id="${p.id}" data-fee="${fee}">Proponer contrato</button><button class="btn" data-close style="margin-left:auto">Cancelar</button></div>`);
}

/* ---------- cantera ---------- */
function vYouth(){
  const c=me();const yth=squad(c.id,true).filter(p=>p.youth).sort((a,b)=>b.pot-a.pot);
  return `<div class="grid g2"><div class="card"><h3>Red de ojeadores</h3>
   ${S.scout?`<p>Misión en curso: <b>${REGIONS[S.scout.region]}</b> (${SCOUT_LV[S.scout.lv].n}). Informe en <b>${S.scout.weeks}</b> semana(s).</p>`:
   `<p class="small muted">Envía un ojeador durante 3 semanas para descubrir juveniles de 15 a 17 años. A mayor nivel, más potencial.</p>
   <div class="row" style="margin-bottom:10px"><label class="label" for="sc-region">Región</label><select id="sc-region">${Object.entries(REGIONS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
   <label class="label" for="sc-lv">Ojeador</label><select id="sc-lv">${SCOUT_LV.map((l,i)=>`<option value="${i}">${l.n} · ${money(l.cost)}</option>`).join('')}</select></div>
   <button class="btn primary" data-act="scout" ${yth.length>=12?'disabled':''}>Enviar ojeador</button>${yth.length>=12?'<p class="small muted">La cantera está llena (12).</p>':''}`}
  </div>
  <div class="card"><h3>Cómo funciona</h3><p class="small muted">Los canteranos progresan cada semana según su edad y potencial. Súbelos al primer equipo cuando estén listos; a los 19 años suben automáticamente. Cada verano llegan dos juveniles nuevos.</p></div>
  <div class="card" style="grid-column:1/-1"><h3>Juveniles (${yth.length}/12)</h3>
   <div class="tbl-wrap"><table><thead><tr><th>Pos</th><th>Nombre</th><th>Edad</th><th>Med</th><th>Potencial</th><th>Progreso</th></tr></thead><tbody>
   ${yth.map(p=>`<tr class="click" data-player="${p.id}"><td>${posTag(p.pos)}</td><td><b>${esc(p.name)}</b> ${flag(p.nat)}</td><td>${p.age}</td><td>${ovrTag(p.ovr)}</td><td><span class="stars">${stars(clamp((p.pot-55)/8,0.5,5))}</span> <span class="muted small">${p.pot-3}–${p.pot+3}</span></td><td><div class="bar" style="width:80px"><i style="width:${Math.min(100,p.prog)}%"></i></div></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Aún no tienes juveniles. Envía un ojeador para descubrir talento.</td></tr>'}
   </tbody></table></div></div></div>`;
}

/* ---------- ligas ---------- */
function vLeague(){
  const di=UI.leagueDiv??me().div;const d=S.divs[di];
  const head=`<div class="row" style="margin-bottom:12px"><label class="label" for="divsel">Competición</label><select id="divsel" data-change="leagueDiv">${S.divs.map((x,i)=>`<option value="${i}" ${i===di?'selected':''}>${esc(x.name)} · ${esc(x.country)}</option>`).join('')}</select></div>
   <div class="tabs">${[['tabla','Clasificación'],['res','Resultados'],['goles','Goleadores']].map(([k,l])=>`<button class="${UI.leagueTab===k?'on':''}" data-ltab="${k}">${l}</button>`).join('')}</div>`;
  if(UI.leagueTab==='tabla'){const tb=table(di);const n=tb.length;const i2=S.divs.findIndex(x=>x.country===d.country&&x.tier===2);const sw=d.tier===1?d.sw:S.divs[S.divs.findIndex(x=>x.country===d.country&&x.tier===1)].sw;
    const zone=i=>d.tier===1?(i<4?'var(--info)':i<7?'var(--good)':i>=n-sw?'var(--bad)':'transparent'):(i<sw?'var(--good)':'transparent');
    return head+`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Club</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th><th>Forma</th></tr></thead><tbody>
    ${tb.map((r,i)=>{const c=S.clubs[r.id];return `<tr class="${r.id===S.user.clubId?'me':''}"><td style="box-shadow:inset 3px 0 0 ${zone(i)}">${i+1}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${crest(c)} ${esc(c.name)}</span></td><td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.gf-r.gc>0?'+':''}${r.gf-r.gc}</td><td><b>${r.pts}</b></td><td class="form">${r.form.slice(-5).map(f=>`<span class="${f}">${{W:'V',D:'E',L:'D'}[f]}</span>`).join('')}</td></tr>`;}).join('')}
    </tbody></table></div><p class="small muted" style="margin-top:8px">${d.tier===1?'<span style="color:var(--info)">■</span> Champions League · <span style="color:var(--good)">■</span> Europa · <span style="color:var(--bad)">■</span> Descenso':'<span style="color:var(--good)">■</span> Ascenso a primera'}</p></div>`;}
  if(UI.leagueTab==='res'){let played=0;d.fx.forEach((rd,i)=>{if(rd.some(f=>f.played))played=i;});const r=clamp(UI.round??played,0,d.fx.length-1);const rd=d.fx[r];
    return head+`<div class="card"><div class="row between" style="margin-bottom:10px"><button class="btn sm" data-round="${r-1}" ${r<=0?'disabled':''}>‹</button><b>Jornada ${r+1}</b><button class="btn sm" data-round="${r+1}" ${r>=d.fx.length-1?'disabled':''}>›</button></div>
    ${rd.map(f=>{const h=S.clubs[f.h],a=S.clubs[f.a];const goals=f.ev.filter(e=>e.t==='g');return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center"><span class="row" style="justify-content:flex-end;gap:8px;text-align:right;flex-wrap:nowrap">${esc(h.name)} ${crest(h)}</span><b class="num" style="font:700 20px/1 var(--display);min-width:54px;text-align:center">${f.played?f.hg+' - '+f.ag:'–'}</b><span class="row" style="gap:8px;flex-wrap:nowrap">${crest(a)} ${esc(a.name)}</span></div>
     ${goals.length?`<div class="small muted" style="text-align:center;margin-top:4px">${goals.map(g=>`${esc(nm(g.pid))} ${g.min}'`).join(' · ')}</div>`:''}</div>`;}).join('')}</div>`;}
  const set=new Set(d.clubs);const ps=Object.values(S.players).filter(p=>p.clubId!=null&&set.has(p.clubId)&&(p.stats.goals||p.stats.assists)).sort((a,b)=>b.stats.goals-a.stats.goals||b.stats.assists-a.stats.assists).slice(0,25);
  return head+`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Jugador</th><th>Club</th><th>PJ</th><th>Goles</th><th>Asist.</th><th>Nota</th></tr></thead><tbody>
  ${ps.map((p,i)=>`<tr class="click ${p.clubId===S.user.clubId?'me':''}" data-player="${p.id}"><td>${i+1}</td><td>${posTag(p.pos)} ${esc(p.name)} ${flag(p.nat)}</td><td>${esc(S.clubs[p.clubId].name)}</td><td>${p.stats.apps}</td><td><b>${p.stats.goals}</b></td><td>${p.stats.assists}</td><td>${(p.stats.rsum/p.stats.apps).toFixed(2)}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">Todavía no se ha disputado ninguna jornada.</td></tr>'}
  </tbody></table></div></div>`;
}

/* ---------- bandeja ---------- */
function vInbox(){
  return `<div class="card" style="padding:6px 0">${S.news.map(n=>`<div class="msg ${n.read?'':'unread'}" data-msg="${n.id}"><div style="min-width:0;flex:1"><div class="row between"><span class="t">${n.title}</span><span class="small muted">${seasonLabel(n.season-S.season)} · sem. ${n.week+1}</span></div>
   <div class="small muted">${n.type==='offer'?(n.done?'Oferta · '+esc(n.done):'<b style="color:var(--accent)">Oferta pendiente</b>'):n.type==='rumor'?'Mercado':'Club'}</div></div></div>`).join('')||'<p class="muted" style="padding:12px">Sin mensajes.</p>'}</div>`;
}
function openMsg(id){const n=S.news.find(x=>x.id===id);if(!n)return;n.read=true;save();
  let act='';if(n.type==='offer'&&!n.done){const p=P(n.data.pid);if(!p||p.clubId!==S.user.clubId){n.done='Ya no disponible';}
    else act=`<div class="row" style="margin-top:14px"><button class="btn primary" data-act="acceptOffer" data-id="${n.id}">Aceptar ${money(n.data.fee)}</button><button class="btn" data-act="counterOffer" data-id="${n.id}">Pedir ${money(roundMoney(n.data.fee*1.25))}</button><button class="btn danger" data-act="rejectOffer" data-id="${n.id}">Rechazar</button></div>`;}
  modal(`<h2>${n.title}</h2><div class="small muted" style="margin-bottom:10px">Temporada ${seasonLabel(n.season-S.season)} · semana ${n.week+1}</div><div>${n.body}</div>${n.done?`<p class="pill" style="margin-top:12px">${esc(n.done)}</p>`:''}${act}<div class="row" style="margin-top:14px"><button class="btn" data-close style="margin-left:auto">Cerrar</button></div>`);render();}

/* ---------- club ---------- */
function vClub(){
  const c=me();
  return `<div class="grid g2">
   <div class="card"><h3>Finanzas</h3>
    <div class="grid g3"><div><div class="label">Fichajes</div><div class="num" style="font:700 24px/1.1 var(--display)">${money(c.budget)}</div></div>
    <div><div class="label">Salarios / sem</div><div class="num" style="font:700 24px/1.1 var(--display)">${money(wageBill(c.id))}</div><div class="small muted">Límite ${money(c.wageBudget)}</div></div>
    <div><div class="label">Valor plantilla</div><div class="num" style="font:700 24px/1.1 var(--display)">${money(squad(c.id).reduce((s,p)=>s+valueOf(p),0))}</div></div></div>
    <p class="small muted" style="margin-top:10px">Al final de cada temporada la directiva asigna un nuevo presupuesto según el club, la clasificación y el objetivo cumplido.</p></div>
   <div class="card"><h3>El club</h3><div class="row">${crest(c,true)}<div><div style="font-weight:600">${esc(c.name)}</div><div class="small muted">${esc(clubPlace(c))} · ${esc(userDiv().name)}</div><div class="stars">${stars(c.rep)}</div></div></div></div>
   <div class="card"><h3>Tu carrera</h3><p><b>${esc(S.user.name)}</b> · Ligas ganadas: <b>${S.user.trophies}</b></p>
    <div class="tbl-wrap"><table><thead><tr><th>Temp.</th><th>Club</th><th>Pos.</th><th>Pts</th><th>Objetivo</th></tr></thead><tbody>${S.user.history.slice().reverse().map(h=>`<tr><td>${h.season}</td><td>${esc(h.club)}</td><td>${h.pos}º</td><td>${h.pts}</td><td><span class="pill ${h.met?'good':'bad'}">${h.met?'Cumplido':'Fallado'}</span></td></tr>`).join('')||'<tr><td colspan="5" class="muted">Primera temporada en curso.</td></tr>'}</tbody></table></div></div>
   <div class="card"><h3>Partida</h3><p class="small muted">La partida se guarda automáticamente en este navegador. Exporta una copia para pasarla a otro dispositivo.</p>
    <div class="row"><button class="btn" data-act="export">Exportar partida</button><label class="btn" for="importFile">Importar partida</label><input type="file" id="importFile" accept=".json,.txt,application/json" hidden>
    <button class="btn danger" data-act="newCareer">Nueva carrera</button></div><textarea id="exportBox" hidden readonly aria-label="Partida exportada" style="width:100%;height:110px;margin-top:10px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:8px"></textarea>
    <p class="small muted" style="margin-top:10px">Base de datos: ${esc(DB.source)}. Plantillas, medias, valores y salarios de la temporada ${DB.season}.</p></div>
  </div>`;
}

/* ---------- inicio de juego ---------- */
let START_LEVELS=null;
function startLevels(){if(START_LEVELS)return START_LEVELS;const by={};DB.players.forEach(r=>{if(r[8]<0)return;(by[r[8]]=by[r[8]]||[]).push(r[2]);});
  START_LEVELS=DB.clubs.map((c,i)=>{const a=(by[i]||[]).sort((x,y)=>y-x).slice(0,11);return a.length?a.reduce((s,x)=>s+x,0)/a.length:60;});return START_LEVELS;}
function renderStart(){
  const saved=loadMeta();const sel=UI.newClub;const lv=startLevels();const d=DB.divs[UI.startDiv];
  const list=d.clubs.map(i=>({i,c:DB.clubs[i],l:lv[i]})).sort((a,b)=>b.l-a.l);
  root.innerHTML=`<div class="start"><div class="box">
   <div><div class="label" style="color:var(--accent)">EA SPORTS FC 26 · Temporada ${DB.season}</div><div class="hero-title">Modo carrera:<br><em>el míster</em> eres tú</div>
   <p class="muted" style="max-width:62ch">Equipos, jugadores, valores de mercado, salarios y presupuestos reales de las cinco grandes ligas y sus segundas divisiones. Ficha, forma canteranos, decide el once y vive cada partido minuto a minuto.</p></div>
   ${saved?`<div class="card row between"><div><div class="label">Partida guardada</div><div style="font-weight:600">${esc(saved.name)} · ${esc(saved.club)} · ${2025+saved.season-1}/${String((2026+saved.season-1)%100).padStart(2,'0')}</div></div><button class="btn primary" data-act="continue">Continuar carrera</button></div>`:''}
   <div class="card"><h3>Nueva carrera</h3>
    <div class="row" style="margin-bottom:12px"><label class="label" for="mgr">Tu nombre</label><input type="text" id="mgr" placeholder="Nombre del entrenador" maxlength="30" style="flex:1;min-width:180px"></div>
    <div class="tabs">${DB.divs.map((x,i)=>`<button class="${UI.startDiv===i?'on':''}" data-sdiv="${i}">${esc(x.n)}</button>`).join('')}</div>
    <div class="clubpick">${list.map(({i,c,l})=>`<button class="${sel===i?'on':''}" data-pick="${i}">${crest({short:c.s,c1:c.c1,c2:c.c2})}<div style="min-width:0"><div style="font-weight:600">${esc(c.n)}</div><div class="small muted">Media ${Math.round(l)} · ${money(c.b)}</div><div class="stars">${stars(repFromLevel(l))}</div></div></button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn primary" data-act="start" ${sel==null?'disabled':''}>Firmar con ${sel!=null?esc(DB.clubs[sel].n):'…'}</button><label class="btn" for="importFile">Importar partida</label><input type="file" id="importFile" accept=".json,.txt,application/json" hidden></div>
   </div><p class="small muted">Base de datos: ${esc(DB.source)}.</p></div></div>`;
}
function renderFired(){const offers=jobOffers();
  root.innerHTML=`<div class="start"><div class="box"><div class="hero-title">Destituido</div><p>${esc(S.firedReason||'')}</p>
   <div class="card"><h3>Ofertas de trabajo</h3><p class="small muted">Tu agente ha recibido interés de estos clubes.</p><div class="clubpick">${offers.map(c=>`<button data-job="${c.id}">${crest(c)}<div><div style="font-weight:600">${esc(c.name)}</div><div class="small muted">${esc(S.divs[c.div].name)}</div><div class="stars">${stars(c.rep)}</div></div></button>`).join('')}</div>
   <div class="row" style="margin-top:14px"><button class="btn danger" data-act="newCareer">Empezar de cero</button></div></div></div></div>`;}

/* ---------- partido en directo ---------- */
let timer=null;
function startMatch(live){
  const nf=nextFixture();if(!nf)return;nextFixtureWeek=nf.week;
  const m=createMatch(nf.fx,live);UI.match=m;m.speed=1;
  if(!live){simToEnd(m);m.ended=true;finalizeMatch(m);}
  else push(m,0,'info',`¡Empieza el partido en ${clubPlace(S.clubs[nf.fx.h])}!`,'');
  render();if(live)runTimer();
}
const SPEEDS=[500,220,70];
function runTimer(){clearInterval(timer);const m=UI.match;if(!m)return;timer=setInterval(()=>{if(!UI.match||m.paused||m.ended){if(m.ended){clearInterval(timer);if(!m.fx.played)finalizeMatch(m);renderMatch();}return;}stepMinute(m);if(m.ended)finalizeMatch(m);renderMatch();},SPEEDS[m.speed]);}
function renderMatch(){
  const m=UI.match;let el=document.getElementById('matchView');if(!el){el=document.createElement('div');el.id='matchView';el.className='match';document.body.appendChild(el);}
  const h=S.clubs[m.home.cid],a=S.clubs[m.away.cid];const user=m.home.isUser?m.home:m.away;
  const ptH=m.home.pt||1,ptA=m.away.pt||1;const possH=Math.round(100*ptH/(ptH+ptA));
  const statRow=(l,x,y)=>{const t=(x+y)||1;return `<span class="num">${x}</span><div><div class="small muted" style="text-align:center">${l}</div><div class="b"><i style="width:${100*x/t}%"></i><em style="width:${100*y/t}%"></em></div></div><span class="num">${y}</span>`;};
  const minShown=m.ended?'Final':m.half===2&&m.min===45?'Descanso':m.half===1?(m.min>45?'45+'+(m.min-45):m.min+"'"):(m.min>90?'90+'+(m.min-90):m.min+"'");
  const seen=m.seen||0;m.seen=m.ev.length;
  const feed=m.ev.map((e,i)=>[e,i]).reverse().map(([e,i])=>`<div class="ev ${e.type}${i>=seen?' new':''}"><span class="m">${e.min}'</span><span>${e.side?`<b>${esc(S.clubs[e.side==='h'?m.home.cid:m.away.cid].short)}</b> · `:''}${esc(e.text)}</span></div>`).join('');
  let ratings='';
  if(m.ended&&m.fx.ratings){const rows=Object.entries(user.mins).filter(([id,mn])=>mn>0).map(([id])=>P(+id)).filter(Boolean).sort((x,y)=>m.fx.ratings[y.id]-m.fx.ratings[x.id]);
    ratings=`<div class="card"><h3>Notas de tus jugadores</h3><div class="tbl-wrap"><table><thead><tr><th>Pos</th><th>Jugador</th><th>Min</th><th>G</th><th>A</th><th>Nota</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${posTag(p.pos)}</td><td>${esc(p.name)}</td><td>${user.mins[p.id]}</td><td>${user.contrib[p.id]?.g||0}</td><td>${user.contrib[p.id]?.a||0}</td><td><b style="color:${m.fx.ratings[p.id]>=7.5?'var(--good)':m.fx.ratings[p.id]<6?'var(--bad)':'var(--fg)'}">${m.fx.ratings[p.id].toFixed(1)}</b></td></tr>`).join('')}</tbody></table></div></div>`;}
  el.innerHTML=`<div class="inner">
   <div class="scoreboard"><div class="t">${crest(h)}<span>${esc(h.name)}</span></div><div><div class="score num">${m.home.goals} - ${m.away.goals}</div><span class="clock" style="text-align:center">${minShown}</span></div><div class="t away"><span>${esc(a.name)}</span>${crest(a)}</div></div>
   ${m.ended?`<div class="row" style="justify-content:center"><button class="btn primary" data-act="finishMatch">Continuar</button></div>`:
   `<div class="row" style="justify-content:center">
     <button class="btn ${m.paused?'primary':''}" data-act="pause">${m.paused?(m.half===2&&m.min===45?'Segunda parte':'Reanudar'):'Pausa'}</button>
     <button class="btn" data-act="speed">Velocidad ${['×1','×2','×4'][m.speed]}</button>
     <button class="btn" data-act="subs">Cambios (${user.subs}/5)</button>
     <label class="label" for="liveMent">Mentalidad</label><select id="liveMent" data-change="liveMent">${MENT.map((x,i)=>`<option value="${i}" ${i===user.ment?'selected':''}>${x}</option>`).join('')}</select>
     <button class="btn" data-act="simEnd">Simular hasta el final</button></div>`}
   ${ratings}
   <div class="grid g2"><div class="card"><h3>Retransmisión</h3><div class="feed">${feed}</div></div>
    <div class="card"><h3>Estadísticas</h3><div class="mstats">${statRow('Posesión %',possH,100-possH)}${statRow('Tiros',m.home.shots,m.away.shots)}${statRow('Tiros a puerta',m.home.sot,m.away.sot)}${statRow('Paradas',m.home.saves,m.away.saves)}${statRow('Amarillas',Object.values(m.home.yellows).reduce((s,x)=>s+x,0),Object.values(m.away.yellows).reduce((s,x)=>s+x,0))}${statRow('Rojas',m.home.red.size,m.away.red.size)}</div>
    <div class="small muted" style="margin-top:12px">Goles: ${m.fx.ev.filter(e=>e.t==='g').map(e=>`${esc(S.clubs[e.side==='h'?m.home.cid:m.away.cid].short)} ${esc(nm(e.pid))} ${e.min}'`).join(' · ')||'—'}</div></div></div>
  </div>`;
}
function subsModal(){
  const m=UI.match;const s=m.home.isUser?m.home:m.away;m.paused=true;renderMatch();const out=UI.pendingSubOut;
  modal(`<h2>Cambios (${s.subs}/5)</h2>${s.subs>=5?'<p>Ya has hecho los 5 cambios.</p>':`
   <p class="small muted">${out?'Ahora elige quién entra por '+esc(nm(out))+'.':'Elige el jugador que sale.'}</p>
   <div class="grid g2"><div><div class="label" style="margin-bottom:6px">En el campo</div>${onPitch(s).map(id=>{const p=P(id);return `<button class="btn" style="display:flex;width:100%;justify-content:space-between;margin-bottom:6px;${out===id?'border-color:var(--accent)':''}" data-subout="${id}"><span>${posTag(slotOf(s,id))} ${esc(p.name)}</span><span class="num muted">${Math.round(s.fit[id])}%${s.yellows[id]?' · TA':''}</span></button>`;}).join('')}</div>
   <div><div class="label" style="margin-bottom:6px">Banquillo</div>${s.bench.map(id=>{const p=P(id);return `<button class="btn" style="display:flex;width:100%;justify-content:space-between;margin-bottom:6px" data-subin="${id}" ${out?'':'disabled'}><span>${posTag(p.pos)} ${esc(p.name)}</span><span class="num">${p.ovr}</span></button>`;}).join('')}</div></div>`}
   <div class="row" style="margin-top:10px"><button class="btn" data-close style="margin-left:auto">Volver al partido</button></div>`);
}
function finishUserMatch(){
  const m=UI.match;clearInterval(timer);
  if(!m.fx.played)finalizeMatch(m);
  const my=m.home.isUser?m.home:m.away,op=m.home.isUser?m.away:m.home;
  me().ment=my.ment;
  const res=my.goals>op.goals?'Victoria':my.goals<op.goals?'Derrota':'Empate';
  finishUserWeek([my.goals,op.goals]);
  UI.match=null;const el=document.getElementById('matchView');if(el)el.remove();
  toast(`${res} ${my.goals}-${op.goals} ante ${esc(S.clubs[op.cid].name)}`);
  UI.view='home';render();
}

/* ---------- modal ---------- */
function modal(html){closeModal();const bg=document.createElement('div');bg.className='modal-bg';bg.id='modal';bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(bg);
  bg.addEventListener('click',e=>{if(e.target===bg)closeModal();});}
function closeModal(){const m=document.getElementById('modal');if(m)m.remove();}

/* ================= eventos ================= */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-go],[data-act],[data-player],[data-slot],[data-benchp],[data-sort],[data-ltab],[data-round],[data-msg],[data-pick],[data-sdiv],[data-train],[data-close],[data-page],[data-setfee],[data-subout],[data-subin],[data-job]');
  if(!t)return;const d=t.dataset;
  if(S)invalidate();
  if(d.close!==undefined){closeModal();UI.pendingSubOut=null;return;}
  if(d.go){UI.view=d.go;UI.selSlot=null;closeModal();render();window.scrollTo(0,0);return;}
  if(d.sdiv){UI.startDiv=+d.sdiv;const v=document.getElementById('mgr')?.value;renderStart();if(v)document.getElementById('mgr').value=v;return;}
  if(d.pick){UI.newClub=+d.pick;const v=document.getElementById('mgr')?.value;renderStart();if(v)document.getElementById('mgr').value=v;return;}
  if(d.job){takeJob(+d.job);UI.view='home';render();return;}
  if(d.player){playerModal(+d.player);return;}
  if(d.sort){UI.sqSort=d.sort;render();return;}
  if(d.ltab){UI.leagueTab=d.ltab;UI.round=null;render();return;}
  if(d.round){UI.round=+d.round;render();return;}
  if(d.msg){openMsg(+d.msg);return;}
  if(d.train){S.training=d.train;save();render();return;}
  if(d.page){UI.mk.page=Math.max(0,UI.mk.page+ +d.page);render();return;}
  if(d.setfee){const f=document.getElementById('fee');if(f)f.value=d.setfee;return;}
  if(d.slot!==undefined){const i=+d.slot;const xi=userLineup();
    if(UI.selSlot==null)UI.selSlot=i;else if(UI.selSlot===i)UI.selSlot=null;else{[xi[UI.selSlot],xi[i]]=[xi[i],xi[UI.selSlot]];UI.selSlot=null;save();}
    render();return;}
  if(d.benchp){const id=+d.benchp;if(UI.selSlot==null){playerModal(id);return;}const xi=userLineup();xi[UI.selSlot]=id;UI.selSlot=null;save();render();return;}
  if(d.subout){UI.pendingSubOut=+d.subout;subsModal();return;}
  if(d.subin){const m=UI.match;const s=m.home.isUser?m.home:m.away;if(UI.pendingSubOut&&s.subs<5)doSub(m,s,UI.pendingSubOut,+d.subin);UI.pendingSubOut=null;subsModal();return;}
  if(d.act)act(d.act,t);
});
document.addEventListener('change',e=>{
  const t=e.target;const d=t.dataset;
  if(d.change==='formation'){const c=me();c.formation=t.value;c.lineup=bestXI(c.id,c.formation);UI.selSlot=null;save();render();}
  else if(d.change==='ment'){me().ment=+t.value;save();}
  else if(d.change==='liveMent'){const m=UI.match;(m.home.isUser?m.home:m.away).ment=+t.value;}
  else if(d.change==='leagueDiv'){UI.leagueDiv=+t.value;UI.round=null;render();}
  else if(d.mk){UI.mk[d.mk]=['q','pos','league'].includes(d.mk)?t.value:+t.value;UI.mk.page=0;render();}
  else if(t.id==='importFile'&&t.files[0]){const r=new FileReader();r.onload=()=>{parseSave(String(r.result)).then(data=>{if(!data||!data.clubs||!data.players||!data.divs)throw 0;S=data;invalidate();save();UI.view='home';render();toast('Partida importada');}).catch(()=>toast('El archivo no es una partida válida.'));};r.readAsText(t.files[0]);}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('modal')){closeModal();UI.pendingSubOut=null;}});

function act(a,t){
  const id=t.dataset.id?+t.dataset.id:null;
  switch(a){
  case 'start':{const name=(document.getElementById('mgr').value||'').trim()||'Míster';t.disabled=true;t.textContent='Cargando la base de datos…';setTimeout(()=>{newGame(name,UI.newClub);UI.view='home';render();},30);break;}
  case 'continue':t.disabled=true;t.textContent='Cargando…';load().then(s=>{if(!s){toast('No se ha podido leer la partida guardada.');renderStart();return;}S=s;invalidate();UI.view='home';render();});break;
  case 'newCareer':modal(`<h2>¿Nueva carrera?</h2><p>Se borrará la partida guardada en este navegador.</p><div class="row"><button class="btn danger" data-act="confirmNew">Sí, empezar de cero</button><button class="btn" data-close>Cancelar</button></div>`);break;
  case 'confirmNew':saveSeq++;try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(META_KEY);}catch(e){}S=null;UI.newClub=null;closeModal();render();break;
  case 'play':startMatch(true);break;
  case 'sim':startMatch(false);break;
  case 'pause':{const m=UI.match;m.paused=!m.paused;renderMatch();if(!m.paused)runTimer();break;}
  case 'speed':{const m=UI.match;m.speed=(m.speed+1)%3;runTimer();renderMatch();break;}
  case 'subs':UI.pendingSubOut=null;subsModal();break;
  case 'simEnd':{const m=UI.match;m.live=false;simToEnd(m);finalizeMatch(m);clearInterval(timer);renderMatch();break;}
  case 'finishMatch':finishUserMatch();break;
  case 'autoXI':{const c=me();c.lineup=bestXI(c.id,c.formation);UI.selSlot=null;save();render();break;}
  case 'endSeason':endSeason();save();render();break;
  case 'nextSeason':beginNextSeason();render();break;
  case 'toFired':fired(S.lastSummary.reason);render();break;
  case 'toggleList':{const p=P(id);p.listed=!p.listed;save();render();playerModal(id);break;}
  case 'renew':{const p=P(id);const dem=Math.round(Math.max(p.wage*1.1,wageFor(p,me().rep))/500)*500;
    if(p.morale<35){modal(`<h2>${esc(p.name)}</h2><p>Su moral es demasiado baja: no quiere renovar ahora mismo.</p><button class="btn" data-close>Cerrar</button>`);break;}
    modal(`<h2>Renovar a ${esc(p.name)}</h2><p>Pide <b>${money(dem)}/sem</b> (ahora cobra ${money(p.wage)}).</p><div class="row"><label class="label" for="ryears">Años</label><select id="ryears">${[1,2,3,4,5].map(y=>`<option ${y===3?'selected':''}>${y}</option>`).join('')}</select>
     <button class="btn primary" data-act="doRenew" data-id="${p.id}" data-w="${dem}">Firmar renovación</button><button class="btn" data-close>Cancelar</button></div>`);break;}
  case 'doRenew':{const p=P(id);const w=+t.dataset.w;const c=me();if(wageBill(c.id)-p.wage+w>c.wageBudget){toast('Superas el límite salarial.');break;}p.wage=w;p.contract=+document.getElementById('ryears').value;p.morale=clamp(p.morale+8,0,100);save();closeModal();toast(`${esc(p.name)} renueva hasta ${2025+S.season+p.contract-1}`);render();break;}
  case 'release':{const p=P(id);const cost=Math.round(p.wage*38*p.contract*0.5);modal(`<h2>Rescindir a ${esc(p.name)}</h2><p>La indemnización cuesta <b>${money(cost)}</b> del presupuesto de fichajes.</p><div class="row"><button class="btn danger" data-act="doRelease" data-id="${id}" data-cost="${cost}">Rescindir</button><button class="btn" data-close>Cancelar</button></div>`);break;}
  case 'doRelease':{const p=P(id);const c=me();c.budget-=+t.dataset.cost;p.clubId=null;p.contract=0;p.listed=false;invalidate();if(c.lineup)c.lineup=c.lineup.map(x=>x===id?null:x);addNews('Rescisión: '+esc(p.name),`${esc(p.name)} queda libre tras rescindir su contrato.`,'info');save();closeModal();render();break;}
  case 'promote':{const p=P(id);p.youth=false;p.contract=3;p.wage=Math.max(2000,wageFor(p,me().rep));invalidate();assignNumbers(p.clubId);save();closeModal();toast(`${esc(p.name)} sube al primer equipo`);render();break;}
  case 'releaseYouth':{delete S.players[id];invalidate();save();closeModal();render();break;}
  case 'scout':{const lv=+document.getElementById('sc-lv').value;const region=document.getElementById('sc-region').value;const c=me();const cost=SCOUT_LV[lv].cost;
    if(c.budget<cost){toast('Presupuesto insuficiente.');break;}c.budget-=cost;S.scout={lv,region,weeks:3};save();render();toast('Ojeador enviado: '+REGIONS[region]);break;}
  case 'bid':closeModal();bidModal(id);break;
  case 'sendBid':{const p=P(id);const neg=askingPrice(p);const fee=Math.max(0,Math.round(+document.getElementById('fee').value||0));const c=me();
    if(fee>c.budget){bidModal(id,null,{msg:'No tienes presupuesto suficiente para esa oferta.'});break;}
    neg.tries++;const club=S.clubs[p.clubId];
    if(fee>=neg.ask){neg.agreed=fee;save();bidModal(id,'contract',{fee});}
    else if(fee>=neg.ask*0.6&&neg.tries<3){const counter=roundMoney(Math.max(neg.ask*0.97,(fee+neg.ask)/2+neg.ask*0.06));bidModal(id,null,{msg:`${club.name} rechaza la oferta, pero aceptaría ${money(counter)}.`,counter});}
    else bidModal(id,null,{msg:neg.tries>=3?`${club.name} da por cerradas las negociaciones hasta el próximo mercado.`:`${club.name} considera la oferta insuficiente.`});
    save();break;}
  case 'acceptCounter':{const p=P(id);const fee=+t.dataset.fee;if(fee>me().budget){toast('Presupuesto insuficiente.');break;}askingPrice(p).agreed=fee;save();bidModal(id,'contract',{fee});break;}
  case 'sendContract':{const p=P(id);const fee=+t.dataset.fee;const w=Math.round(+document.getElementById('wage').value||0);const y=+document.getElementById('years').value;const c=me();const dem=wageDemand(p);
    if(wageBill(c.id)+w>c.wageBudget){bidModal(id,'contract',{fee,msg:'Ese salario supera tu límite salarial semanal. Vende o rescinde para liberar masa salarial.'});break;}
    if(w<dem*0.9){const k='w'+p.id+'-'+S.season;S.neg[k]=(S.neg[k]||0)+1;if(S.neg[k]>=3){closeModal();toast(`${esc(p.name)} rompe las negociaciones.`);if(fee)askingPrice(p).agreed=0;break;}bidModal(id,'contract',{fee,msg:`${p.name} rechaza la propuesta. Quiere cerca de ${money(dem)}/sem.`});break;}
    if(fee>c.budget){toast('Presupuesto insuficiente.');break;}
    signPlayer(p,fee,w,y);closeModal();toast(`¡${esc(p.name)} es nuevo jugador de ${esc(c.name)}!`);render();break;}
  case 'acceptOffer':{const n=S.news.find(x=>x.id===id);const p=P(n.data.pid);sellPlayer(p,n.data.cid,n.data.fee);n.done='Aceptada · '+money(n.data.fee);save();closeModal();render();break;}
  case 'rejectOffer':{const n=S.news.find(x=>x.id===id);n.done='Rechazada';const p=P(n.data.pid);if(p)p.morale=clamp(p.morale-(p.listed?0:4),0,100);save();closeModal();render();break;}
  case 'counterOffer':{const n=S.news.find(x=>x.id===id);const p=P(n.data.pid);const ask=roundMoney(n.data.fee*1.25);
    if(R()<0.5){sellPlayer(p,n.data.cid,ask);n.done='Contraoferta aceptada · '+money(ask);toast(`${esc(S.clubs[n.data.cid].name)} acepta pagar ${money(ask)}`);}else{n.done='El club comprador se retira';toast('El club comprador se retira de la negociación');}
    save();closeModal();render();break;}
  case 'export':{packSave().then(txt=>{const box=document.getElementById('exportBox');if(box){box.hidden=false;box.value=txt;box.select();}
    try{const blob=new Blob([txt],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='modo-carrera-'+seasonLabel().replace('/','-')+'.txt';a.click();}catch(e){}
    try{navigator.clipboard.writeText(txt).then(()=>toast('Partida copiada al portapapeles'),()=>{});}catch(e){}});break;}
  }
}
render();

"use strict";
/* Modo Carrera Míster · temporada 2026/27 con datos reales de EA SPORTS FC 26 (ver data.js) */

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
/* fechas ISO (AAAA-MM-DD) */
const DT=s=>new Date(s+'T12:00:00Z');
function addDays(s,n){const d=DT(s);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function dayDiff(a,b){return Math.round((DT(b)-DT(a))/864e5);}
const DOW=['dom','lun','mar','mié','jue','vie','sáb'],MON=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],MONL=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function fmtDate(s,year){const d=DT(s);return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}${year?' '+d.getUTCFullYear():''}`;}

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

const NATION={'Spain':['ES','España'],'France':['FR','Francia'],'Germany':['DE','Alemania'],'Italy':['IT','Italia'],'England':['ENG','Inglaterra'],'Scotland':['SCT','Escocia'],'Wales':['WLS','Gales'],'Northern Ireland':['','Irlanda del Norte'],'Republic of Ireland':['IE','Irlanda'],
 'Portugal':['PT','Portugal'],'Netherlands':['NL','Países Bajos'],'Belgium':['BE','Bélgica'],'Brazil':['BR','Brasil'],'Argentina':['AR','Argentina'],'Uruguay':['UY','Uruguay'],'Colombia':['CO','Colombia'],'Ecuador':['EC','Ecuador'],'Chile':['CL','Chile'],'Paraguay':['PY','Paraguay'],'Peru':['PE','Perú'],'Venezuela':['VE','Venezuela'],'Mexico':['MX','México'],'United States':['US','Estados Unidos'],'Canada':['CA','Canadá'],'Jamaica':['JM','Jamaica'],'Panama':['PA','Panamá'],'Costa Rica':['CR','Costa Rica'],'Honduras':['HN','Honduras'],
 'Morocco':['MA','Marruecos'],'Algeria':['DZ','Argelia'],'Tunisia':['TN','Túnez'],'Egypt':['EG','Egipto'],'Senegal':['SN','Senegal'],"Côte d'Ivoire":['CI','Costa de Marfil'],'Ghana':['GH','Ghana'],'Nigeria':['NG','Nigeria'],'Cameroon':['CM','Camerún'],'Mali':['ML','Malí'],'Guinea':['GN','Guinea'],'Congo DR':['CD','R. D. del Congo'],'Burkina Faso':['BF','Burkina Faso'],'Gambia':['GM','Gambia'],'Gabon':['GA','Gabón'],'Angola':['AO','Angola'],'Togo':['TG','Togo'],'Cabo Verde':['CV','Cabo Verde'],'Equatorial Guinea':['GQ','Guinea Ecuatorial'],'South Africa':['ZA','Sudáfrica'],'Guinea-Bissau':['GW','Guinea-Bisáu'],'Benin':['BJ','Benín'],'Zambia':['ZM','Zambia'],'Zimbabwe':['ZW','Zimbabue'],'Comoros':['KM','Comoras'],'Mauritania':['MR','Mauritania'],'Sierra Leone':['SL','Sierra Leona'],'Central African Republic':['CF','R. Centroafricana'],'Congo':['CG','Congo'],
 'Denmark':['DK','Dinamarca'],'Sweden':['SE','Suecia'],'Norway':['NO','Noruega'],'Finland':['FI','Finlandia'],'Iceland':['IS','Islandia'],'Switzerland':['CH','Suiza'],'Austria':['AT','Austria'],'Poland':['PL','Polonia'],'Czechia':['CZ','Chequia'],'Slovakia':['SK','Eslovaquia'],'Hungary':['HU','Hungría'],'Croatia':['HR','Croacia'],'Serbia':['RS','Serbia'],'Slovenia':['SI','Eslovenia'],'Bosnia and Herzegovina':['BA','Bosnia'],'Montenegro':['ME','Montenegro'],'North Macedonia':['MK','Macedonia del Norte'],'Albania':['AL','Albania'],'Kosovo':['XK','Kosovo'],'Greece':['GR','Grecia'],'Cyprus':['CY','Chipre'],'Türkiye':['TR','Turquía'],'Romania':['RO','Rumanía'],'Bulgaria':['BG','Bulgaria'],'Ukraine':['UA','Ucrania'],'Russia':['RU','Rusia'],'Georgia':['GE','Georgia'],'Armenia':['AM','Armenia'],'Azerbaijan':['AZ','Azerbaiyán'],'Kazakhstan':['KZ','Kazajistán'],'Israel':['IL','Israel'],'Lithuania':['LT','Lituania'],'Latvia':['LV','Letonia'],'Luxembourg':['LU','Luxemburgo'],'Gibraltar':['GI','Gibraltar'],'Andorra':['AD','Andorra'],
 'Japan':['JP','Japón'],'Korea Republic':['KR','Corea del Sur'],'Australia':['AU','Australia'],'New Zealand':['NZ','Nueva Zelanda'],'Saudi Arabia':['SA','Arabia Saudí'],'Iran':['IR','Irán'],'China PR':['CN','China'],'Indonesia':['ID','Indonesia'],'Haiti':['HT','Haití'],'Suriname':['SR','Surinam'],'Dominican Republic':['DO','R. Dominicana'],'Curaçao':['CW','Curazao']};
const SUBFLAG={ENG:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',SCT:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',WLS:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}'};
function flag(n){const x=NATION[n];if(!x||!x[0])return '';const c=x[0];if(SUBFLAG[c])return SUBFLAG[c];if(c.length!==2)return '';return String.fromCodePoint(...[...c].map(ch=>127397+ch.charCodeAt(0)));}
function natName(n){return NATION[n]?NATION[n][1]:n;}

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
 Netherlands:{first:['Frenkie','Cody','Xavi','Teun','Ryan','Denzel','Joey','Micky'],last:['de Jong','Bakker','Visser','Smit','de Vries','Timber','Koopmeiners','van de Ven']},
 Slavic:{first:['Luka','Marko','Nikola','Stefan','Filip','Ivan','Matej','Petar','Dušan','Milan','Tomáš','Martin','Jakub','Aleksandar','Nemanja'],last:['Petrović','Jovanović','Novak','Horvat','Kovačević','Marković','Ilić','Popov','Hristov','Dimitrov','Kováč','Svoboda','Dvořák','Nikolić','Stanković']},
 Nordic:{first:['Erik','Ole','Jonas','Mathias','Kristian','Sondre','Elias','Aleksi','Eero','Viktor','Oskar','Henrik'],last:['Hansen','Johansen','Olsen','Larsen','Andersen','Berg','Haugen','Virtanen','Korhonen','Nieminen','Lindqvist','Nilsen']},
 Greek:{first:['Giorgos','Dimitris','Kostas','Nikos','Christos','Andreas','Panagiotis','Giannis','Michalis','Stelios'],last:['Papadopoulos','Georgiou','Konstantinou','Nikolaou','Ioannou','Christodoulou','Papageorgiou','Vlachos','Antoniou','Charalambous']},
 Eastern:{first:['Giorgi','Levan','Arman','Aram','Ruslan','Nurlan','Eldar','Tigran','Lukas','Mantas','Ermal','Kristaps','Daniyar'],last:['Beridze','Kvaratskhelia','Hovhannisyan','Abdullayev','Aliyev','Sargsyan','Bekov','Kazlauskas','Bērziņš','Hoxha','Krasniqi','Nurlanov']},
 Israel:{first:['Omer','Itay','Dor','Yonatan','Eran','Liel','Shon','Gadi'],last:['Cohen','Levi','Mizrahi','Peretz','Biton','Dahan','Avraham','Friedman']}
};
const NAME_POOL={Serbia:'Slavic',Slovakia:'Slavic',Slovenia:'Slavic',Bulgaria:'Slavic',Czechia:'Slavic',Croatia:'Slavic','Bosnia and Herzegovina':'Slavic',Norway:'Nordic',Finland:'Nordic',Greece:'Greek',Cyprus:'Greek',Azerbaijan:'Eastern',Kazakhstan:'Eastern',Armenia:'Eastern',Georgia:'Eastern',Latvia:'Eastern',Lithuania:'Eastern',Albania:'Eastern',Israel:'Israel',Gibraltar:'England',Andorra:'Spain'};
const REGION_NATS={SA:['Argentina','Brazil','Uruguay','Colombia'],EU:['France','Portugal','Germany','Italy','Netherlands','England'],AF:['Morocco','Senegal','Nigeria']};
const COUNTRY_NAT={'España':'Spain','Inglaterra':'England','Italia':'Italy','Alemania':'Germany','Francia':'France'};
function pickNat(region,country){const local=COUNTRY_NAT[country]||'Spain';
  if(region==='LOC')return R()<0.85?local:pick(['Argentina','Brazil','Uruguay','France','Morocco']);
  if(REGION_NATS[region])return pick(REGION_NATS[region]);
  return R()<0.7?local:pick(['Argentina','Brazil','France','Portugal','Morocco','Senegal','Netherlands']);}
function genName(nat){const d=NAMES[nat]||NAMES[NAME_POOL[nat]]||NAMES.Spain;return pick(d.first).charAt(0)+'. '+pick(d.last);}

/* ================= estado ================= */
let S=null;
const UI={view:'home',sqSort:'pos',sqMode:'cards',selSlot:null,mk:{pos:'',maxAge:40,minOvr:70,maxPrice:0,q:'',league:'',page:0},leagueTab:'tabla',leagueComp:null,round:null,newClub:null,startDiv:0,match:null,pendingSubOut:null};
const SAVE_KEY='modo_carrera_mister_2627_v4';

function P(id){return S.players[id];}
function me(){return S.clubs[S.user.clubId];}
function userDiv(){return S.divs[me().div];}
function seasonLabel(off){const y=S.year+(off||0);return y+'/'+String((y+1)%100).padStart(2,'0');}

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
function contractEnd(p){return '30/06/'+(S.year+p.contract);}

function makePlayer(o){
  const id=S.nextId++;const club=o.clubId!=null?S.clubs[o.clubId]:null;
  const nat=o.nat||pickNat(o.region,club?club.country:'España');
  const age=o.age;const ovr=clamp(Math.round(o.ovr),40,94);
  const pot=o.pot!=null?o.pot:clamp(Math.round(ovr+Math.max(0,26-age)*(0.8+R()*1.6)+ri(0,3)),ovr,95);
  const p={id,name:genName(nat),nat,age,pos:o.pos,alt:[o.pos],ovr,ovr0:ovr,pot,clubId:o.clubId??null,youth:!!o.youth,contract:o.contract??ri(1,5),wage:0,vm:1,face:-1,
    morale:ri(60,80),fitness:100,injury:0,susp:0,yellows:0,prog:0,training:0,form:0,listed:false,stats:newStats(),hist:[],var:[0,0,0,0,0,0].map(()=>ri(-4,4)),num:0,gen:1};
  p.wage=p.youth?1000:wageFor(p,club?club.rep:2);
  S.players[id]=p;if(ROSTER&&p.clubId!=null){let a=ROSTER.get(p.clubId);if(!a)ROSTER.set(p.clubId,a=[]);a.push(p);}return p;}
const SQUAD_TEMPLATE=['POR','LD','DFC','DFC','LI','MCD','MC','MC','ED','DC','EI','POR','LD','DFC','DFC','LI','MC','MCO','MCO','EI','ED','DC','POR','MC','DC'];
function buildGenSquad(cid,lvl,nat){SQUAD_TEMPLATE.forEach((pos,i)=>{const ovr=i<11?lvl+ri(-3,3):i<22?lvl-4+ri(-4,2):lvl-11+ri(-3,3);const age=i<11?ri(22,32):i<22?ri(19,33):ri(17,20);
  makePlayer({pos,ovr,age,clubId:cid,nat:R()<0.8?nat:undefined});});}

function assignNumbers(cid){const used=new Set();const sq=squad(cid,true).sort((a,b)=>b.ovr-a.ovr);
  sq.forEach(p=>{if(p.num&&!used.has(p.num))used.add(p.num);else p.num=0;});
  const pref={POR:[1,13,25],LD:[2,12,22],DFC:[4,5,3,15,24],LI:[3,23,18],MCD:[6,16,14],MC:[8,14,16,20],MCO:[10,21,19],ED:[7,17,11],EI:[11,17,7],DC:[9,19,18]};
  sq.forEach(p=>{if(p.num)return;let n=(pref[p.pos]||[]).find(x=>!used.has(x));if(!n){n=26;while(used.has(n))n++;}p.num=n;used.add(n);});}

function newGame(managerName,clubIdx){
  S={v:3,nextId:1,year:DB.year,date:DB.start,user:{name:managerName||'Míster',clubId:clubIdx,history:[],trophies:[]},clubs:[],players:{},divs:[],comps:{},fx:[],news:[],neg:{},scout:null,
     board:{conf:60,target:10,objective:''},trainSel:[],trainNext:null,msgId:1,over:false,seasonDone:false,euroNext:null};
  DB.divs.forEach(d=>S.divs.push({id:d.id,name:d.n,country:d.c,tier:d.t,sw:d.sw,clubs:d.clubs.slice(),dates:d.dates.slice()}));
  DB.clubs.forEach((c,i)=>S.clubs.push({id:i,name:c.n,short:c.s,c1:c.c1,c2:c.c2,k:c.k,stadium:c.st,league:c.l,div:c.d,ext:c.d<0,country:c.d>=0?DB.divs[c.d].c:(c.cc||''),
    budget:c.b,budget0:c.b,wageBudget:c.w,formation:'4-3-3',ment:2,lineup:null,lvl0:70,rep:2,gen:c.g||null,partial:!!c.partial}));
  DB.players.forEach(r=>{const id=S.nextId++;const alt=r[1].split('/');
    const p={id,name:r[0],pos:alt[0],alt,ovr:r[2],ovr0:r[2],pot:Math.max(r[2],r[3]),age:r[6],nat:DB.nats[r[7]],clubId:r[8]<0?null:r[8],youth:false,
      contract:r[8]<0?0:(r[18]>0?r[18]:(r[6]<=23?ri(2,5):r[6]<=29?ri(1,4):ri(1,2))),wage:Math.max(500,r[5]),vm:1,morale:ri(62,82),fitness:100,injury:0,susp:0,yellows:0,prog:0,training:0,form:0,listed:false,
      stats:newStats(),hist:[],st:r.slice(9,15),foot:r[15],face:r[16],num:r[20]||0,signed:r[17]||0,photo:r[19]||0};
    if(r[4]>0)p.vm=clamp(r[4]/baseValue(p),0.3,3);
    S.players[id]=p;});
  invalidate();
  S.clubs.forEach(c=>{if(c.gen)buildGenSquad(c.id,c.gen[0],c.gen[1]);});
  S.clubs.forEach(c=>{if(c.partial){const sq=squad(c.id).sort((a,b)=>b.ovr-a.ovr).slice(0,11);c.lvl0=sq.length?sq.reduce((s,p)=>s+p.ovr,0)/sq.length:68;}
    else{c.formation=pickFormation(c.id);c.lvl0=clubLevel(c.id);maintainSquad(c.id,true);assignNumbers(c.id);}
    c.rep=repFromLevel(c.lvl0);});
  me().formation='4-3-3';
  buildSeason(DB.euro);
  addNews('Bienvenido, '+esc(S.user.name),`La directiva de ${esc(me().name)} te presenta como nuevo entrenador. La temporada ${seasonLabel()} empieza el 1 de julio de 2026 con la pretemporada y el calendario oficial ya cargado. Objetivo: <b>${S.board.objective}</b>. Presupuesto de fichajes: <b>${money(me().budget)}</b>.${userEuro()?` Este año juegas la <b>${esc(S.comps[userEuro()].name)}</b>.`:''}`,'info');
  contractAlerts(true);
  save();
}
function pickFormation(cid){const sq=squad(cid);const n=pos=>sq.filter(p=>p.pos===pos).length;
  if(n('DFC')>=6&&R()<0.4)return pick(['3-5-2','3-4-3','5-3-2']);if(n('ED')+n('EI')>=4)return pick(['4-3-3','4-2-3-1']);if(n('DC')>=4)return '4-4-2';if(n('MCO')>=2)return pick(['4-2-3-1','4-1-2-1-2']);return pick(['4-3-3','4-2-3-1','4-4-2','4-1-4-1']);}

/* ================= calendario y competiciones ================= */
const EURO_CODES=['ucl','uel','uecl'];
const EURO_NAME={ucl:'Champions League',uel:'Europa League',uecl:'Conference League'};
const STAGE_NAME={league:'Fase liga',po:'Play-off',r16:'Octavos',qf:'Cuartos',sf:'Semifinales',f:'Final'};
let BYDATE=null;
function rebuildIndex(){BYDATE=new Map();S.fx.forEach((f,i)=>{f.i=i;let a=BYDATE.get(f.d);if(!a)BYDATE.set(f.d,a=[]);a.push(i);});}
function fxOn(d){if(!BYDATE)rebuildIndex();return (BYDATE.get(d)||[]).map(i=>S.fx[i]);}
function addFx(f){f.hg=null;f.ag=null;f.played=false;f.ev=[];f.i=S.fx.length;S.fx.push(f);if(BYDATE){let a=BYDATE.get(f.d);if(!a)BYDATE.set(f.d,a=[]);a.push(f.i);}return f;}
function shiftDate(d){return addDays(d,364*(S.year-DB.year));}
function roundRobin(ids){const arr=shuffle(ids.slice());const n=arr.length;const rounds=[];const streak={};arr.forEach(id=>streak[id]=0);
  for(let r=0;r<n-1;r++){const rd=[];for(let i=0;i<n/2;i++){let h=arr[i],a=arr[n-1-i];
      if(streak[h]>streak[a]||(streak[h]===streak[a]&&R()<0.5))[h,a]=[a,h];
      streak[h]=streak[h]>0?streak[h]+1:1;streak[a]=streak[a]<0?streak[a]-1:-1;rd.push([h,a]);}
    rounds.push(rd);arr.splice(1,0,arr.pop());}
  return rounds.concat(rounds.map(rd=>rd.map(([h,a])=>[a,h])));}
function buildSeason(euroSrc){
  S.fx=[];S.comps={};S.seasonDone=false;BYDATE=null;
  S.divs.forEach((d,di)=>{
    S.comps[d.id]={id:d.id,name:d.name,type:'L',div:di};
    const real=S.year===DB.year&&DB.divs[di].fx;
    if(real)real.forEach(([date,r,h,a])=>addFx({c:d.id,d:date,r,h,a}));
    else roundRobin(d.clubs).forEach((rd,r)=>{const base=shiftDate(d.dates[Math.min(r,d.dates.length-1)]);rd.forEach(([h,a])=>{
      const sat=DT(base).getUTCDay()===6;addFx({c:d.id,d:sat&&R()<0.45?addDays(base,1):base,r:r+1,h,a});});});
  });
  EURO_CODES.forEach(code=>{const src=DB.euro[code];const clubs=(euroSrc[code].clubs||euroSrc[code]).slice();
    const comp={id:code,name:src.n,type:'E',clubs,stage:'league',ko:src.ko,rounds:src.dates.length,out:{},champion:null};S.comps[code]=comp;
    const arr=shuffle(clubs.slice());const n=arr.length;
    for(let r=0;r<src.dates.length;r++){for(let i=0;i<n/2;i++){let h=arr[i],a=arr[n-1-i];if((r+i)%2)[h,a]=[a,h];addFx({c:code,d:shiftDate(src.dates[r]),r:r+1,h,a});}arr.splice(1,0,arr.pop());}
  });
  S.fx.sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:0);rebuildIndex();
  setObjective();
  S.clubs.forEach(c=>{c.lineup=null;});
}
function userEuro(){const uid=S.user.clubId;return EURO_CODES.find(c=>S.comps[c]&&S.comps[c].clubs.includes(uid))||null;}
const COMP_SHORT={es1:'LaLiga',es2:'LaLiga 2',en1:'Premier',en2:'Championship',it1:'Serie A',it2:'Serie B',de1:'Bundesliga',de2:'2. Bundesliga',fr1:'Ligue 1',fr2:'Ligue 2',ucl:'Champions',uel:'Europa League',uecl:'Conference'};
function compShort(c){return COMP_SHORT[c]||(S.comps[c]?S.comps[c].name:c);}
function isUserFx(f){return f.h===S.user.clubId||f.a===S.user.clubId;}
function userFixtures(){return S.fx.filter(isUserFx);}
function userFixtureToday(){return fxOn(S.date).find(f=>!f.played&&isUserFx(f))||null;}
function nextUserFixture(){return S.fx.find(f=>!f.played&&isUserFx(f)&&f.d>=S.date)||null;}

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
function table(cid){
  const comp=S.comps[cid];const ids=comp.type==='L'?S.divs[comp.div].clubs:comp.clubs;const t={};ids.forEach(id=>t[id]={id,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0,form:[]});
  S.fx.forEach(f=>{if(f.c!==cid||!f.played||f.st)return;const h=t[f.h],a=t[f.a];if(!h||!a)return;
    h.pj++;a.pj++;h.gf+=f.hg;h.gc+=f.ag;a.gf+=f.ag;a.gc+=f.hg;
    if(f.hg>f.ag){h.g++;a.p++;h.pts+=3;h.form.push('W');a.form.push('L');}else if(f.hg<f.ag){a.g++;h.p++;a.pts+=3;a.form.push('W');h.form.push('L');}else{h.e++;a.e++;h.pts++;a.pts++;h.form.push('D');a.form.push('D');}});
  return Object.values(t).sort((x,y)=>y.pts-x.pts||(y.gf-y.gc)-(x.gf-x.gc)||y.gf-x.gf||S.clubs[x.id].name.localeCompare(S.clubs[y.id].name));
}
function myPosition(){return table(userDiv().id).findIndex(r=>r.id===S.user.clubId)+1;}
function posLabel(){const r=table(userDiv().id).find(x=>x.id===S.user.clubId);return r&&r.pj?myPosition()+'º':'—';}
function leagueRound(){const d=userDiv().id;return S.fx.filter(f=>f.c===d&&isUserFx(f)&&f.played).length;}

/* ventanas de traspasos por país (como V24) */
function windowInfo(date){const c=me().country;const y=S.year;
  const ss=c==='Inglaterra'?`${y}-06-15`:`${y}-07-01`,se=`${y}-09-01`;
  const ws=c==='España'||c==='Italia'?`${y+1}-01-02`:`${y+1}-01-01`,we=c==='España'||c==='Italia'?`${y+1}-02-02`:`${y+1}-02-01`;
  const d=date||S.date;
  if(d>=ss&&d<=se)return {open:true,period:'verano',end:se};
  if(d>=ws&&d<=we)return {open:true,period:'invierno',end:we};
  return {open:false,next:d<ws?ws:`${y+1}-07-01`};}
function windowOpen(){return windowInfo().open;}
function windowLabel(){const w=windowInfo();return w.open?`Mercado de ${w.period} abierto hasta el ${fmtDate(w.end)}`:`Mercado cerrado · abre el ${fmtDate(w.next)}`;}

/* ================= alineaciones ================= */
function available(p){return p.injury===0&&p.susp===0;}
function bestXI(cid,formation,ignoreFit){
  const slots=FORMATIONS[formation]||FORMATIONS['4-3-3'];const pool=squad(cid).filter(available);const used=new Set();const xi=new Array(11).fill(null);
  const order=slots.map((s,i)=>i).sort((a,b)=>(slots[a][0]==='POR'?-1:0)-(slots[b][0]==='POR'?-1:0));
  const score=(p,pos)=>p.ovr-posPen(p,pos)-(ignoreFit?0:Math.max(0,75-p.fitness)*0.4);
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
  probs.forEach(i=>{const pos=FORMATIONS[c.formation][i][0];let best=null,bs=-1e9;pool.forEach(p=>{if(used.has(p.id))return;const sc=p.ovr-posPen(p,pos)-Math.max(0,75-p.fitness)*.4;if(sc>bs){bs=sc;best=p;}});xi[i]=best?best.id:null;if(best)used.add(best.id);});}
function clubLevel(cid){const c=S.clubs[cid];if(c.partial)return c.lvl0;const xi=bestXI(cid,c.formation,true);return xi.reduce((s,id,i)=>s+(id?P(id).ovr-posPen(P(id),FORMATIONS[c.formation][i][0]):50),0)/11;}

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
  return {fx,live,min:0,half:1,st1:ri(1,3),st2:ri(2,6),ended:false,paused:false,ev:[],home:makeSide(fx.h,fx.h===uid),away:makeSide(fx.a,fx.a===uid),neutral:fx.st==='f'};}
function lambdas(m){const h=m.home,a=m.away;const d=sideStrength(h)+(m.neutral?0:1.6)-sideStrength(a);
  const lh=1.14*Math.exp(0.058*d)*MENT_OWN[h.ment]*MENT_OPP[a.ment],la=(m.neutral?1.14:1.04)*Math.exp(-0.058*d)*MENT_OWN[a.ment]*MENT_OPP[h.ment];
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
  if(m.half===1&&min>=45+m.st1){m.half=2;m.min=45;push(m,45,'info','Descanso. '+scoreStr(m),'');if(m.live)m.paused=true;}
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

let RATING_BASE=6.3,AI_DEV=0.7;
const aiScale=p=>AI_DEV*clamp((90-p.ovr)/12,0.15,1); // las estrellas de la IA crecen menos // AI_DEV frena el progreso de los equipos de la IA para que las ligas no se inflen
function finalizeMatch(m){
  const fx=m.fx;fx.hg=m.home.goals;fx.ag=m.away.goals;fx.played=true;
  const ratings={};const userGame=m.home.isUser||m.away.isUser;const progs={},levels=[];
  [[m.home,m.away],[m.away,m.home]].forEach(([s,o])=>{
    squad(s.cid).forEach(p=>{if(p.susp>0)p.susp--;}); // los sancionados cumplen este partido
    onPitch(s).forEach(id=>{s.mins[id]=(s.mins[id]||0)+(90-s.on[id]);});
    s.red.forEach(id=>{if(s.on[id]!=null){const ev=fx.ev.find(e=>e.t==='r'&&e.pid===id);s.mins[id]=(s.mins[id]||0)+((ev?ev.min:90)-s.on[id]);}});
    const res=s.goals>o.goals?1:s.goals<o.goals?-1:0;
    Object.keys(s.mins).forEach(k=>{const id=+k;const p=P(id);if(!p)return;const mins=s.mins[id];if(mins<=0)return;
      const c=s.contrib[id]||{g:0,a:0};const g=GROUP[p.pos];
      let r=RATING_BASE+gauss()*0.35+c.g*1.0+c.a*0.6+res*0.35+(p.ovr-72)*0.02;
      if(g==='DEF'||g==='POR')r+=o.goals===0?0.6:-0.18*o.goals;
      if(g==='POR')r+=s.saves*0.12;
      if(s.yellows[id])r-=0.2;if(s.red.has(id)&&!(s.injured||[]).includes(id))r-=1.5;
      if(mins<25)r=6.2+(r-6.2)*0.5;r=clamp(Math.round(r*10)/10,3,10);ratings[id]=r;
      p.stats.apps++;p.stats.goals+=c.g;p.stats.assists+=c.a;p.stats.rsum+=r;
      if((g==='DEF'||g==='POR')&&o.goals===0&&mins>=60)p.stats.cs++;
      const dev=matchDevelopment(p,{minutes:mins,rating:r,goals:c.g,assists:c.a,teamResult:res});
      if(dev){const ob=p.ovr;applyProgress(p,s.isUser?dev:dev*aiScale(p));if(s.isUser){progs[id]=Math.round(dev*10)/10;if(p.ovr!==ob)levels.push([p.name,ob,p.ovr]);}}
      p.pdir=dev<-0.15?'down':dev>0.15?'up':(p.pdir||'up');
      p.form=clamp((p.form||0)*0.9+clamp((r-6.8)*1.2,-2,2),-10,10);
      p.fitness=clamp(Math.round(s.fit[id]??p.fitness),15,100);
      p.morale=clamp(p.morale+(r>=7.5?4:r<6?-3:1),15,100);});
    Object.entries(s.yellows).forEach(([id,n])=>{const p=P(+id);if(!p)return;p.stats.yel++;p.yellows++;if(n<2&&p.yellows%5===0)p.susp=Math.max(p.susp,1);});
    s.red.forEach(id=>{const p=P(id);if(!p||(s.injured||[]).includes(id))return;p.stats.red++;p.susp=Math.max(p.susp,(s.straight||[]).includes(id)?2:1);});
    (s.injured||[]).forEach(id=>{const p=P(id);if(p)p.injury=ri(5,42);});
    squad(s.cid).forEach(p=>{p.morale=clamp(p.morale+res*2,15,100);});
  });
  if(userGame){fx.ratings=ratings;fx.prog=progs;
    if(levels.length)addNews('Evolución de la plantilla',levels.map(([n,a,b])=>`${esc(n)}: ${a} → <b style="color:${b>a?'var(--good)':'var(--bad)'}">${b}</b>`).join('<br>'),'dev');}
  if(fx.st)resolveTie(fx);
  return ratings;
}
function quickSim(fx){const m=createMatch(fx,false);simToEnd(m);finalizeMatch(m);return m;}
function fastSim(fx){
  const m=createMatch(fx,false);const [lh,la]=lambdas(m);
  [[m.home,poisson(lh),'h'],[m.away,poisson(la),'a']].forEach(([s,g,side])=>{
    for(let i=0;i<g;i++){const sh=shooter(s);if(!sh)break;const as=R()<0.72?assister(s,sh):null;s.goals++;s.contrib[sh].g++;if(as)s.contrib[as].a++;fx.ev.push({t:'g',side,pid:sh,as,min:ri(1,90)});}
    s.shots=g*3+ri(3,9);s.sot=g+ri(1,4);s.saves=ri(1,5);
    onPitch(s).forEach(id=>{s.fit[id]=Math.max(30,s.fit[id]-18-R()*8);});
    const ny=poisson(1.8);for(let i=0;i<ny;i++){const pl=pick(onPitch(s));if(pl)s.yellows[pl]=1;}
    if(R()<0.11){const pl=pick(onPitch(s));if(pl)s.injured=[pl];}
    m.half=2;for(let i=0;i<3&&s.bench.length;i++){m.min=ri(58,80);const out=pick(onPitch(s).filter(id=>slotOf(s,id)!=='POR'&&!(s.injured||[]).includes(id)));if(out)doSub(m,s,out,s.bench[0]);}
  });
  fx.ev.sort((a,b)=>a.min-b.min);finalizeMatch(m);
}

/* ================= eliminatorias europeas ================= */
function resolveTie(f){
  const legs=S.fx.filter(x=>x.c===f.c&&x.tie===f.tie);if(legs.some(x=>!x.played))return;
  const last=legs[legs.length-1];const a=last.h,b=last.a; // en la vuelta juega en casa el mejor clasificado
  let ga=0,gb=0;legs.forEach(x=>{if(x.h===a){ga+=x.hg;gb+=x.ag;}else{ga+=x.ag;gb+=x.hg;}});
  let w;if(ga!==gb)w=ga>gb?a:b;else{const la=clubLevel(a),lb=clubLevel(b);w=R()<0.5+(la-lb)*0.01?a:b;last.pen=w===last.h?'h':'a';}
  last.winner=w;
}
function euroProgress(){
  EURO_CODES.forEach(code=>{const comp=S.comps[code];if(!comp||comp.stage==='done')return;
    const cur=S.fx.filter(f=>f.c===code&&(comp.stage==='league'?!f.st:f.st===comp.stage));if(!cur.length||cur.some(f=>!f.played))return;
    const ko=comp.ko;
    const winners=st=>S.fx.filter(f=>f.c===code&&f.st===st&&f.winner!=null).sort((x,y)=>x.tie<y.tie?-1:1).map(f=>f.winner);
    const losers=st=>S.fx.filter(f=>f.c===code&&f.st===st&&f.winner!=null).map(f=>f.winner===f.h?f.a:f.h);
    const mkTie=(st,id,hi,lo,dates)=>{if(dates.length===1)addFx({c:code,d:shiftDate(dates[0]),st,tie:id,h:hi,a:lo,r:STAGE_NAME[st]});
      else{addFx({c:code,d:shiftDate(dates[0]),st,tie:id,h:lo,a:hi,r:STAGE_NAME[st]+' (ida)'});addFx({c:code,d:shiftDate(dates[1]),st,tie:id,h:hi,a:lo,r:STAGE_NAME[st]+' (vuelta)'});}};
    if(comp.stage==='league'){const tb=table(code).map(r=>r.id);comp.seeds=tb.slice(0,8);
      tb.slice(24).forEach(id=>comp.out[id]='Fase liga');
      for(let i=0;i<8;i++)mkTie('po','po'+i,tb[8+i],tb[23-i],ko.po);comp.stage='po';}
    else if(comp.stage==='po'){losers('po').forEach(id=>comp.out[id]='Play-off');const w=shuffle(winners('po'));comp.seeds.forEach((s,i)=>mkTie('r16','r16-'+i,s,w[i],ko.r16));comp.stage='r16';}
    else if(comp.stage==='r16'){losers('r16').forEach(id=>comp.out[id]='Octavos');const w=winners('r16');for(let i=0;i<4;i++)mkTie('qf','qf'+i,w[2*i],w[2*i+1],ko.qf);comp.stage='qf';}
    else if(comp.stage==='qf'){losers('qf').forEach(id=>comp.out[id]='Cuartos');const w=winners('qf');for(let i=0;i<2;i++)mkTie('sf','sf'+i,w[2*i],w[2*i+1],ko.sf);comp.stage='sf';}
    else if(comp.stage==='sf'){losers('sf').forEach(id=>comp.out[id]='Semifinales');const w=winners('sf');mkTie('f','f',w[0],w[1],ko.f);comp.stage='f';}
    else if(comp.stage==='f'){const f=S.fx.find(x=>x.c===code&&x.st==='f');comp.champion=f.winner;comp.out[f.winner]='Campeón';comp.out[f.winner===f.h?f.a:f.h]='Final';comp.stage='done';
      addNews(`${esc(S.clubs[f.winner].name)} gana la ${EURO_NAME[code]}`,`Final: ${esc(S.clubs[f.h].name)} ${f.hg}-${f.ag} ${esc(S.clubs[f.a].name)}${f.pen?' (penaltis)':''}.`,'rumor');
      if(f.winner===S.user.clubId)S.user.trophies.push(EURO_NAME[code]+' '+seasonLabel());}
    S.fx.sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:0);rebuildIndex();
    const uid=S.user.clubId;if(comp.clubs.includes(uid)&&comp.stage!=='done'){const nf=S.fx.find(f=>f.c===code&&f.st===comp.stage&&isUserFx(f));
      if(nf)addNews(`${EURO_NAME[code]}: ${STAGE_NAME[comp.stage]}`,`Tu rival será <b>${esc(S.clubs[nf.h===uid?nf.a:nf.h].name)}</b>. Primer partido: ${fmtDate(nf.d,true)}.`,'info');
      else if(comp.out[uid]&&!comp.notified){comp.notified=true;addNews(`Eliminados de la ${EURO_NAME[code]}`,`El equipo cae en: ${comp.out[uid].toLowerCase()}.`,'info');}}
  });
}

/* ================= avance de días ================= */
function processDay(){
  invalidate();
  const ud=userDiv().id;
  fxOn(S.date).forEach(f=>{if(f.played||isUserFx(f))return;if(f.c===ud)quickSim(f);else fastSim(f);});
  euroProgress();
  dailyUpdate();
  S.date=addDays(S.date,1);S.trainSel=[];
  if(S.fx.every(f=>f.played)&&EURO_CODES.every(c=>S.comps[c].stage==='done'))S.seasonDone=true;
}
function dailyUpdate(){
  const dow=DT(S.date).getUTCDay();const uid=S.user.clubId;
  const myXI=dow===1?(me().lineup||[]):null;const myLvl=dow===1?clubLevel(uid):0;
  for(const k in S.players){const p=S.players[k];const isMine=p.clubId===uid;
    if(p.injury>0)p.injury--;
    if(p.fitness<100)p.fitness=clamp(p.fitness+5,15,100);
    if(p.youth&&isMine)develop(p);
    if(myXI&&isMine&&!p.youth&&!myXI.includes(p.id)&&p.ovr>=myLvl-1)p.morale=clamp(p.morale-2,15,100);
  }
  aiTraining();
  if(windowOpen()&&dow%3===0){aiOffers();aiTransfers(3);}
  expireOffers();scoutTick();
  const md=S.date.slice(5);if(md==='01-02'||md==='04-01')contractAlerts(false);
}
/* Desarrollo de la media: port de engine/training.js de Carrera Entrenador V24.
   La media solo cambia cuando la barra (p.training) llega a 100 (+1) o baja de 0 (-1). */
function developmentSpeed(p,ctx){
  const base=p.ovr,potential=p.pot||base,age=p.age||25,minutes=ctx.minutes??0,rating=ctx.rating??6.5,form=p.form||0,fitness=p.fitness??100;
  const ageFactor=age<=18?1.55:age<=20?1.38:age<=22?1.22:age<=24?1.10:age<=27?1.0:age<=29?0.88:age<=31?0.74:age<=33?0.58:0.42;
  const potentialFactor=clamp(0.82+(potential/100)*0.88,0.82,1.70);
  const minutesFactor=minutes<=0?0.12:clamp(0.35+minutes/90*0.85,0.35,1.20);
  const performanceFactor=clamp(1+(rating-6.5)*0.30,0.34,1.92);
  const formFactor=clamp(1+form*0.030,0.74,1.30);
  const fitnessFactor=clamp(0.78+fitness*0.0022,0.78,1.00);
  const eliteFactor=base>=94?0.86:base>=90?0.93:base>=85?0.97:1;
  return ageFactor*potentialFactor*minutesFactor*performanceFactor*formFactor*fitnessFactor*eliteFactor;}
function matchDevelopment(p,ctx){
  const minutes=ctx.minutes||0,rating=ctx.rating||6.5;if(minutes<8)return 0;
  const speed=developmentSpeed(p,ctx);const goals=ctx.goals||0,assists=ctx.assists||0,teamResult=ctx.teamResult||0;
  const performance=(rating-6.5)*10.5*speed,participation=(minutes/90)*1.55*speed,statsImpact=(goals*1.55+assists*0.95+teamResult*0.45)*speed;
  return clamp(performance+participation+statsImpact,-15.0,18.0);}
function trainingGain(p){
  const base=p.ovr,potential=p.pot||base,age=p.age||25,form=p.form||0,fitness=p.fitness??100;
  const ageFactor=age<=18?1.55:age<=20?1.42:age<=22?1.28:age<=24?1.15:age<=27?1.0:age<=29?0.88:age<=31?0.76:age<=33?0.62:0.50;
  const potentialFactor=clamp(0.78+(potential/100)*0.82,0.78,1.60);
  const formFactor=clamp(1+form*0.018,0.85,1.18);
  const fitnessFactor=clamp(0.72+fitness*0.0028,0.72,1.0);
  const eliteFactor=base>=94?0.90:base>=90?0.95:1;
  const variance=0.90+R()*0.20;
  return clamp(4.35*ageFactor*potentialFactor*formFactor*fitnessFactor*eliteFactor*variance,1.5,10.5);}
/* sube o baja la barra; al pasar 100 sube la media, por debajo de 0 baja */
function applyProgress(p,delta){
  p.training=(p.training||0)+delta;
  while(p.training>=100&&p.ovr<99){p.training-=100;p.ovr++;if(p.pot<p.ovr)p.pot=p.ovr;}
  while(p.training<0&&p.ovr>45){p.training+=100;p.ovr--;}
  p.training=clamp(p.training,0,99.99);}
/* canteranos: progresan solos cada día (sin partidos) */
function develop(p){
  const a=p.age;const af=a<=18?1.1:a<=20?1:a<=22?0.8:a<=24?0.6:a<=26?0.4:0.2;
  if(p.ovr<p.pot){p.training+=(p.pot-p.ovr)*af*0.8/7*(0.6+R()*0.8)*0.9;
    while(p.training>=100&&p.ovr<p.pot){p.training-=100;p.ovr++;}}
}
/* sesión de entrenamiento del usuario: cada 3 días, hasta 3 jugadores */
function trainingAvail(){const sel=S.trainSel||[];return sel.length>0||!S.trainNext||S.date>=S.trainNext;}
function trainPlayer(id){
  const p=P(id);if(!p||p.clubId!==S.user.clubId)return null;
  if(!trainingAvail()){toast('No puedes entrenar todavía. Próxima sesión: '+fmtDate(S.trainNext,true)+'.');return null;}
  if(S.trainSel.length>=3||S.trainSel.includes(id)||p.ovr>=99)return null;
  const gain=trainingGain(p);const ob=p.ovr;applyProgress(p,gain);p.pdir='up';
  S.trainSel.push(id);S.trainNext=addDays(S.date,3);save();
  return {gain,up:p.ovr>ob};}
/* los equipos de la IA también entrenan cada 3 días a tres jugadores */
function aiTraining(){
  if(dayDiff(DB.start,S.date)%3!==0)return;
  S.clubs.forEach(c=>{if(c.id===S.user.clubId||c.partial)return;const sq=squad(c.id);if(!sq.length)return;
    for(let i=0;i<3;i++){const p=pick(sq);if(p.ovr<99)applyProgress(p,trainingGain(p)*aiScale(p));}});}
function contractAlerts(first){const exp=squad(S.user.clubId).filter(p=>p.contract<=1);if(!exp.length)return;
  addNews(first?'Contratos en su último año':'Contratos a punto de expirar',`Estos jugadores terminan contrato el 30/06/${S.year+1} y se irán gratis si no los renuevas:<br>${exp.map(p=>`${esc(p.name)} (${p.pos}, ${p.ovr})`).join('<br>')}`,'info');}
function afterUserMatch(f,my,op){
  if(f.c===userDiv().id){const d=my-op;const pos=myPosition();
    let delta=d>0?2:d<0?-1.5:0.3;if(pos<=S.board.target)delta+=0.5;else if(pos>S.board.target+3)delta-=0.5;
    S.board.conf=clamp(S.board.conf+delta,0,100);}
  else S.board.conf=clamp(S.board.conf+(my>op?1:my<op?-0.5:0),0,100);
  if(!userFixtureToday())processDay();
  if(S.board.conf<=4&&leagueRound()>=15&&!S.seasonDone)fired('La directiva ha perdido la confianza en tu proyecto tras una racha de malos resultados.');
  save();
}
function advanceUntilMatch(maxDays){let n=0;while(!S.seasonDone&&!S.over&&!userFixtureToday()&&n++<(maxDays||400))processDay();save();}

/* ================= mercado ================= */
function isStarter(p){if(p.clubId==null)return false;const c=S.clubs[p.clubId];if(c.partial)return p.ovr>=c.lvl0;return bestXI(c.id,c.formation,true).includes(p.id);}
function negKey(p){return S.year+'-'+(S.date.slice(5)<'07-01'?'i':'v')+'-'+p.id;}
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
  assignNumbers(c.id);if(from&&!from.partial)assignNumbers(from.id);
  addNews('Fichaje cerrado: '+esc(p.name),`${esc(p.name)} (${p.pos}, ${p.ovr}) se une a ${esc(c.name)}${from?' procedente de '+esc(from.name):' como agente libre'}. Traspaso: <b>${money(fee)}</b>. Salario: ${money(wage)}/sem hasta el 30/06/${S.year+years}.`,'info');
  save();}
function sellPlayer(p,toCid,fee){const c=me();const to=S.clubs[toCid];c.budget+=fee;to.budget-=fee;p.clubId=toCid;p.listed=false;p.wage=Math.max(p.wage,wageFor(p,to.rep));p.contract=ri(2,5);p.num=0;invalidate();
  if(c.lineup)c.lineup=c.lineup.map(id=>id===p.id?null:id);
  if(!to.partial)assignNumbers(toCid);addNews('Venta cerrada: '+esc(p.name),`${esc(p.name)} deja ${esc(c.name)} rumbo a ${esc(to.name)} por <b>${money(fee)}</b>.`,'info');}
function buyerClubFor(p){const v=valueOf(p);const cands=S.clubs.filter(c=>c.id!==S.user.clubId&&!c.gen&&c.budget>v*0.8&&Math.abs(c.lvl0-p.ovr)<8);if(!cands.length)return null;
  return wpick(cands,c=>Math.max(0.1,6-Math.abs(c.lvl0-p.ovr+2)/2)*(c.ext?0.5:1));}
function aiOffers(){
  const lvl=clubLevel(S.user.clubId);
  squad(S.user.clubId).forEach(p=>{
    if(S.news.some(n=>n.type==='offer'&&!n.done&&n.data.pid===p.id))return;
    const chance=p.listed?0.22:(p.ovr>=lvl+2?0.015:0.003);
    if(R()<chance){const b=buyerClubFor(p);if(!b)return;const fee=roundMoney(valueOf(p)*(p.listed?0.75+R()*0.3:1.05+R()*0.35));
      addNews(`Oferta de ${esc(b.name)} por ${esc(p.name)}`,`${esc(b.name)} ofrece <b>${money(fee)}</b> por ${esc(p.name)} (${p.pos}, ${p.ovr}). Valor de mercado: ${money(valueOf(p))}. La oferta caduca el ${fmtDate(addDays(S.date,7))}.`,'offer',{pid:p.id,cid:b.id,fee,exp:addDays(S.date,7)});}
  });
}
function expireOffers(){S.news.forEach(n=>{if(n.type==='offer'&&!n.done&&n.data.exp&&n.data.exp<S.date)n.done='Caducada';});}
function aiTransfers(k){
  const all=Object.values(S.players);const ud=me().div;
  for(let t=0;t<k;t++){const buyer=pick(S.clubs.filter(c=>!c.ext&&c.id!==S.user.clubId));
    const cands=all.filter(p=>p.clubId!==S.user.clubId&&p.clubId!==buyer.id&&!p.youth&&p.ovr>=buyer.lvl0-1&&p.ovr<=buyer.lvl0+4&&valueOf(p)*1.15<buyer.budget&&(p.clubId==null||(S.clubs[p.clubId].rep<=buyer.rep+0.3&&!S.clubs[p.clubId].gen)));
    if(!cands.length)continue;const p=pick(cands);const from=p.clubId!=null?S.clubs[p.clubId]:null;const fee=from?roundMoney(valueOf(p)*1.15):0;
    buyer.budget-=fee;if(from)from.budget+=fee;p.clubId=buyer.id;p.wage=Math.max(p.wage,wageFor(p,buyer.rep));p.contract=ri(2,5);p.num=0;invalidate();assignNumbers(buyer.id);
    if(p.ovr>=76&&(buyer.div===ud||(from&&from.div===ud)||p.ovr>=82))addNews(`${esc(p.name)} ficha por ${esc(buyer.name)}`,`${esc(buyer.name)} incorpora a ${esc(p.name)} (${p.ovr})${from?' desde '+esc(from.name)+' por '+money(fee):' como agente libre'}.`,'rumor');
    maintainSquad(buyer.id);if(from&&!from.ext)maintainSquad(from.id);}
}
function maintainSquad(cid,quiet){if(cid===S.user.clubId&&!quiet)return;const c=S.clubs[cid];if(c.partial)return;const sq=squad(cid);
  const need={POR:2,DEF:7,MED:7,DEL:4};const cnt={POR:0,DEF:0,MED:0,DEL:0};sq.forEach(p=>cnt[GROUP[p.pos]]++);
  Object.keys(need).forEach(g=>{while(cnt[g]<need[g]){const pos=pick(POS.filter(x=>GROUP[x]===g));makePlayer({pos,ovr:c.lvl0-4+ri(-3,2),age:ri(19,28),clubId:cid,nat:c.gen?c.gen[1]:undefined});cnt[g]++;}});
  if(cid!==S.user.clubId){const sq2=squad(cid).sort((a,b)=>a.ovr-b.ovr);while(sq2.length>32){const p=sq2.shift();p.clubId=null;p.contract=0;}invalidate();}
  assignNumbers(cid);}

/* ================= cantera ================= */
const SCOUT_LV=[{n:'Básico',cost:150000,pot:[60,78]},{n:'Profesional',cost:400000,pot:[66,85]},{n:'Élite',cost:900000,pot:[72,92]}];
const REGIONS={LOC:'Tu país',SA:'Sudamérica',EU:'Europa',AF:'África'};
function scoutTick(){if(!S.scout)return;S.scout.days--;if(S.scout.days>0)return;const lv=SCOUT_LV[S.scout.lv];const n=ri(2,4);const names=[];
  for(let i=0;i<n;i++){const age=ri(15,17);const pot=ri(lv.pot[0],lv.pot[1]);const ovr=clamp(pot-ri(18,30)+(age-15)*2,42,64);
    const p=makePlayer({pos:pick(POS),ovr,age,pot,clubId:S.user.clubId,youth:true,region:S.scout.region,contract:3});names.push(`${esc(p.name)} ${flag(p.nat)} (${p.pos}, ${p.ovr})`);}
  addNews('Informe de ojeo: '+REGIONS[S.scout.region],`Tu ojeador ha encontrado ${n} jóvenes talentos que ya están en tu cantera:<br>${names.join('<br>')}`,'info');S.scout=null;}

/* ================= fin de temporada ================= */
function topScorer(clubIds){const set=new Set(clubIds);let best=null;for(const k in S.players){const p=S.players[k];if(p.clubId!=null&&set.has(p.clubId)&&(!best||p.stats.goals>best.stats.goals))best=p;}return best;}
function euroQualifiers(){
  // mismas plazas por país que en 2026/27; el resto de participantes se mantiene
  const res={ucl:[],uel:[],uecl:[]};
  const countOf=(code,country)=>DB.euro[code].clubs.filter(ci=>{const c=DB.clubs[ci];return c.d>=0&&DB.divs[c.d].c===country&&DB.divs[c.d].t===1;}).length;
  S.divs.filter(d=>d.tier===1).forEach(d=>{const tb=table(d.id).map(r=>r.id);let k=0;EURO_CODES.forEach(code=>{const n=countOf(code,d.country);res[code].push(...tb.slice(k,k+n));k+=n;});});
  EURO_CODES.forEach(code=>{DB.euro[code].clubs.forEach(ci=>{const c=DB.clubs[ci];if(!(c.d>=0&&DB.divs[c.d].t===1))res[code].push(ci);});res[code]=[...new Set(res[code])].slice(0,36);});
  return res;}
function endSeason(){
  invalidate();
  const c=me();const d=userDiv();const tb=table(d.id);const pos=myPosition();
  const top=topScorer(d.clubs);const met=pos<=S.board.target;
  S.board.conf=clamp(S.board.conf+(met?15+(S.board.target-pos)*3:-(pos-S.board.target)*5),0,100);
  if(pos===1)S.user.trophies.push(d.name+' '+seasonLabel());
  const ue=EURO_CODES.find(code=>S.comps[code].clubs.includes(c.id));
  const euroRes=ue?`${EURO_NAME[ue]}: ${S.comps[ue].out[c.id]||'—'}`:null;
  S.user.history.push({season:seasonLabel(),club:c.name,div:d.name,pos,pts:tb[pos-1].pts,objective:S.board.objective,met,euro:euroRes});
  const champions=S.divs.filter(x=>x.tier===1).map(x=>({div:x.name,club:S.clubs[table(x.id)[0].id].name})).concat(EURO_CODES.map(code=>({div:EURO_NAME[code],club:S.comps[code].champion!=null?S.clubs[S.comps[code].champion].name:'—'})));
  const summary={pos,div:d.name,champion:S.clubs[tb[0].id].name,top:top?`${top.name} (${S.clubs[top.clubId].short}) · ${top.stats.goals} goles`:'—',met,objective:S.board.objective,champions,moves:[],euro:euroRes};
  S.euroNext=euroQualifiers();
  const before=c.div;
  S.divs.forEach((d1,i1)=>{if(d1.tier!==1)return;const i2=S.divs.findIndex(x=>x.country===d1.country&&x.tier===2);if(i2<0)return;const d2=S.divs[i2];
    const down=table(d1.id).slice(-d1.sw).map(r=>r.id),up=table(d2.id).slice(0,d1.sw).map(r=>r.id);
    d1.clubs=d1.clubs.filter(id=>!down.includes(id)).concat(up);d2.clubs=d2.clubs.filter(id=>!up.includes(id)).concat(down);
    down.forEach(id=>{const cl=S.clubs[id];cl.div=i2;cl.budget0=roundMoney(cl.budget0*0.55);});
    up.forEach(id=>{const cl=S.clubs[id];cl.div=i1;cl.budget0=roundMoney(Math.max(cl.budget0*1.8,15e6));cl.wageBudget=Math.round(cl.wageBudget*1.3);});
    if(d1.country===d.country)summary.moves.push({up:up.map(id=>S.clubs[id].name),down:down.map(id=>S.clubs[id].name),d1:d1.name,d2:d2.name});});
  if(c.div!==before){if(S.divs[c.div].tier===2){S.board.conf=clamp(S.board.conf-20,0,100);summary.relegatedUser=true;}else{S.board.conf=clamp(S.board.conf+15,0,100);summary.promotedUser=true;}}
  S.divs.forEach(dv=>table(dv.id).forEach((r,i)=>{const cl=S.clubs[r.id];cl.rep=clamp(cl.rep+(dv.tier===1&&i<4?0.1:i>dv.clubs.length-4?-0.1:0),1,5);}));
  const left=[];
  for(const k in S.players){const p=S.players[k];
    if(p.stats.apps)p.hist.push({s:seasonLabel(),c:p.clubId!=null?S.clubs[p.clubId].short:'—',...p.stats});
    p.stats=newStats();p.yellows=0;p.susp=0;p.age++;
    if(p.age>=29){p.ovr=Math.max(45,p.ovr-ri(0,Math.min(4,p.age-28)));p.pot=Math.min(p.pot,p.ovr+1);}
    if(p.age<=23&&p.clubId!==S.user.clubId&&p.ovr<p.pot)p.ovr+=ri(0,Math.min(3,Math.ceil((p.pot-p.ovr)/4))); // la IA: crecimiento natural de los jóvenes
    if(p.age>=27)p.pot=Math.min(p.pot,Math.max(p.ovr,p.pot-ri(0,1)));
    if(p.youth&&p.age>=19){p.youth=false;p.contract=Math.max(p.contract,2);p.wage=Math.max(2000,wageFor(p,c.rep));}
    if(p.age>=34&&R()<0.3+(p.age-34)*0.2){if(p.clubId===S.user.clubId)left.push(p.name+' se retira');delete S.players[p.id];continue;}
    if(p.clubId!=null&&!p.youth){p.contract--;
      if(p.contract<=0){if(p.clubId===S.user.clubId){left.push(p.name+' (fin de contrato)');p.clubId=null;p.contract=0;}
        else if(R()<0.75||S.clubs[p.clubId].partial||S.clubs[p.clubId].gen)p.contract=ri(1,4);else{p.clubId=null;p.contract=0;}}}
    p.fitness=100;p.injury=0;p.morale=clamp(p.morale,55,85);if(p.clubId!==S.user.clubId)p.listed=false;
  }
  invalidate();summary.left=left;
  S.clubs.forEach(cl=>{if(cl.partial)return;
    for(let i=0;i<2;i++)makePlayer({pos:pick(POS),ovr:cl.lvl0-14+ri(-3,3),age:17,clubId:cl.id,youth:cl.id===S.user.clubId,contract:3,nat:cl.gen?cl.gen[1]:undefined});
    if(cl.id===S.user.clubId)return;
    maintainSquad(cl.id);cl.budget=roundMoney(Math.max(cl.budget,0)*0.3+cl.budget0*(0.85+R()*0.3));cl.lvl0=clubLevel(cl.id);
    cl.wageBudget=Math.round(Math.max(cl.wageBudget,wageBill(cl.id)*1.05)/1000)*1000;});
  for(let i=0;i<12;i++)makePlayer({pos:pick(POS),ovr:ri(60,74),age:ri(22,33),clubId:null,contract:0});
  const n=d.clubs.length;const prize=(n+1-pos)*(d.tier===1?1.5e6:0.3e6)+(ue?{ucl:15e6,uel:6e6,uecl:3e6}[ue]:0);
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
function beginNextSeason(){S.year++;S.date=`${S.year}-07-01`;S.lastSummary=null;fillFromReserves();me().lineup=null;
  const en=S.euroNext||{ucl:DB.euro.ucl.clubs,uel:DB.euro.uel.clubs,uecl:DB.euro.uecl.clubs};
  buildSeason({ucl:en.ucl,uel:en.uel,uecl:en.uecl});S.board.conf=clamp(S.board.conf,35,80);
  addNews('Nueva temporada '+seasonLabel(),`Arranca la pretemporada. Competición: <b>${esc(userDiv().name)}</b>${userEuro()?` y <b>${EURO_NAME[userEuro()]}</b>`:''}. Objetivo: <b>${S.board.objective}</b>. Presupuesto de fichajes: <b>${money(me().budget)}</b>.`,'info');
  contractAlerts(true);save();}
function fired(reason){S.over=true;S.firedReason=reason;save();}
function jobOffers(){const lvl=me().lvl0;const c=S.clubs.filter(x=>!x.ext&&x.id!==S.user.clubId&&x.lvl0<=lvl+1);return shuffle(c.sort((a,b)=>b.lvl0-a.lvl0).slice(0,15)).slice(0,3);}
function takeJob(cid){S.over=false;S.user.clubId=cid;const c=me();c.lineup=null;c.ment=2;S.board.conf=55;
  if(S.seasonDone)beginNextSeason();else{setObjective();fillFromReserves();}
  addNews('Nuevo reto: '+esc(c.name),`Has sido presentado como nuevo entrenador de ${esc(c.name)} (${esc(userDiv().name)}). Presupuesto: <b>${money(c.budget)}</b>.`,'info');save();}

/* ================= noticias y guardado ================= */
function addNews(title,body,type,data){S.news.unshift({id:S.msgId++,title,body,type,data:data||{},read:type==='rumor'||type==='dev',date:S.date,done:null});if(S.news.length>150)S.news.length=150;}
function unread(){return S?S.news.filter(n=>!n.read).length:0;}
const META_KEY=SAVE_KEY+'_meta';
function toB64(buf){const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s);}
async function gz(txt){const st=new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'));return toB64(await new Response(st).arrayBuffer());}
async function gunz(b64){const bin=atob(b64);const b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);
  return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();}
async function packSave(){const txt=JSON.stringify(S,(k,v)=>k==='i'&&typeof v==='number'?undefined:v);return window.CompressionStream?'gz:'+await gz(txt):txt;}
async function parseSave(t){if(!t)return null;t=t.trim();if(t.startsWith('gz:'))t=await gunz(t.slice(3));return JSON.parse(t);}
let saveSeq=0,saveWarned=false,saveTimer=null;
function save(){if(!S)return;clearTimeout(saveTimer);saveTimer=setTimeout(doSave,350);} // junta guardados seguidos
function doSave(){if(!S)return;const seq=++saveSeq;const meta=JSON.stringify({name:S.user.name,club:S.clubs[S.user.clubId].name,season:seasonLabel(),date:S.date});
  packSave().then(z=>{if(seq!==saveSeq)return;localStorage.setItem(SAVE_KEY,z);localStorage.setItem(META_KEY,meta);})
    .catch(()=>{if(!saveWarned){saveWarned=true;toast('No se ha podido guardar la partida en este navegador. Usa «Exportar partida» en Club.');}});}
addEventListener('pagehide',()=>{if(saveTimer){clearTimeout(saveTimer);doSave();}});
async function load(){try{return await parseSave(localStorage.getItem(SAVE_KEY));}catch(e){return null;}}
function loadMeta(){try{return JSON.parse(localStorage.getItem(META_KEY));}catch(e){return null;}}
function boot(s){S=s;if(!S.trainSel)S.trainSel=[];for(const k in S.players){const p=S.players[k];if(p.training==null)p.training=p.prog||0;if(p.form==null)p.form=0;}invalidate();rebuildIndex();}

/* ================= imágenes: escudos, caras y cartas ================= */
const ASSET='assets/';
function isLight(hex){const n=parseInt(hex.slice(1),16);const r=n>>16,g=n>>8&255,b=n&255;return (r*299+g*587+b*114)/1000>150;}
function crest(c,size){size=size||28;
  if(c.k>=0){const col=c.k%DB.crestCols,row=Math.floor(c.k/DB.crestCols);
    return `<span class="crest-img" role="img" aria-label="${esc(c.name||c.short)}" style="width:${size}px;height:${size}px;background-size:${DB.crestCols*size}px auto;background-position:${-col*size}px ${-row*size}px"></span>`;}
  const l=isLight(c.c1);
  return `<span class="crest" style="width:${Math.round(size*0.86)}px;height:${size}px;font-size:${Math.max(7,Math.round(size*(c.short.length>3?0.26:0.32)))}px;background:linear-gradient(135deg,${c.c1} 0 50%,${c.c2} 50% 100%);color:${l?'#111':'#fff'};text-shadow:0 1px 2px ${l?'#fff':'#000'}">${esc(c.short)}</span>`;}
function face(p,size,flat){size=size||32;
  if(p.face>=0){const sheet=Math.floor(p.face/DB.faceSheet),cell=p.face%DB.faceSheet,col=cell%16,row=Math.floor(cell/16);
    const z=1;
    return `<span class="face${flat?' flat':''}${p.photo?' photo':''}" style="--s:${size}px;background-image:url(${ASSET}faces-${sheet}.webp);background-size:calc(var(--s)*${16*z}) calc(var(--s)*${16*z});background-position:calc(var(--s)*${-(col*z+(flat?0:(z-1)/2))}) calc(var(--s)*${-row*z})"></span>`;}
  return `<span class="face sil${flat?' flat':''}" style="--s:${size}px"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="15" r="7.5"/><path d="M6 40c0-9 6.3-14 14-14s14 5 14 14z"/></svg></span>`;}
function card(p,opts){opts=opts||{};const st=stats6(p);const lbl=p.pos==='POR'?STAT_LBL.POR:STAT_LBL.field;const tier=p.ovr>=75?'gold':p.ovr>=65?'silver':'bronze';
  const club=p.clubId!=null?S.clubs[p.clubId]:null;const short=p.name.includes('. ')?p.name.split('. ').slice(1).join(' '):p.name;
  return `<div class="fut ${tier}${p.pot-p.ovr>=8&&p.age<=21?' wonder':''}${opts.small?' sm':''}" ${opts.click?`data-player="${p.id}" role="button" tabindex="0" aria-label="${esc(p.name)}"`:''}>
   <div class="fut-ovr">${p.ovr}</div><div class="fut-pos">${p.pos}</div>
   <div class="fut-flag">${flag(p.nat)}</div><div class="fut-club">${club?crest(club,opts.small?18:24):''}</div>
   <div class="fut-face">${face(p,opts.small?80:112,true)}</div>
   <div class="fut-name">${esc(short)}</div>
   <div class="fut-stats">${st.map((v,i)=>`<span><b>${v}</b> ${lbl[i]}</span>`).join('')}</div>
   <div class="fut-bar" title="Progreso hacia la próxima media"><i style="width:${clamp(p.training||0,0,100)}%"></i></div>
   ${opts.badge?`<div class="fut-badge">${opts.badge}</div>`:''}
  </div>`;}

/* ================= interfaz ================= */
const root=document.getElementById('root');
const ICONS={
 home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 squad:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c3 .3 5.5 2.6 5.5 5.8"/>',
 tactics:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><circle cx="12" cy="12" r="3"/>',
 training:'<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 market:'<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
 youth:'<path d="M12 21V11"/><path d="M12 11c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z"/>',
 league:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z"/>',
 inbox:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 club:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'
};
const NAV=[['home','Inicio'],['squad','Plantilla'],['tactics','Táctica'],['training','Entrenamiento'],['calendar','Calendario'],['market','Mercado'],['youth','Cantera'],['league','Competiciones'],['inbox','Bandeja'],['club','Club']];
const icon=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
function posTag(pos){return `<span class="pos ${GROUP[pos]}">${pos}</span>`;}
function ovrTag(o){return `<span class="ovr ${ovrClass(o)}">${o}</span>`;}
function stars(r){r=Math.round(r*2)/2;return '★'.repeat(Math.floor(r))+(r%1?'½':'')+'<span style="opacity:.25">'+'★'.repeat(5-Math.ceil(r))+'</span>';}
function status(p){const t=[];if(p.injury)t.push(`<span class="pill bad">Lesión ${p.injury}d</span>`);if(p.susp)t.push(`<span class="pill warn">Sanción ${p.susp}</span>`);if(p.listed)t.push('<span class="pill info">Transferible</span>');if(p.contract<=1&&!p.youth&&p.clubId!=null)t.push('<span class="pill warn">Último año</span>');return t.join(' ');}
function toast(msg){const t=document.createElement('div');t.className='toast';t.innerHTML=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
function clubPlace(c){return c.stadium||c.league;}
function compTag(c){const comp=S.comps[c];return `<span class="comp ${comp&&comp.type==='E'?c:'lg'}">${esc(compShort(c))}</span>`;}
function roundLabel(f){return typeof f.r==='number'?'Jornada '+f.r:(f.r||'');}
function confColor(){const v=S.board.conf;return v>=60?'var(--good)':v>=35?'var(--warn)':'var(--bad)';}

function render(){
  if(!S){renderStart();return;}
  if(S.over){renderFired();return;}
  const c=me();
  const views={home:vHome,squad:vSquad,tactics:vTactics,training:vTraining,calendar:vCalendar,market:vMarket,youth:vYouth,league:vLeague,inbox:vInbox,club:vClub};
  const un=unread();
  const nv0=document.querySelector('.nav');const navL=nv0?nv0.scrollLeft:0,navT=nv0?nv0.scrollTop:0;
  root.innerHTML=`<div id="app">
   <nav class="nav" aria-label="Secciones">
    <div class="brand">Modo <span>Carrera</span></div>
    ${NAV.map(([k,l])=>`<button class="${UI.view===k?'on':''}" data-go="${k}">${icon(k)}<span>${l}</span>${k==='inbox'&&un?`<span class="dot">${un}</span>`:''}${k==='training'&&trainingAvail()&&(S.trainSel||[]).length<3&&!S.seasonDone?'<span class="dot ok"></span>':''}</button>`).join('')}
    <div class="src small muted">Datos: EA SPORTS FC 26</div>
   </nav>
   <main>
    <div class="topbar">${topbarHTML()}</div>
    ${views[UI.view]()}
   </main></div>`;
  const nv1=document.querySelector('.nav');if(nv1){nv1.scrollLeft=navL;nv1.scrollTop=navT;}
  if(UI.match)renderMatch();
}
function topbarHTML(){const c=me();const first=userFixtures().find(f=>f.c===userDiv().id);const pre=first&&S.date<=first.d&&!first.played;
  const today=!S.seasonDone&&userFixtureToday();
  const btn=S.seasonDone?'':SIM.on?'<button class="btn primary simbtn" data-act="simstop">⏸ Pausar</button>':today?'<button class="btn simbtn" disabled>Día de partido</button>':'<button class="btn primary simbtn" data-act="simdays">▶ Simular días</button>';
  return `${crest(c,44)}<div><h1>${esc(c.name)}</h1><div class="small muted">${esc(S.user.name)} · ${esc(userDiv().name)} · ${seasonLabel()}${S.seasonDone?' · Fin de temporada':pre?' · Pretemporada':' · Jornada '+leagueRound()}</div></div>
     <div class="meta"><div class="stat"><div class="label">Fecha</div><div class="v">${fmtDate(S.date,true)}</div></div><div class="stat"><div class="label">Presupuesto</div><div class="v num">${money(c.budget)}</div></div>
     <div class="stat"><div class="label">Posición</div><div class="v num">${posLabel()}</div></div>
     <div class="stat"><div class="label">Directiva</div><div class="v num" style="color:${confColor()}">${Math.round(S.board.conf)}%</div></div>${btn}</div>`;}

/* ---------- simular días: avanza solo y se detiene en partido o ante una notificación ---------- */
const SIM={on:false,timer:null};
function updateTop(){const el=document.querySelector('.topbar');if(el&&S)el.innerHTML=topbarHTML();}
function endSim(msg){clearTimeout(SIM.timer);SIM.timer=null;const was=SIM.on;SIM.on=false;if(was){save();render();if(msg)toast(msg);}}
function startSim(){if(SIM.on||S.seasonDone||S.over||userFixtureToday())return;SIM.on=true;updateTop();SIM.timer=setTimeout(simTick,60);}
function simTick(){
  if(!SIM.on)return;
  if(S.seasonDone||S.over||userFixtureToday()){endSim(S.seasonDone?'Fin de temporada':'Día de partido');return;}
  const before=S.msgId;processDay();updateTop();
  const nw=S.news.find(n=>n.id>=before&&!n.read);
  if(nw){endSim('Nueva notificación: '+nw.title.replace(/<[^>]*>/g,''));return;}
  if(S.seasonDone||userFixtureToday()){endSim(S.seasonDone?'Fin de temporada':'Día de partido');return;}
  SIM.timer=setTimeout(simTick,90);}

/* ---------- inicio ---------- */
function vHome(){
  const c=me();
  if(S.seasonDone){const sm=S.lastSummary;
    return `<div class="card"><h3>Fin de la temporada ${seasonLabel()}</h3>${sm?seasonSummaryHTML(sm):`<p>Se han disputado todas las competiciones. Revisa el balance y prepara la próxima temporada.</p><button class="btn primary" data-act="endSeason">Ver balance de la temporada</button>`}</div>`;}
  const today=userFixtureToday();const nf=today||nextUserFixture();
  const probs=lineupProblems();const lv=id=>Math.round(clubLevel(id));
  const team=(id,f)=>{const tb=!f.st?table(f.c):null;const r=tb&&tb.find(x=>x.id===id);return `<div class="team">${crest(S.clubs[id],72)}<div class="name">${esc(S.clubs[id].name)}</div><div class="small muted num">Media ${lv(id)}${r?' · '+r.pts+' pts':''}</div>${r?`<div class="form">${r.form.slice(-5).map(x=>`<span class="${x}">${{W:'V',D:'E',L:'D'}[x]}</span>`).join('')}</div>`:''}</div>`;};
  let hero;
  if(nf){const days=dayDiff(S.date,nf.d);
    hero=`<div class="card hero-card ${today?'matchday':''}" style="grid-column:1/-1">
    <div class="row between"><span class="label">${today?'Día de partido':'Próximo partido'} · ${compTag(nf.c)} ${esc(roundLabel(nf))}</span><span class="pill ${windowOpen()?'good':''}">${windowLabel()}</span></div>
    <div class="fixture-hero">${team(nf.h,nf)}<div class="vs"><div>VS</div><div class="when">${fmtDate(nf.d,true)}<br>${esc(clubPlace(S.clubs[nf.h]))}</div></div>${team(nf.a,nf)}</div>
    ${today&&probs.length?`<p class="small" style="color:var(--warn)">Tu once tiene ${probs.length} jugador(es) lesionados, sancionados o que ya no están. Se sustituirán automáticamente al empezar.</p>`:''}
    <div class="row" style="justify-content:center;margin-top:6px">
      ${today?`<button class="btn primary" data-act="play">Jugar partido</button><button class="btn" data-act="sim">Simular resultado</button><button class="btn" data-go="tactics">Ajustar alineación</button>`:
      `<button class="btn primary" data-act="simdays">▶ Simular días</button><button class="btn" data-go="tactics">Alineación</button>`}
    </div></div>`;}
  else hero=`<div class="card" style="grid-column:1/-1"><h3>Sin partidos pendientes</h3><p class="muted">Tu equipo ya ha terminado la temporada. Avanza hasta que acaben el resto de competiciones.</p><button class="btn primary" data-act="toEnd">Avanzar hasta el final de temporada</button></div>`;
  const upcoming=userFixtures().filter(f=>!f.played&&f!==nf).slice(0,5).map(f=>{const o=S.clubs[f.h===c.id?f.a:f.h];return `<div class="row between fxrow"><span class="small muted" style="min-width:86px">${fmtDate(f.d)}</span><span class="row" style="gap:8px;flex-wrap:nowrap;min-width:0;flex:1">${crest(o,22)} <span class="ellip">${esc(o.name)}</span></span>${S.comps[f.c].type==='E'?compTag(f.c):''}<span class="pill">${f.h===c.id?'Casa':'Fuera'}</span></div>`;}).join('');
  const news=S.news.slice(0,4).map(n=>`<div class="msg ${n.read?'':'unread'}" data-msg="${n.id}"><div style="min-width:0"><div class="t">${n.title}</div><div class="small muted">${n.type==='offer'&&!n.done?'<b style="color:var(--accent)">Requiere respuesta</b>':fmtDate(n.date)}</div></div></div>`).join('');
  const top3=squad(c.id).sort((a,b)=>b.ovr-a.ovr).slice(0,3);const ue=userEuro();
  return `<div class="grid g2">${hero}
   <div class="card"><h3>Figuras del equipo</h3><div class="cards-row">${top3.map(p=>card(p,{small:true,click:true})).join('')}</div></div>
   <div class="card"><h3>Directiva</h3>
    <div class="label">Objetivo</div><div style="font-weight:600;margin-bottom:8px">${esc(S.board.objective)}</div>
    <div class="label">Confianza</div><div class="bar" style="margin:6px 0"><i style="width:${S.board.conf}%;background:${confColor()}"></i></div>
    <div class="small muted">${leagueRound()===0?'La liga aún no ha empezado.':'Vas '+myPosition()+'º. '+(myPosition()<=S.board.target?'Cumpliendo el objetivo.':'Por debajo del objetivo (puesto '+S.board.target+').')}</div>
    ${ue?`<div class="label" style="margin-top:10px">Europa</div><div>${compTag(ue)} ${S.comps[ue].out[c.id]?'Eliminado: '+esc(S.comps[ue].out[c.id].toLowerCase()):esc(STAGE_NAME[S.comps[ue].stage]||'')}</div>`:''}
    <div class="label" style="margin-top:10px">Entrenamiento</div><div class="row" style="margin-top:6px"><span class="pill ${trainingAvail()?'good':''}">${trainingAvail()?'Sesión disponible · '+(S.trainSel||[]).length+'/3':'Próxima sesión '+fmtDate(S.trainNext)}</span><button class="btn sm" data-go="training">Entrenar</button></div>
   </div>
   <div class="card"><h3>Próximos partidos</h3>${upcoming||'<p class="muted">No hay más partidos.</p>'}<div style="margin-top:8px"><button class="btn sm" data-go="calendar">Calendario completo</button></div></div>
   <div class="card" style="padding:8px 4px"><h3 style="padding:8px 12px 0">Bandeja de entrada</h3>${news}<div style="padding:8px 12px"><button class="btn sm" data-go="inbox">Ver todo</button></div></div>
  </div>`;
}
function seasonSummaryHTML(sm){const mv=sm.moves[0];return `<div class="grid g3" style="margin:10px 0">
  <div><div class="label">Tu posición</div><div style="font:800 40px/1 var(--display)">${sm.pos}º</div><div class="small muted">${esc(sm.div)}</div></div>
  <div><div class="label">Campeón</div><div style="font-weight:600">${esc(sm.champion)}</div></div>
  <div><div class="label">Máximo goleador</div><div style="font-weight:600">${esc(sm.top)}</div></div>
  <div><div class="label">Objetivo</div><div>${esc(sm.objective)} <span class="pill ${sm.met?'good':'bad'}">${sm.met?'Cumplido':'No cumplido'}</span></div></div>
  ${sm.euro?`<div><div class="label">Europa</div><div>${esc(sm.euro)}</div></div>`:''}
  ${mv?`<div><div class="label">Bajan a ${esc(mv.d2)}</div><div class="small">${mv.down.map(esc).join(', ')}</div></div><div><div class="label">Suben a ${esc(mv.d1)}</div><div class="small">${mv.up.map(esc).join(', ')}</div></div>`:''}</div>
  ${sm.promotedUser?'<p style="color:var(--good);font-weight:600">¡Ascenso conseguido! La próxima temporada jugarás en primera.</p>':''}
  ${sm.relegatedUser?'<p style="color:var(--bad);font-weight:600">El equipo ha descendido a segunda división.</p>':''}
  <p class="small muted">Campeones: ${sm.champions.map(x=>`${esc(x.div)}: <b>${esc(x.club)}</b>`).join(' · ')}</p>
  ${sm.left.length?`<p class="small muted">Bajas en tu plantilla: ${sm.left.map(esc).join(', ')}.</p>`:''}
  <p>Premios: <b>${money(sm.prize)}</b>. Nuevo presupuesto: <b>${money(sm.budget)}</b>. Confianza de la directiva: <b>${sm.conf}%</b>.</p>
  ${sm.fired?`<p style="color:var(--bad);font-weight:600">${esc(sm.reason)}</p><button class="btn primary" data-act="toFired">Continuar</button>`:`<button class="btn primary" data-act="nextSeason">Empezar temporada ${seasonLabel(1)} (1 de julio)</button>`}`;}

/* ---------- plantilla ---------- */
function sortPlayers(arr,key){const po=p=>POS.indexOf(p.pos);const f={pos:(a,b)=>po(a)-po(b)||b.ovr-a.ovr,ovr:(a,b)=>b.ovr-a.ovr,pot:(a,b)=>b.pot-a.pot,age:(a,b)=>a.age-b.age,value:(a,b)=>valueOf(b)-valueOf(a),goals:(a,b)=>b.stats.goals-a.stats.goals,fit:(a,b)=>a.fitness-b.fitness,wage:(a,b)=>b.wage-a.wage}[key]||(()=>0);return arr.sort(f);}
function posList(p){return p.alt.length>1?`<span class="small muted">${p.alt.slice(1).join(' ')}</span>`:'';}
function vSquad(){
  const c=me();const sq=sortPlayers(squad(c.id),UI.sqSort);const xi=new Set(userLineup());
  const th=(k,l)=>`<th class="sort" data-sort="${k}">${l}${UI.sqSort===k?' ▾':''}</th>`;
  const head=`<div class="row between" style="margin-bottom:6px"><h3 style="margin:0">Primer equipo · ${sq.length} jugadores</h3>
   <div class="row"><div class="tabs" style="margin:0"><button class="${UI.sqMode==='cards'?'on':''}" data-sqmode="cards">Cartas</button><button class="${UI.sqMode==='list'?'on':''}" data-sqmode="list">Lista</button></div>
   <select id="sqsort" data-change="sqSort" aria-label="Ordenar">${[['pos','Posición'],['ovr','Media'],['pot','Potencial'],['age','Edad'],['value','Valor'],['wage','Salario'],['goals','Goles'],['fit','Forma']].map(([k,l])=>`<option value="${k}" ${UI.sqSort===k?'selected':''}>${l}</option>`).join('')}</select></div></div>
   <p class="small muted" style="margin:0 0 12px">Masa salarial ${money(wageBill(c.id))}/sem de ${money(c.wageBudget)}</p>`;
  if(UI.sqMode==='cards')return `<div class="card">${head}<div class="cards-grid">${sq.map(p=>`<div class="card-wrap">${card(p,{small:true,click:true,badge:xi.has(p.id)?'XI':''})}<div class="card-meta">${status(p)||`<span class="small muted">${p.age} años · ${money(valueOf(p))}</span>`}</div></div>`).join('')}</div></div>`;
  return `<div class="card">${head}
  <div class="tbl-wrap"><table><thead><tr><th>#</th>${th('pos','Pos')}<th>Nombre</th>${th('ovr','Med')}${th('pot','Pot')}${th('age','Edad')}${th('fit','Forma')}<th>Moral</th>${th('goals','G/A')}<th>Nota</th>${th('value','Valor')}${th('wage','Salario')}<th>Estado</th></tr></thead><tbody>
  ${sq.map(p=>`<tr class="click" data-player="${p.id}"><td class="muted">${p.num}</td><td>${posTag(p.pos)} ${posList(p)}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${face(p,30)}<b>${esc(p.name)}</b> ${flag(p.nat)}${xi.has(p.id)?' <span class="pill good">XI</span>':''}</span></td><td>${ovrTag(p.ovr)}</td><td class="muted">${p.pot}</td><td>${p.age}</td>
   <td><div class="bar" style="width:60px"><i style="width:${p.fitness}%;background:${p.fitness>75?'var(--good)':p.fitness>55?'var(--warn)':'var(--bad)'}"></i></div></td><td>${moraleTxt(p.morale)}</td><td>${p.stats.goals}/${p.stats.assists}</td><td>${p.stats.apps?(p.stats.rsum/p.stats.apps).toFixed(1):'–'}</td><td>${money(valueOf(p))}</td><td class="muted">${money(p.wage)}</td><td>${status(p)}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}
function moraleTxt(m){return m>=80?'<span style="color:var(--good)">Muy alta</span>':m>=62?'Alta':m>=45?'<span class="muted">Normal</span>':m>=30?'<span style="color:var(--warn)">Baja</span>':'<span style="color:var(--bad)">Muy baja</span>';}

function playerModal(id){
  const p=P(id);if(!p)return;const mine=p.clubId===S.user.clubId;const club=p.clubId!=null?S.clubs[p.clubId]:null;
  const hist=p.hist.slice(-5).reverse().map(h=>`<tr><td>${h.s}</td><td>${esc(h.c)}</td><td>${h.apps}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.apps?(h.rsum/h.apps).toFixed(1):'–'}</td></tr>`).join('');
  let actions='';
  if(mine&&!p.youth)actions=`<button class="btn" data-act="toggleList" data-id="${p.id}">${p.listed?'Quitar de transferibles':'Declarar transferible'}</button>
    <button class="btn" data-act="renew" data-id="${p.id}">Renovar contrato</button><button class="btn danger" data-act="release" data-id="${p.id}">Rescindir</button>`;
  else if(mine&&p.youth)actions=`<button class="btn primary" data-act="promote" data-id="${p.id}">Subir al primer equipo</button><button class="btn danger" data-act="releaseYouth" data-id="${p.id}">Despedir</button>`;
  else actions=`<button class="btn primary" data-act="bid" data-id="${p.id}">${club?'Hacer oferta':'Ofrecer contrato'}</button>`;
  modal(`<div class="pmodal">${card(p)}
   <div class="pinfo"><h2>${esc(p.name)}</h2><div class="row" style="gap:8px">${p.alt.map(posTag).join(' ')} <span>${flag(p.nat)} ${esc(natName(p.nat))}</span><span class="muted">${p.age} años</span><span class="muted">Potencial ${p.pot}</span></div>
    <div class="row" style="gap:8px;margin-top:8px">${club?crest(club,26)+`<span>${esc(club.name)}</span>`:'<span class="pill good">Agente libre</span>'}${p.youth?'<span class="pill">Cantera</span>':''}</div>
    <div class="kv"><div><span class="label">Valor</span><b>${money(valueOf(p))}</b></div><div><span class="label">Salario</span><b>${money(p.wage)}/sem</b></div><div><span class="label">Contrato</span><b>${p.clubId!=null?'Hasta '+contractEnd(p):'—'}</b></div>
    <div><span class="label">Forma física</span><b>${p.fitness}%</b></div><div><span class="label">Moral</span><b>${moraleTxt(p.morale)}</b></div><div><span class="label">Pie</span><b>${p.foot?'Izquierdo':'Derecho'}</b></div></div>
    <div style="margin-top:6px">${status(p)}</div>
    <div class="label" style="margin-top:12px">Progresión de media</div><div class="trainbar"><span>${p.pdir==='down'?'−1':'+1'}</span><div class="bar"><i style="width:${clamp(p.training||0,0,100)}%"></i></div><b>${Math.round(p.training||0)}%</b></div>
    <div class="label" style="margin-top:12px">Temporada</div><div class="num">${p.stats.apps} PJ · ${p.stats.goals} G · ${p.stats.assists} A · nota ${p.stats.apps?(p.stats.rsum/p.stats.apps).toFixed(2):'–'}</div>
    ${hist?`<div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>Temp.</th><th>Club</th><th>PJ</th><th>G</th><th>A</th><th>Nota</th></tr></thead><tbody>${hist}</tbody></table></div>`:''}
   </div></div>
   <div class="row" style="margin-top:14px">${actions}<button class="btn" data-close style="margin-left:auto">Cerrar</button></div>`,'wide');
}

/* ---------- táctica ---------- */
function vTactics(){
  const c=me();const xi=userLineup();const slots=FORMATIONS[c.formation];const inXI=new Set(xi);
  const benchList=sortPlayers(squad(c.id).filter(p=>!inXI.has(p.id)),'pos');const sel=UI.selSlot;
  const pitch=slots.map((s,i)=>{const p=xi[i]?P(xi[i]):null;const pen=p?posPen(p,s[0]):0;const bad=p&&!available(p);
    return `<div class="slot ${sel===i?'sel':''}" style="left:${s[1]}%;top:${s[2]}%" data-slot="${i}"><div class="chip ${bad?'bad':pen>1?'oop':''}">${p?face(p,48):''}<span class="chip-ovr">${p?p.ovr-pen:'–'}</span></div><div class="nm">${p?esc(p.name.split(' ').slice(-1)[0]):'Vacío'}</div><div class="sp">${s[0]}</div></div>`;}).join('');
  return `<div class="grid g2">
   <div class="card"><div class="row between" style="margin-bottom:10px"><h3 style="margin:0">Once inicial</h3><span class="small muted">Media <b class="num">${clubLevel(c.id).toFixed(1)}</b></span></div>
    <div class="row" style="margin-bottom:12px"><label class="label" for="formation">Formación</label><select id="formation" data-change="formation">${Object.keys(FORMATIONS).map(f=>`<option ${f===c.formation?'selected':''}>${f}</option>`).join('')}</select>
     <label class="label" for="ment">Mentalidad</label><select id="ment" data-change="ment">${MENT.map((m,i)=>`<option value="${i}" ${i===c.ment?'selected':''}>${m}</option>`).join('')}</select></div>
    <div class="pitch"><div class="circle"></div>${pitch}</div>
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="autoXI">Mejor once automático</button><span class="small muted">${sel!=null?'Elige un suplente o toca otra posición del campo para intercambiar.':'Toca una posición del campo para cambiar al jugador.'}</span></div>
    <p class="small muted" style="margin-top:8px">Borde naranja: fuera de posición (penaliza la media). Borde rojo: lesionado o sancionado. Con partidos entre semana, rota a los cansados.</p>
   </div>
   <div class="card"><h3>Suplentes y reservas</h3>
    <div class="tbl-wrap"><table><thead><tr><th>Pos</th><th>Nombre</th><th>Med</th><th>Forma</th><th></th></tr></thead><tbody>
    ${benchList.map(p=>`<tr class="click" data-benchp="${p.id}"><td>${posTag(p.pos)}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${face(p,28)}${esc(p.name)} ${status(p)}</span></td><td>${ovrTag(p.ovr)}</td><td class="num">${p.fitness}%</td><td>${sel!=null?`<span class="pill info">Meter</span>`:''}</td></tr>`).join('')}
    </tbody></table></div></div>
  </div>`;
}

/* ---------- entrenamiento ---------- */
function vTraining(){
  const c=me();const sel=S.trainSel||[];const avail=trainingAvail();const days=S.trainNext?Math.max(0,dayDiff(S.date,S.trainNext)):0;
  const status=sel.length>=3?'3/3 · sesión completa':avail?`Disponible · ${sel.length}/3`:`Disponible en ${days} día${days===1?'':'s'}`;
  const sq=sortPlayers(squad(c.id),UI.sqSort==='pos'?'pos':UI.sqSort);
  return `<div class="card"><div class="row between"><div><h3 style="margin:0">Entrenamiento</h3>
   <p class="small muted" style="max-width:70ch">Puedes hacer una sesión cada 3 días y entrenar hasta 3 jugadores en cada una. La media nunca baja por entrenar: la barra se llena y, al llegar al 100%, suma +1 de media y vuelve a 0%. La barra también sube o baja con lo que hace el jugador en cada partido. Los jóvenes y los de más potencial progresan más rápido.</p></div>
   <span class="pill ${avail?'good':''}">${status}</span></div>
   <div class="trainnote ${avail?'ok':''}">${avail?`<b>Disponible</b> · ${sel.length}/3 jugadores entrenados${sel.length>=3?` · próxima sesión <b>${fmtDate(S.trainNext,true)}</b>`:''}`:`Próxima sesión: <b>${fmtDate(S.trainNext,true)}</b>`}</div>
   <div class="row" style="margin:12px 0"><label class="label" for="trsort">Ordenar</label><select id="trsort" data-change="sqSort">${[['pos','Posición'],['ovr','Media'],['pot','Potencial'],['age','Edad']].map(([k,l])=>`<option value="${k}" ${UI.sqSort===k?'selected':''}>${l}</option>`).join('')}</select></div>
   <div class="cards-grid wide">${sq.map(p=>{const done=sel.includes(p.id);const dis=!avail||done||sel.length>=3||p.ovr>=99;
     return `<div class="card-wrap">${card(p,{small:true,click:true})}
      <div class="small muted num">${Math.round(p.training||0)}% · ${p.age} años · POT ${p.pot}</div>
      <button class="btn sm ${done?'':'primary'}" data-act="train" data-id="${p.id}" ${dis?'disabled':''}>${done?'Entrenado hoy':p.ovr>=99?'Media 99':!avail?'Bloqueado':'Entrenar'}</button></div>`;}).join('')}</div></div>`;
}

/* ---------- calendario ---------- */
function vCalendar(){
  const c=me();const list=userFixtures();let month='';
  const rows=list.map(f=>{const m=f.d.slice(0,7);let head='';if(m!==month){month=m;const dd=DT(f.d);head=`<div class="month">${MONL[dd.getUTCMonth()]} ${dd.getUTCFullYear()}</div>`;}
    const home=f.h===c.id;const o=S.clubs[home?f.a:f.h];const today=f.d===S.date&&!f.played;
    let res='';if(f.played){const my=home?f.hg:f.ag,op=home?f.ag:f.hg;const k=my>op?'W':my<op?'L':'D';res=`<span class="res ${k}">${f.hg}-${f.ag}${f.pen?' (p)':''}</span>`;}
    return head+`<div class="calrow ${today?'today':''} ${f.played?'played':''}"><span class="cd">${fmtDate(f.d)}</span>${compTag(f.c)}<span class="small muted cr">${esc(typeof f.r==='number'?'J'+f.r:f.r||'')}</span>
      <span class="row" style="gap:8px;flex-wrap:nowrap;min-width:0;flex:1">${crest(o,24)}<span class="ellip">${home?'':'<span class="muted">en </span>'}${esc(o.name)}</span></span>${res||(today?'<span class="pill good">Hoy</span>':`<span class="pill">${home?'Casa':'Fuera'}</span>`)}</div>`;}).join('');
  return `<div class="card"><div class="row between"><div><h3 style="margin:0">Calendario ${seasonLabel()}</h3><p class="small muted">Fechas oficiales de la temporada. Los resultados se simulan dentro de tu partida.</p></div><span class="pill">${list.length} partidos</span></div>${rows}</div>`;
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
   ${list.map(p=>{const cl=p.clubId!=null?S.clubs[p.clubId]:null;return `<tr class="click" data-player="${p.id}"><td>${posTag(p.pos)}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${face(p,32)}<b>${esc(p.name)}</b> ${flag(p.nat)}</span></td><td>${ovrTag(p.ovr)}</td><td class="muted">${p.pot}</td><td>${p.age}</td><td>${cl?`<span class="row" style="gap:6px;flex-wrap:nowrap">${crest(cl,24)} ${esc(cl.name)}</span>`:'<span class="pill good">Libre</span>'}</td><td>${money(valueOf(p))}</td><td class="muted">${money(p.wage)}</td></tr>`;}).join('')||'<tr><td colspan="8" class="muted">Sin resultados con estos filtros.</td></tr>'}
   </tbody></table></div>
   <div class="row between" style="margin-top:10px"><span class="small muted">${total} jugadores</span><div class="row"><button class="btn sm" data-page="-1" ${f.page===0?'disabled':''}>Anterior</button><button class="btn sm" data-page="1" ${(f.page+1)*pageSize>=total?'disabled':''}>Siguiente</button></div></div>
  </div>`;
}
function bidModal(id,stage,extra){
  const p=P(id);const c=me();const club=p.clubId!=null?S.clubs[p.clubId]:null;const w=windowInfo();
  if(!w.open){modal(`<h2>Mercado cerrado</h2><p>Podrás negociar por ${esc(p.name)} cuando abra el mercado, el ${fmtDate(w.next,true)}.</p><button class="btn" data-close>Cerrar</button>`);return;}
  const refuse=willingness(p);
  if(refuse){modal(`<h2>${esc(p.name)}</h2><p>El jugador rechaza negociar: <b>${refuse}</b></p><button class="btn" data-close>Cerrar</button>`);return;}
  if(squad(c.id).length>=40){modal(`<h2>Plantilla completa</h2><p>Tienes 40 jugadores en el primer equipo. Vende o rescinde a alguno antes de fichar.</p><button class="btn" data-close>Cerrar</button>`);return;}
  if(club&&stage!=='contract'){
    const neg=askingPrice(p);const val=valueOf(p);
    if(neg.agreed){bidModal(id,'contract',{fee:neg.agreed});return;}
    const sug=[0.9,1,1.15,1.3].map(x=>roundMoney(val*x));
    modal(`<div class="row" style="gap:12px;flex-wrap:nowrap;align-items:center">${face(p,56)}<div><h2 style="margin:0">Oferta por ${esc(p.name)}</h2><div class="small muted">${esc(club.name)} · ${p.pos} · ${p.ovr} · ${p.age} años · Valor ${money(val)}</div></div></div>
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
   <label class="label" for="years">Años</label><select id="years">${[1,2,3,4,5].map(y=>`<option value="${y}" ${y===4?'selected':''}>${y} (hasta ${S.year+y})</option>`).join('')}</select></div>
   <div class="row"><button class="btn primary" data-act="sendContract" data-id="${p.id}" data-fee="${fee}">Proponer contrato</button><button class="btn" data-close style="margin-left:auto">Cancelar</button></div>`);
}

/* ---------- cantera ---------- */
function vYouth(){
  const c=me();const yth=squad(c.id,true).filter(p=>p.youth).sort((a,b)=>b.pot-a.pot);
  return `<div class="grid g2"><div class="card"><h3>Red de ojeadores</h3>
   ${S.scout?`<p>Misión en curso: <b>${REGIONS[S.scout.region]}</b> (${SCOUT_LV[S.scout.lv].n}). Informe en <b>${S.scout.days}</b> día(s).</p>`:
   `<p class="small muted">Envía un ojeador durante 3 semanas para descubrir juveniles de 15 a 17 años. A mayor nivel, más potencial.</p>
   <div class="row" style="margin-bottom:10px"><label class="label" for="sc-region">Región</label><select id="sc-region">${Object.entries(REGIONS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
   <label class="label" for="sc-lv">Ojeador</label><select id="sc-lv">${SCOUT_LV.map((l,i)=>`<option value="${i}">${l.n} · ${money(l.cost)}</option>`).join('')}</select></div>
   <button class="btn primary" data-act="scout" ${yth.length>=12?'disabled':''}>Enviar ojeador</button>${yth.length>=12?'<p class="small muted">La cantera está llena (12).</p>':''}`}
  </div>
  <div class="card"><h3>Cómo funciona</h3><p class="small muted">Los canteranos progresan cada día según su edad y potencial. Súbelos al primer equipo cuando estén listos; a los 19 años suben automáticamente. Cada verano llegan dos juveniles nuevos.</p></div>
  <div class="card" style="grid-column:1/-1"><h3>Juveniles (${yth.length}/12)</h3>
   <div class="tbl-wrap"><table><thead><tr><th>Pos</th><th>Nombre</th><th>Edad</th><th>Med</th><th>Potencial</th><th>Progreso</th></tr></thead><tbody>
   ${yth.map(p=>`<tr class="click" data-player="${p.id}"><td>${posTag(p.pos)}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${face(p,28)}<b>${esc(p.name)}</b> ${flag(p.nat)}</span></td><td>${p.age}</td><td>${ovrTag(p.ovr)}</td><td><span class="stars">${stars(clamp((p.pot-55)/8,0.5,5))}</span> <span class="muted small">${p.pot-3}–${p.pot+3}</span></td><td><div class="bar" style="width:80px"><i style="width:${Math.min(100,p.training||0)}%"></i></div></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Aún no tienes juveniles. Envía un ojeador para descubrir talento.</td></tr>'}
   </tbody></table></div></div></div>`;
}

/* ---------- competiciones ---------- */
function vLeague(){
  const cid=UI.leagueComp||userDiv().id;const comp=S.comps[cid];
  const head=`<div class="row" style="margin-bottom:12px"><label class="label" for="compsel">Competición</label><select id="compsel" data-change="leagueComp">${S.divs.map(x=>`<option value="${x.id}" ${x.id===cid?'selected':''}>${esc(x.name)} · ${esc(x.country)}</option>`).join('')}${EURO_CODES.map(c=>`<option value="${c}" ${c===cid?'selected':''}>${esc(S.comps[c].name)}</option>`).join('')}</select></div>
   <div class="tabs">${[['tabla',comp.type==='E'?'Fase liga':'Clasificación'],['res','Resultados'],...(comp.type==='E'?[['ko','Eliminatorias']]:[]),['goles','Goleadores']].map(([k,l])=>`<button class="${UI.leagueTab===k?'on':''}" data-ltab="${k}">${l}</button>`).join('')}</div>`;
  const clubIds=comp.type==='L'?S.divs[comp.div].clubs:comp.clubs;
  if(UI.leagueTab==='tabla'){const tb=table(cid);const n=tb.length;let zone,legend;
    if(comp.type==='E'){zone=i=>i<8?'var(--good)':i<24?'var(--warn)':'var(--bad)';legend='<span style="color:var(--good)">■</span> Octavos · <span style="color:var(--warn)">■</span> Play-off · <span style="color:var(--bad)">■</span> Eliminado';}
    else{const d=S.divs[comp.div];const sw=d.tier===1?d.sw:S.divs.find(x=>x.country===d.country&&x.tier===1).sw;
      zone=i=>d.tier===1?(i<4?'var(--info)':i<7?'var(--good)':i>=n-sw?'var(--bad)':'transparent'):(i<sw?'var(--good)':'transparent');
      legend=d.tier===1?'<span style="color:var(--info)">■</span> Champions League · <span style="color:var(--good)">■</span> Europa · <span style="color:var(--bad)">■</span> Descenso':'<span style="color:var(--good)">■</span> Ascenso a primera';}
    return head+`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Club</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th><th>Forma</th></tr></thead><tbody>
    ${tb.map((r,i)=>{const c=S.clubs[r.id];return `<tr class="${r.id===S.user.clubId?'me':''}"><td style="box-shadow:inset 3px 0 0 ${zone(i)}">${i+1}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${crest(c,24)} ${esc(c.name)}</span></td><td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.gf-r.gc>0?'+':''}${r.gf-r.gc}</td><td><b>${r.pts}</b></td><td class="form">${r.form.slice(-5).map(f=>`<span class="${f}">${{W:'V',D:'E',L:'D'}[f]}</span>`).join('')}</td></tr>`;}).join('')}
    </tbody></table></div><p class="small muted" style="margin-top:8px">${legend}</p></div>`;}
  const fxRow=f=>{const h=S.clubs[f.h],a=S.clubs[f.a];const goals=f.ev.filter(e=>e.t==='g');return `<div class="resrow"><div class="small muted" style="text-align:center">${fmtDate(f.d)}${typeof f.r==='string'?' · '+esc(f.r):''}</div><div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center"><span class="row" style="justify-content:flex-end;gap:8px;text-align:right;flex-wrap:nowrap">${esc(h.name)} ${crest(h,24)}</span><b class="num" style="font:700 20px/1 var(--display);min-width:54px;text-align:center">${f.played?f.hg+' - '+f.ag:'–'}</b><span class="row" style="gap:8px;flex-wrap:nowrap">${crest(a,24)} ${esc(a.name)}</span></div>
     ${f.pen?`<div class="small" style="text-align:center">Pasa ${esc(S.clubs[f.winner].name)} en los penaltis</div>`:f.winner!=null?`<div class="small muted" style="text-align:center">Clasificado: ${esc(S.clubs[f.winner].name)}</div>`:''}
     ${goals.length?`<div class="small muted" style="text-align:center;margin-top:4px">${goals.map(g=>`${esc(nm(g.pid))} ${g.min}'`).join(' · ')}</div>`:''}</div>`;};
  if(UI.leagueTab==='res'){const lf=S.fx.filter(f=>f.c===cid&&!f.st);const maxR=Math.max(1,...lf.map(f=>f.r));let played=1;lf.forEach(f=>{if(f.played&&f.r>played)played=f.r;});
    const r=clamp(UI.round??played,1,maxR);const rd=lf.filter(f=>f.r===r);
    return head+`<div class="card"><div class="row between" style="margin-bottom:10px"><button class="btn sm" data-round="${r-1}" ${r<=1?'disabled':''}>‹</button><b>Jornada ${r}</b><button class="btn sm" data-round="${r+1}" ${r>=maxR?'disabled':''}>›</button></div>${rd.map(fxRow).join('')}</div>`;}
  if(UI.leagueTab==='ko'){const blocks=['po','r16','qf','sf','f'].map(st=>{const fs=S.fx.filter(f=>f.c===cid&&f.st===st);if(!fs.length)return '';return `<h3 style="margin-top:14px">${STAGE_NAME[st]}</h3>${fs.map(fxRow).join('')}`;}).join('');
    return head+`<div class="card">${blocks||'<p class="muted">Las eliminatorias empiezan cuando termine la fase liga.</p>'}${comp.champion!=null?`<p style="margin-top:12px">Campeón: <b>${esc(S.clubs[comp.champion].name)}</b></p>`:''}</div>`;}
  const set=new Set(clubIds);const ps=Object.values(S.players).filter(p=>p.clubId!=null&&set.has(p.clubId)&&(p.stats.goals||p.stats.assists)).sort((a,b)=>b.stats.goals-a.stats.goals||b.stats.assists-a.stats.assists).slice(0,25);
  return head+`<div class="card"><p class="small muted">Goles en todas las competiciones de la temporada.</p><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Jugador</th><th>Club</th><th>PJ</th><th>Goles</th><th>Asist.</th><th>Nota</th></tr></thead><tbody>
  ${ps.map((p,i)=>`<tr class="click ${p.clubId===S.user.clubId?'me':''}" data-player="${p.id}"><td>${i+1}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${face(p,28)}${posTag(p.pos)} ${esc(p.name)} ${flag(p.nat)}</span></td><td><span class="row" style="gap:6px;flex-wrap:nowrap">${crest(S.clubs[p.clubId],20)} ${esc(S.clubs[p.clubId].name)}</span></td><td>${p.stats.apps}</td><td><b>${p.stats.goals}</b></td><td>${p.stats.assists}</td><td>${(p.stats.rsum/p.stats.apps).toFixed(2)}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">Todavía no se ha disputado ninguna jornada.</td></tr>'}
  </tbody></table></div></div>`;
}

/* ---------- bandeja ---------- */
function vInbox(){
  return `<div class="card" style="padding:6px 0">${S.news.map(n=>`<div class="msg ${n.read?'':'unread'}" data-msg="${n.id}"><div style="min-width:0;flex:1"><div class="row between"><span class="t">${n.title}</span><span class="small muted">${fmtDate(n.date,true)}</span></div>
   <div class="small muted">${n.type==='offer'?(n.done?'Oferta · '+esc(n.done):'<b style="color:var(--accent)">Oferta pendiente</b>'):n.type==='rumor'?'Noticias':n.type==='dev'?'Evolución':'Club'}</div></div></div>`).join('')||'<p class="muted" style="padding:12px">Sin mensajes.</p>'}</div>`;
}
function openMsg(id){const n=S.news.find(x=>x.id===id);if(!n)return;n.read=true;save();
  let act='';if(n.type==='offer'&&!n.done){const p=P(n.data.pid);if(!p||p.clubId!==S.user.clubId){n.done='Ya no disponible';}
    else act=`<div class="row" style="margin-top:14px"><button class="btn primary" data-act="acceptOffer" data-id="${n.id}">Aceptar ${money(n.data.fee)}</button><button class="btn" data-act="counterOffer" data-id="${n.id}">Contraoferta</button><button class="btn danger" data-act="rejectOffer" data-id="${n.id}">Rechazar</button></div>`;}
  modal(`<h2>${n.title}</h2><div class="small muted" style="margin-bottom:10px">${fmtDate(n.date,true)}</div><div>${n.body}</div>${n.done?`<p class="pill" style="margin-top:12px">${esc(n.done)}</p>`:''}${act}<div class="row" style="margin-top:14px"><button class="btn" data-close style="margin-left:auto">Cerrar</button></div>`);render();}

function counterModal(id,msg,final){
  const n=S.news.find(x=>x.id===id);if(!n)return;const p=P(n.data.pid);const b=S.clubs[n.data.cid];const left=3-(n.data.tries||0);
  const cur=final?n.data.lastOffer:n.data.fee;
  const sug=[1,1.15,1.3,1.5].map(x=>roundMoney(n.data.fee*x));
  modal(`<div class="row" style="gap:12px;flex-wrap:nowrap;align-items:center">${face(p,56)}<div><h2 style="margin:0">Contraoferta por ${esc(p.name)}</h2><div class="small muted">${esc(b.name)} ofrece ${money(n.data.fee)} · Valor de mercado ${money(valueOf(p))}</div></div></div>
   <p>Fija tú el precio que pides. Intentos restantes: <b>${left}</b>. Presupuesto del comprador: <b>${money(b.budget)}</b>.</p>
   ${msg?`<p style="color:var(--warn)">${esc(msg)}</p>`:''}
   <label class="label" for="ask">Precio que pides (€)</label>
   <div class="row" style="margin:6px 0 10px"><input type="number" id="ask" value="${roundMoney(cur*1.25)}" step="100000" min="0" style="flex:1"></div>
   <div class="row" style="margin-bottom:14px">${sug.map(s=>`<button class="btn sm" data-setask="${s}">${money(s)}</button>`).join('')}</div>
   <div class="row"><button class="btn primary" data-act="sendCounter" data-id="${n.id}">Enviar contraoferta</button>${final?`<button class="btn" data-act="acceptLast" data-id="${n.id}">Aceptar ${money(n.data.lastOffer)}</button>`:''}<button class="btn" data-close style="margin-left:auto">Cancelar</button></div>`);
}

/* ---------- club ---------- */
function vClub(){
  const c=me();
  return `<div class="grid g2">
   <div class="card"><h3>Finanzas</h3>
    <div class="grid g3"><div><div class="label">Fichajes</div><div class="num" style="font:700 24px/1.1 var(--display)">${money(c.budget)}</div></div>
    <div><div class="label">Salarios / sem</div><div class="num" style="font:700 24px/1.1 var(--display)">${money(wageBill(c.id))}</div><div class="small muted">Límite ${money(c.wageBudget)}</div></div>
    <div><div class="label">Valor plantilla</div><div class="num" style="font:700 24px/1.1 var(--display)">${money(squad(c.id).reduce((s,p)=>s+valueOf(p),0))}</div></div></div>
    <p class="small muted" style="margin-top:10px">Al final de cada temporada la directiva asigna un nuevo presupuesto según el club, la clasificación, Europa y el objetivo cumplido.</p></div>
   <div class="card"><h3>El club</h3><div class="row">${crest(c,72)}<div><div style="font-weight:600">${esc(c.name)}</div><div class="small muted">${esc(clubPlace(c))} · ${esc(userDiv().name)}</div><div class="stars">${stars(c.rep)}</div></div></div></div>
   <div class="card"><h3>Tu carrera</h3><p><b>${esc(S.user.name)}</b> · Títulos: <b>${S.user.trophies.length}</b>${S.user.trophies.length?' ('+S.user.trophies.map(esc).join(', ')+')':''}</p>
    <div class="tbl-wrap"><table><thead><tr><th>Temp.</th><th>Club</th><th>Pos.</th><th>Pts</th><th>Europa</th><th>Objetivo</th></tr></thead><tbody>${S.user.history.slice().reverse().map(h=>`<tr><td>${h.season}</td><td>${esc(h.club)}</td><td>${h.pos}º</td><td>${h.pts}</td><td class="small">${esc(h.euro||'—')}</td><td><span class="pill ${h.met?'good':'bad'}">${h.met?'Cumplido':'Fallado'}</span></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Primera temporada en curso.</td></tr>'}</tbody></table></div></div>
   <div class="card"><h3>Partida</h3><p class="small muted">La partida se guarda automáticamente en este navegador. Exporta una copia para pasarla a otro dispositivo.</p>
    <div class="row"><button class="btn" data-act="export">Exportar partida</button><label class="btn" for="importFile">Importar partida</label><input type="file" id="importFile" accept=".json,.txt,application/json" hidden>
    <button class="btn danger" data-act="newCareer">Nueva carrera</button></div><textarea id="exportBox" hidden readonly aria-label="Partida exportada" style="width:100%;height:110px;margin-top:10px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:8px"></textarea>
    <p class="small muted" style="margin-top:10px">Fuentes: ${esc(DB.source)}. Caras de las cartas de FC 26.</p></div>
  </div>`;
}

/* ---------- inicio de juego ---------- */
let START_LEVELS=null;
function startLevels(){if(START_LEVELS)return START_LEVELS;const by={};DB.players.forEach(r=>{if(r[8]<0)return;(by[r[8]]=by[r[8]]||[]).push(r[2]);});
  START_LEVELS=DB.clubs.map((c,i)=>{if(c.g)return c.g[0];const a=(by[i]||[]).sort((x,y)=>y-x).slice(0,11);return a.length?a.reduce((s,x)=>s+x,0)/a.length:60;});return START_LEVELS;}
function renderStart(){
  const saved=loadMeta();const sel=UI.newClub;const lv=startLevels();const d=DB.divs[UI.startDiv];
  const list=d.clubs.map(i=>({i,c:DB.clubs[i],l:lv[i]})).sort((a,b)=>b.l-a.l);
  const euroOf=i=>EURO_CODES.find(code=>DB.euro[code].clubs.includes(i));
  root.innerHTML=`<div class="start"><div class="box">
   <div><div class="label" style="color:var(--accent)">Temporada ${DB.season} · Datos EA SPORTS FC 26</div><div class="hero-title">Modo carrera:<br><em>el míster</em> eres tú</div>
   <p class="muted" style="max-width:62ch">La temporada arranca el 1 de julio de 2026 con la pretemporada y el calendario oficial 2026/27: LaLiga, Premier League, Serie A, Bundesliga y Ligue 1 con sus segundas divisiones, más Champions, Europa League y Conference League. Equipos, jugadores, valores, salarios y presupuestos reales.</p></div>
   ${saved?`<div class="card row between"><div><div class="label">Partida guardada</div><div style="font-weight:600">${esc(saved.name)} · ${esc(saved.club)} · ${esc(saved.season||'')}${saved.date?' · '+fmtDate(saved.date,true):''}</div></div><button class="btn primary" data-act="continue">Continuar carrera</button></div>`:''}
   <div class="card"><h3>Nueva carrera</h3>
    <div class="row" style="margin-bottom:12px"><label class="label" for="mgr">Tu nombre</label><input type="text" id="mgr" placeholder="Nombre del entrenador" maxlength="30" style="flex:1;min-width:180px"></div>
    <div class="tabs">${DB.divs.map((x,i)=>`<button class="${UI.startDiv===i?'on':''}" data-sdiv="${i}">${esc(x.n)}</button>`).join('')}</div>
    <div class="clubpick">${list.map(({i,c,l})=>{const e=euroOf(i);return `<button class="${sel===i?'on':''}" data-pick="${i}">${crest({k:c.k,short:c.s,c1:c.c1,c2:c.c2,name:c.n},44)}<div style="min-width:0"><div style="font-weight:600">${esc(c.n)}</div><div class="small muted">Media ${Math.round(l)} · ${money(c.b)}</div><div class="stars">${stars(repFromLevel(l))}</div>${e?`<span class="comp ${e}">${EURO_NAME[e]}</span>`:''}</div></button>`;}).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn primary" data-act="start" ${sel==null?'disabled':''}>Firmar con ${sel!=null?esc(DB.clubs[sel].n):'…'}</button><label class="btn" for="importFile">Importar partida</label><input type="file" id="importFile" accept=".json,.txt,application/json" hidden></div>
   </div><p class="small muted">Fuentes: ${esc(DB.source)}.</p></div></div>`;
}
function renderFired(){const offers=jobOffers();
  root.innerHTML=`<div class="start"><div class="box"><div class="hero-title">Destituido</div><p>${esc(S.firedReason||'')}</p>
   <div class="card"><h3>Ofertas de trabajo</h3><p class="small muted">Tu agente ha recibido interés de estos clubes.</p><div class="clubpick">${offers.map(c=>`<button data-job="${c.id}">${crest(c,40)}<div><div style="font-weight:600">${esc(c.name)}</div><div class="small muted">${esc(S.divs[c.div].name)}</div><div class="stars">${stars(c.rep)}</div></div></button>`).join('')}</div>
   <div class="row" style="margin-top:14px"><button class="btn danger" data-act="newCareer">Empezar de cero</button></div></div></div></div>`;}

/* ---------- partido en directo ---------- */
let timer=null;
function startMatch(live){
  const fx=userFixtureToday();if(!fx)return;
  const m=createMatch(fx,live);UI.match=m;m.speed=1;
  if(!live){simToEnd(m);m.ended=true;finalizeMatch(m);}
  else push(m,0,'info',`¡Empieza el partido en ${clubPlace(S.clubs[fx.h])}!`,'');
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
  const feed=m.ev.map((e,i)=>[e,i]).reverse().map(([e,i])=>`<div class="ev ${e.type}${i>=seen?' new':''}"><span class="m">${e.min}'</span>${e.side?crest(S.clubs[e.side==='h'?m.home.cid:m.away.cid],22):''}<span>${esc(e.text)}</span></div>`).join('');
  let ratings='';
  if(m.ended&&m.fx.ratings){const rows=Object.entries(user.mins).filter(([id,mn])=>mn>0).map(([id])=>P(+id)).filter(Boolean).sort((x,y)=>m.fx.ratings[y.id]-m.fx.ratings[x.id]);
    ratings=`<div class="card"><h3>Notas de tus jugadores</h3><div class="mvp">${rows[0]?card(rows[0],{small:true,badge:'MVP'}):''}<div class="tbl-wrap" style="flex:1;min-width:0"><table><thead><tr><th>Jugador</th><th>Min</th><th>G</th><th>A</th><th>Nota</th><th>Barra</th></tr></thead><tbody>${rows.map(p=>`<tr><td><span class="row" style="gap:8px;flex-wrap:nowrap">${face(p,26)}${posTag(p.pos)} ${esc(p.name)}</span></td><td>${user.mins[p.id]}</td><td>${user.contrib[p.id]?.g||0}</td><td>${user.contrib[p.id]?.a||0}</td><td><b style="color:${m.fx.ratings[p.id]>=7.5?'var(--good)':m.fx.ratings[p.id]<6?'var(--bad)':'var(--fg)'}">${m.fx.ratings[p.id].toFixed(1)}</b></td>${(()=>{const d=(m.fx.prog||{})[p.id];return d==null?'<td class="muted">–</td>':`<td style="color:${d>=0?'var(--good)':'var(--bad)'}">${d>=0?'+':''}${d.toFixed(1)}%</td>`;})()}</tr>`).join('')}</tbody></table></div></div></div>`;}
  const tie=m.ended&&m.fx.winner!=null?`<p style="text-align:center;margin:0">${m.fx.pen?'Tras los penaltis, ':''}Se clasifica <b>${esc(S.clubs[m.fx.winner].name)}</b></p>`:'';
  el.innerHTML=`<div class="inner">
   <div class="small muted" style="text-align:center">${compTag(m.fx.c)} ${esc(roundLabel(m.fx))} · ${fmtDate(m.fx.d,true)} · ${esc(clubPlace(h))}</div>
   <div class="scoreboard"><div class="t">${crest(h,48)}<span>${esc(h.name)}</span></div><div><div class="score num">${m.home.goals} - ${m.away.goals}</div><span class="clock" style="text-align:center">${minShown}</span></div><div class="t away"><span>${esc(a.name)}</span>${crest(a,48)}</div></div>
   ${tie}
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
   <div class="grid g2"><div><div class="label" style="margin-bottom:6px">En el campo</div>${onPitch(s).map(id=>{const p=P(id);return `<button class="btn subbtn" style="${out===id?'border-color:var(--accent)':''}" data-subout="${id}"><span class="row" style="gap:6px;flex-wrap:nowrap">${face(p,24)}${posTag(slotOf(s,id))} ${esc(p.name)}</span><span class="num muted">${Math.round(s.fit[id])}%${s.yellows[id]?' · TA':''}</span></button>`;}).join('')}</div>
   <div><div class="label" style="margin-bottom:6px">Banquillo</div>${s.bench.map(id=>{const p=P(id);return `<button class="btn subbtn" data-subin="${id}" ${out?'':'disabled'}><span class="row" style="gap:6px;flex-wrap:nowrap">${face(p,24)}${posTag(p.pos)} ${esc(p.name)}</span><span class="num">${p.ovr}</span></button>`;}).join('')}</div></div>`}
   <div class="row" style="margin-top:10px"><button class="btn" data-close style="margin-left:auto">Volver al partido</button></div>`);
}
function finishUserMatch(){
  const m=UI.match;clearInterval(timer);
  if(!m.fx.played)finalizeMatch(m);
  const my=m.home.isUser?m.home:m.away,op=m.home.isUser?m.away:m.home;
  me().ment=my.ment;
  const res=my.goals>op.goals?'Victoria':my.goals<op.goals?'Derrota':'Empate';
  afterUserMatch(m.fx,my.goals,op.goals);
  UI.match=null;const el=document.getElementById('matchView');if(el)el.remove();
  toast(`${res} ${my.goals}-${op.goals} ante ${esc(S.clubs[op.cid].name)}`);
  UI.view='home';render();
}

/* ---------- previa del partido: once del rival ---------- */
function previewMatch(live){
  const fx=userFixtureToday();if(!fx)return;const uid=S.user.clubId;const oid=fx.h===uid?fx.a:fx.h;const o=S.clubs[oid];
  const xi=bestXI(oid,o.formation);const slots=FORMATIONS[o.formation];
  const pitch=slots.map((s,i)=>{const p=xi[i]?P(xi[i]):null;const pen=p?posPen(p,s[0]):0;
    return `<div class="slot"${''} style="left:${s[1]}%;top:${s[2]}%"><div class="chip ${pen>1?'oop':''}">${p?face(p,50):''}<span class="chip-ovr">${p?p.ovr-pen:'–'}</span></div><div class="nm">${p?esc(p.name.split(' ').slice(-1)[0]):'Vacío'}</div><div class="sp">${s[0]}</div></div>`;}).join('');
  const sq=squad(oid);const absent=sq.filter(p=>!available(p)).sort((a,b)=>b.ovr-a.ovr).slice(0,5);
  const news=sq.filter(p=>p.signed).sort((a,b)=>b.ovr-a.ovr).slice(0,6);
  const lvl=clubLevel(oid),mine=clubLevel(uid);const tb=!fx.st?table(fx.c).find(r=>r.id===oid):null;
  modal(`<div class="row" style="gap:12px;flex-wrap:nowrap">${crest(o,56)}<div style="min-width:0"><div class="label">${compTag(fx.c)} ${esc(roundLabel(fx))} · ${fmtDate(fx.d,true)}</div><h2 style="margin:2px 0 0">${esc(o.name)}</h2>
   <div class="small muted">${fx.h===uid?'Juegas en casa':'Juegas fuera'} · ${esc(clubPlace(S.clubs[fx.h]))}</div></div></div>
   <div class="kv" style="margin:12px 0"><div><span class="label">Formación</span><b>${esc(o.formation)}</b></div><div><span class="label">Media del once</span><b>${lvl.toFixed(1)} <span class="muted small">(tú ${mine.toFixed(1)})</span></b></div><div><span class="label">Clasificación</span><b>${tb?tb.pts+' pts · '+tb.pj+' PJ':'—'}</b></div></div>
   <div class="pitch"><div class="circle"></div>${pitch}</div>
   ${news.length?`<div class="label" style="margin-top:12px">Fichajes de esta temporada</div><div class="small" style="margin-top:4px">${news.map(p=>`${esc(p.name)} (${p.ovr}${p.signed!==true?' · '+esc(p.signed):''})`).join(' · ')}</div>`:''}
   ${absent.length?`<div class="label" style="margin-top:10px">Bajas</div><div class="small" style="margin-top:4px">${absent.map(p=>`${esc(p.name)} (${p.ovr}) ${p.injury?'lesión':'sanción'}`).join(' · ')}</div>`:''}
   <div class="row" style="margin-top:14px"><button class="btn primary" data-act="startmatch" data-live="${live?1:0}">${live?'Jugar partido':'Simular resultado'}</button><button class="btn" data-close style="margin-left:auto">Cancelar</button></div>`,'wide');
}

/* ---------- modal ---------- */
function modal(html,cls){if(SIM.on){clearTimeout(SIM.timer);SIM.on=false;updateTop();}closeModal();const bg=document.createElement('div');bg.className='modal-bg';bg.id='modal';bg.innerHTML=`<div class="modal ${cls||''}" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(bg);
  bg.addEventListener('click',e=>{if(e.target===bg)closeModal();});}
function closeModal(){const m=document.getElementById('modal');if(m)m.remove();}

/* ================= eventos ================= */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-go],[data-act],[data-player],[data-slot],[data-benchp],[data-sort],[data-ltab],[data-round],[data-msg],[data-pick],[data-sdiv],[data-close],[data-page],[data-setfee],[data-setask],[data-subout],[data-subin],[data-job],[data-sqmode]');
  if(!t)return;const d=t.dataset;
  if(S)invalidate();
  if(d.close!==undefined){closeModal();UI.pendingSubOut=null;return;}
  if(d.go){UI.view=d.go;UI.selSlot=null;closeModal();render();window.scrollTo(0,0);return;}
  if(d.sdiv){UI.startDiv=+d.sdiv;const v=document.getElementById('mgr')?.value;renderStart();if(v)document.getElementById('mgr').value=v;return;}
  if(d.pick){UI.newClub=+d.pick;const v=document.getElementById('mgr')?.value;renderStart();if(v)document.getElementById('mgr').value=v;return;}
  if(d.job){takeJob(+d.job);UI.view='home';render();return;}
  if(d.sqmode){UI.sqMode=d.sqmode;render();return;}
  if(d.player){playerModal(+d.player);return;}
  if(d.sort){UI.sqSort=d.sort;render();return;}
  if(d.ltab){UI.leagueTab=d.ltab;UI.round=null;render();return;}
  if(d.round){UI.round=+d.round;render();return;}
  if(d.msg){openMsg(+d.msg);return;}
  if(d.page){UI.mk.page=Math.max(0,UI.mk.page+ +d.page);render();return;}
  if(d.setask){const f=document.getElementById('ask');if(f)f.value=d.setask;return;}
  if(d.setfee){const f=document.getElementById('fee');if(f)f.value=d.setfee;return;}
  if(d.slot!==undefined){const i=+d.slot;const xi=userLineup();
    if(UI.selSlot==null)UI.selSlot=i;else if(UI.selSlot===i)UI.selSlot=null;else{[xi[UI.selSlot],xi[i]]=[xi[i],xi[UI.selSlot]];UI.selSlot=null;save();}
    render();return;}
  if(d.benchp){const id=+d.benchp;if(UI.selSlot==null){playerModal(id);return;}const xi=userLineup();xi[UI.selSlot]=id;UI.selSlot=null;save();render();return;}
  if(d.subout){UI.pendingSubOut=+d.subout;subsModal();return;}
  if(d.subin){const m=UI.match;const s=m.home.isUser?m.home:m.away;if(UI.pendingSubOut&&s.subs<5)doSub(m,s,UI.pendingSubOut,+d.subin);UI.pendingSubOut=null;subsModal();return;}
  if(d.act)act(d.act,t);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('modal')){closeModal();UI.pendingSubOut=null;}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.fut[data-player]')){e.preventDefault();playerModal(+e.target.dataset.player);}});
document.addEventListener('change',e=>{
  const t=e.target;const d=t.dataset;
  if(d.change==='formation'){const c=me();c.formation=t.value;c.lineup=bestXI(c.id,c.formation);UI.selSlot=null;save();render();}
  else if(d.change==='ment'){me().ment=+t.value;save();}
  else if(d.change==='sqSort'){UI.sqSort=t.value;render();}
  else if(d.change==='liveMent'){const m=UI.match;(m.home.isUser?m.home:m.away).ment=+t.value;}
  else if(d.change==='leagueComp'){UI.leagueComp=t.value;UI.round=null;if(UI.leagueTab==='ko'&&S.comps[t.value].type!=='E')UI.leagueTab='tabla';render();}
  else if(d.mk){UI.mk[d.mk]=['q','pos','league'].includes(d.mk)?t.value:+t.value;UI.mk.page=0;render();}
  else if(t.id==='importFile'&&t.files[0]){const r=new FileReader();r.onload=()=>{parseSave(String(r.result)).then(data=>{if(!data||!data.clubs||!data.players||!data.fx)throw 0;boot(data);save();UI.view='home';render();toast('Partida importada');}).catch(()=>toast('El archivo no es una partida válida.'));};r.readAsText(t.files[0]);}
});

function busy(t,label,fn){if(t){t.disabled=true;t.textContent=label;}setTimeout(()=>{fn();render();},20);}
function act(a,t){
  const id=t.dataset.id?+t.dataset.id:null;
  switch(a){
  case 'start':{const name=(document.getElementById('mgr').value||'').trim()||'Míster';busy(t,'Cargando la base de datos…',()=>{newGame(name,UI.newClub);UI.view='home';});break;}
  case 'continue':t.disabled=true;t.textContent='Cargando…';load().then(s=>{if(!s||!s.fx){toast('No se ha podido leer la partida guardada.');renderStart();return;}boot(s);UI.view='home';render();});break;
  case 'newCareer':modal(`<h2>¿Nueva carrera?</h2><p>Se borrará la partida guardada en este navegador.</p><div class="row"><button class="btn danger" data-act="confirmNew">Sí, empezar de cero</button><button class="btn" data-close>Cancelar</button></div>`);break;
  case 'confirmNew':clearTimeout(saveTimer);saveSeq++;try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(META_KEY);}catch(e){}S=null;UI.newClub=null;closeModal();render();break;
  case 'play':previewMatch(true);break;
  case 'sim':previewMatch(false);break;
  case 'startmatch':closeModal();startMatch(t.dataset.live==='1');break;
  case 'simdays':startSim();break;
  case 'simstop':endSim('Simulación en pausa');break;
  case 'train':{const r=trainPlayer(id);if(!r)break;const p=P(id);render();
    modal(`<div class="pmodal">${card(p)}<div class="pinfo"><h2>${esc(p.name)}</h2><p style="color:var(--good);font-weight:600">+${r.gain.toFixed(2)}% de progreso de entrenamiento.</p>${r.up?`<p><b>¡Sube a ${p.ovr} de media!</b></p>`:''}<div class="trainbar"><span>+1</span><div class="bar"><i style="width:${p.training}%"></i></div><b>${Math.round(p.training)}%</b></div></div></div><div class="row" style="margin-top:14px"><button class="btn" data-close style="margin-left:auto">Cerrar</button></div>`,'wide');break;}
  case 'toEnd':busy(t,'Simulando…',()=>{let n=0;while(!S.seasonDone&&n++<400)processDay();save();});break;
  case 'pause':{const m=UI.match;m.paused=!m.paused;renderMatch();if(!m.paused)runTimer();break;}
  case 'speed':{const m=UI.match;m.speed=(m.speed+1)%3;runTimer();renderMatch();break;}
  case 'subs':UI.pendingSubOut=null;subsModal();break;
  case 'simEnd':{const m=UI.match;m.live=false;simToEnd(m);finalizeMatch(m);clearInterval(timer);renderMatch();break;}
  case 'finishMatch':finishUserMatch();break;
  case 'autoXI':{const c=me();c.lineup=bestXI(c.id,c.formation);UI.selSlot=null;save();render();break;}
  case 'endSeason':endSeason();save();render();break;
  case 'nextSeason':busy(t,'Preparando la temporada…',()=>beginNextSeason());break;
  case 'toFired':fired(S.lastSummary.reason);render();break;
  case 'toggleList':{const p=P(id);p.listed=!p.listed;save();render();playerModal(id);break;}
  case 'renew':{const p=P(id);const dem=Math.round(Math.max(p.wage*1.1,wageFor(p,me().rep))/500)*500;
    if(p.morale<35){modal(`<h2>${esc(p.name)}</h2><p>Su moral es demasiado baja: no quiere renovar ahora mismo.</p><button class="btn" data-close>Cerrar</button>`);break;}
    modal(`<h2>Renovar a ${esc(p.name)}</h2><p>Pide <b>${money(dem)}/sem</b> (ahora cobra ${money(p.wage)}). Contrato actual hasta el ${contractEnd(p)}.</p><div class="row"><label class="label" for="ryears">Años</label><select id="ryears">${[1,2,3,4,5].map(y=>`<option value="${y}" ${y===3?'selected':''}>${y} (hasta ${S.year+y})</option>`).join('')}</select>
     <button class="btn primary" data-act="doRenew" data-id="${p.id}" data-w="${dem}">Firmar renovación</button><button class="btn" data-close>Cancelar</button></div>`);break;}
  case 'doRenew':{const p=P(id);const w=+t.dataset.w;const c=me();if(wageBill(c.id)-p.wage+w>c.wageBudget){toast('Superas el límite salarial.');break;}p.wage=w;p.contract=+document.getElementById('ryears').value;p.morale=clamp(p.morale+8,0,100);save();closeModal();toast(`${esc(p.name)} renueva hasta el ${contractEnd(p)}`);render();break;}
  case 'release':{const p=P(id);const cost=Math.round(p.wage*38*p.contract*0.5);modal(`<h2>Rescindir a ${esc(p.name)}</h2><p>La indemnización cuesta <b>${money(cost)}</b> del presupuesto de fichajes.</p><div class="row"><button class="btn danger" data-act="doRelease" data-id="${id}" data-cost="${cost}">Rescindir</button><button class="btn" data-close>Cancelar</button></div>`);break;}
  case 'doRelease':{const p=P(id);const c=me();c.budget-=+t.dataset.cost;p.clubId=null;p.contract=0;p.listed=false;invalidate();if(c.lineup)c.lineup=c.lineup.map(x=>x===id?null:x);addNews('Rescisión: '+esc(p.name),`${esc(p.name)} queda libre tras rescindir su contrato.`,'info');save();closeModal();render();break;}
  case 'promote':{const p=P(id);p.youth=false;p.contract=3;p.wage=Math.max(2000,wageFor(p,me().rep));invalidate();assignNumbers(p.clubId);save();closeModal();toast(`${esc(p.name)} sube al primer equipo`);render();break;}
  case 'releaseYouth':{delete S.players[id];invalidate();save();closeModal();render();break;}
  case 'scout':{const lv=+document.getElementById('sc-lv').value;const region=document.getElementById('sc-region').value;const c=me();const cost=SCOUT_LV[lv].cost;
    if(c.budget<cost){toast('Presupuesto insuficiente.');break;}c.budget-=cost;S.scout={lv,region,days:21};save();render();toast('Ojeador enviado: '+REGIONS[region]);break;}
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
    if(w<dem*0.9){const k='w'+p.id+'-'+S.year;S.neg[k]=(S.neg[k]||0)+1;if(S.neg[k]>=3){closeModal();toast(`${esc(p.name)} rompe las negociaciones.`);if(fee)askingPrice(p).agreed=0;break;}bidModal(id,'contract',{fee,msg:`${p.name} rechaza la propuesta. Quiere cerca de ${money(dem)}/sem.`});break;}
    if(fee>c.budget){toast('Presupuesto insuficiente.');break;}
    signPlayer(p,fee,w,y);closeModal();toast(`¡${esc(p.name)} es nuevo jugador de ${esc(c.name)}!`);render();playerModal(p.id);break;}
  case 'acceptOffer':{const n=S.news.find(x=>x.id===id);const p=P(n.data.pid);sellPlayer(p,n.data.cid,n.data.fee);n.done='Aceptada · '+money(n.data.fee);save();closeModal();render();break;}
  case 'rejectOffer':{const n=S.news.find(x=>x.id===id);n.done='Rechazada';const p=P(n.data.pid);if(p)p.morale=clamp(p.morale-(p.listed?0:4),0,100);save();closeModal();render();break;}
  case 'counterOffer':counterModal(id);break;
  case 'acceptLast':{const n=S.news.find(x=>x.id===id);const p=P(n.data.pid);sellPlayer(p,n.data.cid,n.data.lastOffer);n.done='Venta cerrada · '+money(n.data.lastOffer);save();closeModal();render();break;}
  case 'sendCounter':{const n=S.news.find(x=>x.id===id);const p=P(n.data.pid);const b=S.clubs[n.data.cid];const ask=Math.max(0,Math.round(+document.getElementById('ask').value||0));
    if(!p||p.clubId!==S.user.clubId){closeModal();break;}
    if(!n.data.maxPay)n.data.maxPay=Math.min(b.budget,roundMoney(Math.max(n.data.fee,valueOf(p)*(1.15+R()*0.45))));
    n.data.tries=(n.data.tries||0)+1;
    if(ask<=n.data.maxPay){sellPlayer(p,n.data.cid,ask);n.done='Venta cerrada · '+money(ask);closeModal();toast(`${esc(b.name)} acepta pagar ${money(ask)}`);save();render();break;}
    if(n.data.tries>=3||ask>n.data.maxPay*1.35){n.done='El club comprador se retira';closeModal();toast(`${esc(b.name)} se retira de la negociación`);save();render();break;}
    n.data.lastOffer=n.data.maxPay;save();counterModal(id,`${b.name} considera excesivo ese precio. Su última oferta es ${money(n.data.maxPay)}.`,true);break;}
  case 'export':{packSave().then(txt=>{const box=document.getElementById('exportBox');if(box){box.hidden=false;box.value=txt;box.select();}
    try{const blob=new Blob([txt],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='modo-carrera-'+seasonLabel().replace('/','-')+'.txt';a.click();}catch(e){}
    try{navigator.clipboard.writeText(txt).then(()=>toast('Partida copiada al portapapeles'),()=>{});}catch(e){}});break;}
  }
}
render();

"""Genera modo-carrera/data.js a partir de la base FC26 (thompgt/fc26-player-analysis)
y de los presupuestos de clubes del proyecto Carrera Entrenador V24.

Uso: python3 tools/build_data.py players_fc26_clean.csv clubs.seed.json > data.js
"""
import csv, json, sys, re, unicodedata, hashlib, random

CSV, SEED = sys.argv[1], sys.argv[2]
random.seed(26)

def norm(s):
    return re.sub('[^a-z0-9]', '', unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower())

# División: (id, nombre, país, nivel, liga en CSV, clubes excluidos, ascensos/descensos)
DIVS = [
    ('es1', 'LaLiga EA Sports', 'España', 1, 'La Liga', 3),
    ('es2', 'LaLiga Hypermotion', 'España', 2, 'La Liga 2', 3),
    ('en1', 'Premier League', 'Inglaterra', 1, 'Premier League', 3),
    ('en2', 'Championship', 'Inglaterra', 2, 'Championship', 3),
    ('it1', 'Serie A', 'Italia', 1, 'Serie A', 3),
    ('it2', 'Serie B', 'Italia', 2, 'Serie B', 3),
    ('de1', 'Bundesliga', 'Alemania', 1, 'Bundesliga', 2),
    ('de2', '2. Bundesliga', 'Alemania', 2, '2. Bundesliga', 2),
    ('fr1', 'Ligue 1', 'Francia', 1, 'Ligue 1', 2),
    ('fr2', 'Ligue 2', 'Francia', 2, 'Ligue 2', 2),
]
EXCLUDE = {'Dynamo Kyiv', 'Shakhtar Donetsk', 'Barcelona de Guayaquil', 'Independiente del Valle', 'LDU Quito',
           'Mushuc Runa', 'Universidad Católica del Ecuador', 'Blau-Weiß Linz', 'FC Red Bull Salzburg', 'FK Austria Wien',
           'Grazer AK 1902', 'LASK Linz', 'SC Rheindorf Altach', 'SK Rapid', 'SK Sturm Graz', 'SV Ried', 'TSV Hartberg',
           'WSG Tirol', 'Wolfsberger AC'}

# nombre CSV -> (nombre mostrado, abreviatura, color1, color2, estadio)
TOP = {
 'Real Madrid':('Real Madrid','RMA','#f5f5f5','#d4af37','Santiago Bernabéu'),
 'FC Barcelona':('FC Barcelona','FCB','#a50044','#004d98','Spotify Camp Nou'),
 'Atlético Madrid':('Atlético de Madrid','ATM','#cb3524','#ffffff','Riyadh Air Metropolitano'),
 'Athletic Club':('Athletic Club','ATH','#ee2523','#ffffff','San Mamés'),
 'Villarreal CF':('Villarreal CF','VIL','#ffe667','#005187','Estadio de la Cerámica'),
 'Real Betis Balompié':('Real Betis','BET','#0bb363','#ffffff','Estadio de La Cartuja'),
 'Real Sociedad':('Real Sociedad','RSO','#0067b1','#ffffff','Reale Arena'),
 'Sevilla FC':('Sevilla FC','SEV','#ffffff','#d70f21','Ramón Sánchez-Pizjuán'),
 'Valencia CF':('Valencia CF','VCF','#ffffff','#111111','Mestalla'),
 'Getafe CF':('Getafe CF','GET','#005999','#ffffff','Coliseum'),
 'RC Celta':('Celta de Vigo','CEL','#8ac3ee','#ffffff','Abanca Balaídos'),
 'Rayo Vallecano':('Rayo Vallecano','RAY','#ffffff','#e53027','Estadio de Vallecas'),
 'RCD Mallorca':('RCD Mallorca','MLL','#e20613','#111111','Mallorca Son Moix'),
 'CA Osasuna':('CA Osasuna','OSA','#d91a21','#0a346f','El Sadar'),
 'Girona FC':('Girona FC','GIR','#cd2534','#ffffff','Montilivi'),
 'Deportivo Alavés':('Deportivo Alavés','ALA','#005bab','#ffffff','Mendizorroza'),
 'RCD Espanyol':('RCD Espanyol','ESP','#007fc8','#ffffff','RCDE Stadium'),
 'Levante UD':('Levante UD','LEV','#0057a8','#a8123e','Ciutat de València'),
 'Elche CF':('Elche CF','ELC','#ffffff','#05642c','Martínez Valero'),
 'Real Oviedo':('Real Oviedo','OVI','#0047ab','#ffffff','Carlos Tartiere'),
 'Arsenal':('Arsenal','ARS','#ef0107','#ffffff','Emirates Stadium'),
 'Aston Villa':('Aston Villa','AVL','#670e36','#95bfe5','Villa Park'),
 'AFC Bournemouth':('AFC Bournemouth','BOU','#da291c','#111111','Vitality Stadium'),
 'Brentford':('Brentford','BRE','#e30613','#ffffff','Gtech Community Stadium'),
 'Brighton & Hove Albion':('Brighton','BHA','#0057b8','#ffffff','Amex Stadium'),
 'Burnley':('Burnley','BUR','#6c1d45','#99d6ea','Turf Moor'),
 'Chelsea':('Chelsea','CHE','#034694','#ffffff','Stamford Bridge'),
 'Crystal Palace':('Crystal Palace','CRY','#1b458f','#c4122e','Selhurst Park'),
 'Everton':('Everton','EVE','#003399','#ffffff','Hill Dickinson Stadium'),
 'Fulham FC':('Fulham','FUL','#ffffff','#111111','Craven Cottage'),
 'Leeds United':('Leeds United','LEE','#ffffff','#1d428a','Elland Road'),
 'Liverpool':('Liverpool','LIV','#c8102e','#00b2a9','Anfield'),
 'Manchester City':('Manchester City','MCI','#6cabdd','#ffffff','Etihad Stadium'),
 'Manchester United':('Manchester United','MUN','#da291c','#fbe122','Old Trafford'),
 'Newcastle United':('Newcastle United','NEW','#241f20','#ffffff',"St James' Park"),
 'Nottingham Forest':('Nottingham Forest','NFO','#dd0000','#ffffff','City Ground'),
 'Sunderland':('Sunderland','SUN','#eb172b','#ffffff','Stadium of Light'),
 'Tottenham Hotspur':('Tottenham Hotspur','TOT','#ffffff','#132257','Tottenham Hotspur Stadium'),
 'West Ham United':('West Ham United','WHU','#7a263a','#1bb1e7','London Stadium'),
 'Wolverhampton Wanderers':('Wolverhampton','WOL','#fdb913','#231f20','Molineux'),
 'AC Milan':('AC Milan','MIL','#fb090b','#111111','San Siro'),
 'Atalanta':('Atalanta','ATA','#1e71b8','#111111','Gewiss Stadium'),
 'Bologna':('Bologna','BOL','#a21c26','#1a2f48',"Renato Dall'Ara"),
 'Cagliari':('Cagliari','CAG','#a50f2d','#002350','Unipol Domus'),
 'Como':('Como','COM','#1d3f8f','#ffffff','Giuseppe Sinigaglia'),
 'Cremonese':('Cremonese','CRE','#a6192e','#a0a0a0','Giovanni Zini'),
 'Fiorentina':('Fiorentina','FIO','#482e92','#ffffff','Artemio Franchi'),
 'Genoa':('Genoa','GEN','#a6192e','#002855','Luigi Ferraris'),
 'Hellas Verona FC':('Hellas Verona','VER','#002f6c','#ffd200','Marcantonio Bentegodi'),
 'Inter':('Inter','INT','#0068a8','#111111','San Siro'),
 'Juventus':('Juventus','JUV','#ffffff','#111111','Allianz Stadium'),
 'Lazio':('Lazio','LAZ','#87d8f7','#ffffff','Stadio Olimpico'),
 'Lecce':('Lecce','LEC','#ffd700','#d71920','Via del Mare'),
 'Napoli':('Napoli','NAP','#12a0d7','#ffffff','Diego Armando Maradona'),
 'Parma':('Parma','PAR','#ffd200','#1b3a8c','Ennio Tardini'),
 'Pisa':('Pisa','PIS','#111111','#1d4f91','Arena Garibaldi'),
 'Roma':('Roma','ROM','#8e1f2f','#f0bc42','Stadio Olimpico'),
 'Sassuolo':('Sassuolo','SAS','#00a752','#111111','Mapei Stadium'),
 'Torino':('Torino','TOR','#8a1e03','#ffffff','Olimpico Grande Torino'),
 'Udinese':('Udinese','UDI','#ffffff','#111111','Bluenergy Stadium'),
 '1. FC Heidenheim 1846':('1. FC Heidenheim','HDH','#e2001a','#003b79','Voith-Arena'),
 '1. FC Köln':('1. FC Köln','KOE','#ffffff','#ed1c24','RheinEnergieStadion'),
 '1. FC Union Berlin':('Union Berlin','FCU','#d4011d','#ffffff','An der Alten Försterei'),
 '1. FSV Mainz 05':('Mainz 05','M05','#c3141e','#ffffff','Mewa Arena'),
 'Bayer 04 Leverkusen':('Bayer Leverkusen','B04','#e32221','#111111','BayArena'),
 'Borussia Dortmund':('Borussia Dortmund','BVB','#fde100','#111111','Signal Iduna Park'),
 'Borussia Mönchengladbach':("Borussia M'gladbach",'BMG','#ffffff','#00a650','Borussia-Park'),
 'Eintracht Frankfurt':('Eintracht Frankfurt','SGE','#111111','#e1000f','Deutsche Bank Park'),
 'FC Augsburg':('FC Augsburg','FCA','#ba3733','#46714d','WWK Arena'),
 'FC Bayern München':('Bayern de Múnich','BAY','#dc052d','#0066b2','Allianz Arena'),
 'FC St. Pauli':('FC St. Pauli','STP','#624839','#ffffff','Millerntor-Stadion'),
 'Hamburger SV':('Hamburger SV','HSV','#ffffff','#0a3f86','Volksparkstadion'),
 'RB Leipzig':('RB Leipzig','RBL','#ffffff','#dd0741','Red Bull Arena'),
 'SC Freiburg':('SC Freiburg','SCF','#e2001a','#111111','Europa-Park Stadion'),
 'SV Werder Bremen':('Werder Bremen','SVW','#1d9053','#ffffff','Weserstadion'),
 'TSG 1899 Hoffenheim':('Hoffenheim','TSG','#1961b5','#ffffff','PreZero Arena'),
 'VfB Stuttgart':('VfB Stuttgart','VFB','#ffffff','#e32219','MHPArena'),
 'VfL Wolfsburg':('VfL Wolfsburg','WOB','#65b32e','#ffffff','Volkswagen Arena'),
 'AJ Auxerre':('AJ Auxerre','AJA','#ffffff','#0b4ea2','Abbé-Deschamps'),
 'AS Monaco':('AS Monaco','ASM','#e51b22','#ffffff','Stade Louis II'),
 'Angers SCO':('Angers SCO','SCO','#111111','#ffffff','Raymond Kopa'),
 'FC Lorient':('FC Lorient','FCL','#f58113','#111111','Stade du Moustoir'),
 'FC Metz':('FC Metz','FCM','#7a1f3d','#ffffff','Saint-Symphorien'),
 'FC Nantes':('FC Nantes','FCN','#fcd405','#00915a','La Beaujoire'),
 'Le Havre AC':('Le Havre AC','HAC','#88bfe9','#00305e','Stade Océane'),
 'Lille OSC':('Lille OSC','LOS','#e01e13','#20325f','Pierre-Mauroy'),
 'OGC Nice':('OGC Nice','NIC','#e10b17','#111111','Allianz Riviera'),
 'Olympique Lyonnais':('Olympique de Lyon','OL','#ffffff','#1a3e8a','Groupama Stadium'),
 'Olympique de Marseille':('Olympique de Marsella','OM','#ffffff','#2faee0','Vélodrome'),
 'Paris FC':('Paris FC','PFC','#1b2f5d','#ffffff','Stade Jean-Bouin'),
 'Paris Saint-Germain':('Paris Saint-Germain','PSG','#004170','#da291c','Parc des Princes'),
 'RC Lens':('RC Lens','RCL','#ffd600','#e30613','Bollaert-Delelis'),
 'RC Strasbourg Alsace':('RC Strasbourg','RCS','#009fe3','#ffffff','Stade de la Meinau'),
 'Stade Brestois 29':('Stade Brestois','SB29','#e30613','#ffffff','Francis-Le Blé'),
 'Stade Rennais FC':('Stade Rennais','SRFC','#e13327','#111111','Roazhon Park'),
 'Toulouse FC':('Toulouse FC','TFC','#5b2c86','#ffffff','Stadium de Toulouse'),
}
SEED_ALIAS = {'Atlético Madrid':'Atlético de Madrid','RC Celta':'Celta de Vigo','Real Betis Balompié':'Real Betis',
              'FC Bayern München':'Bayern München','Fulham FC':'Fulham','Brighton & Hove Albion':'Brighton',
              'Wolverhampton Wanderers':'Wolves','Hellas Verona FC':'Verona','Olympique Lyonnais':'Lyon',
              'Olympique de Marseille':'Marseille','Paris Saint-Germain':'Paris Saint-Germain'}

POSMAP = {'GK':'POR','CB':'DFC','RB':'LD','RWB':'LD','LB':'LI','LWB':'LI','CDM':'MCD','CM':'MC','CAM':'MCO',
          'RM':'ED','RW':'ED','LM':'EI','LW':'EI','ST':'DC','CF':'DC'}

rows = list(csv.DictReader(open(CSV, encoding='utf-8')))
seed = {norm(c['name']): c['budget'] for c in json.load(open(SEED, encoding='utf-8'))}

def color_for(name):
    h = hashlib.md5(name.encode()).digest()
    pal = ['#c8102e','#0047ab','#111111','#ffffff','#ffd200','#0b7a3b','#6a2c91','#e86a10','#7a1630','#3aa0dc','#1d3f8f']
    a = pal[h[0] % len(pal)]; b = pal[h[1] % len(pal)]
    if a == b: b = '#ffffff' if a != '#ffffff' else '#111111'
    return a, b

STOP = {'fc','cf','sc','ac','as','ud','cd','rc','rcd','sd','ss','ssc','us','afc','sv','vfl','vfb','tsg','fsv','1','sporting','real','club','de','city','united','town'}
def short_for(name, used):
    words = [w for w in re.split(r'[\s\.\-]+', name) if w]
    core = [w for w in words if norm(w) not in STOP and not w.isdigit()] or words
    base = norm(core[0]).upper()
    cand = base[:3]
    if cand in used and len(core) > 1:
        cand = (base[:2] + norm(core[1])[:1]).upper()
    i = 3
    while cand in used and i < len(base):
        cand = base[:2] + base[i].upper(); i += 1
    used.add(cand)
    return cand

def num(v):
    try:
        return int(round(float(v)))
    except Exception:
        return 0

clubs, club_idx, players, nats, nat_idx = [], {}, [], [], {}
used_short = set(v[1] for v in TOP.values())
divs_out = []

def add_club(name, div, league_label):
    if name in club_idx: return club_idx[name]
    if name in TOP:
        disp, short, c1, c2, stad = TOP[name]
    else:
        disp, stad = name, ''
        short = short_for(name, used_short)
        c1, c2 = color_for(name)
    club_idx[name] = len(clubs)
    clubs.append({'n': disp, 's': short, 'c1': c1, 'c2': c2, 'st': stad, 'd': div, 'l': league_label, 'src': name})
    return club_idx[name]

def nat(n):
    if n not in nat_idx:
        nat_idx[n] = len(nats); nats.append(n)
    return nat_idx[n]

def add_player(r, ci):
    pos = []
    for x in r['player_positions'].split(','):
        m = POSMAP.get(x.strip())
        if m and m not in pos: pos.append(m)
    if not pos: pos = ['MC']
    st = [num(r[k]) for k in ('pace','shooting','passing','dribbling','defending','physic')]
    foot = 1 if r['preferred_foot'] == 'Left' else 0
    players.append([r['short_name'], '/'.join(pos), num(r['overall']), num(r['potential']), num(r['value_eur']),
                    num(r['wage_eur']), num(r['age']), nat(r['nationality_name']), ci] + st + [foot])

for di, (did, dname, country, tier, csvl, swap) in enumerate(DIVS):
    ids = []
    for r in rows:
        if r['league_name'] == csvl and r['club_name'] and r['club_name'] not in EXCLUDE:
            ci = add_club(r['club_name'], di, dname)
            if ci not in ids: ids.append(ci)
            add_player(r, ci)
    divs_out.append({'id': did, 'n': dname, 'c': country, 't': tier, 'sw': swap, 'clubs': ids})

# Mercado internacional: jugadores de otras ligas con media >= 70 y agentes libres >= 60
in_divs = {d[4] for d in DIVS}
div_clubs = set(club_idx)
for r in rows:
    if r['club_name'] in div_clubs: continue
    ovr = num(r['overall'])
    if not r['club_name']:
        if ovr >= 60: add_player(r, -1)
        continue
    if r['league_name'] in in_divs or r['club_name'] in EXCLUDE:
        if ovr < 70: continue
    elif ovr < 70:
        continue
    ci = add_club(r['club_name'], -1, r['league_name'] or 'Internacional')
    add_player(r, ci)

# Presupuestos: los del proyecto V24 cuando existen; si no, la fórmula de sync-data.mjs
from collections import defaultdict
sq = defaultdict(list)
for p in players:
    if p[8] >= 0: sq[p[8]].append(p)
for i, c in enumerate(clubs):
    s = sq[i]
    b = seed.get(norm(SEED_ALIAS.get(c['src'], c['src'])))
    if b is None:
        value = sum(p[4] for p in s)
        ovr = sum(p[2] for p in s) / len(s) if s else 65
        factor = max(0.08, min(0.55, (ovr - 55) / 100))
        b = max(1500000, value * factor)
        if c['d'] >= 0 and DIVS[c['d']][3] == 2: b *= 0.45
    c['b'] = int(round(b / 100000) * 100000)
    c['w'] = int(round(sum(p[5] for p in s) * 1.08 / 1000) * 1000)
    del c['src']

out = {'season': '2025/26', 'source': 'EA SPORTS FC 26 · github.com/thompgt/fc26-player-analysis',
       'divs': divs_out, 'clubs': clubs, 'nats': nats, 'players': players}
sys.stdout.write('window.DB=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
sys.stderr.write(f"clubs {len(clubs)} players {len(players)} divs {[ (d['id'],len(d['clubs'])) for d in divs_out]}\n")

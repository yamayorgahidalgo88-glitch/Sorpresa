"""Genera los datos del juego (data.js y assets/crests.webp) para la temporada 2026/27.

Fuentes:
  - Jugadores: players_fc26_clean.csv (github.com/thompgt/fc26-player-analysis), igual que Carrera Entrenador V24.
  - Calendarios 2026/27: openfootball/football.json (es.1, en.1, en.2, it.1, de.1, fr.1). Las ligas sin
    calendario público se generan con fechas de fin de semana.
  - Competiciones UEFA 2026/27: participantes y fechas de la fase liga de Carrera Entrenador V24.
  - Presupuestos: clubs.seed.json de V24; para el resto, la fórmula de sync-data.mjs.
  - Escudos: github.com/luukhopman/football-logos (logos 2026/27 e historial).
  - Caras: índice generado por tools/build_faces.py (opcional).

Uso:
  python3 tools/build_data.py --csv players.csv --seed clubs.seed.json --fixtures dir/ --logos repo/ [--faces faces_index.json] --out modo-carrera/
"""
import argparse, csv, datetime as dt, hashlib, json, os, re, sys
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(__file__))
from names import Matcher, norm, core

ap = argparse.ArgumentParser()
ap.add_argument('--csv', required=True); ap.add_argument('--seed', required=True)
ap.add_argument('--fixtures', required=True); ap.add_argument('--logos', required=True)
ap.add_argument('--faces'); ap.add_argument('--badges'); ap.add_argument('--out', required=True)
A = ap.parse_args()

rows = [r for r in csv.DictReader(open(A.csv, encoding='utf-8'))]
by_club = defaultdict(list)
club_league = {}
for r in rows:
    if r['club_name']:
        by_club[r['club_name']].append(r)
        club_league[r['club_name']] = r['league_name']
M = Matcher(sorted(by_club))

def num(v):
    try: return int(round(float(v)))
    except Exception: return 0

# ---------------------------------------------------------------- divisiones 2026/27
DIVS = [  # id, nombre, país, nivel, feed, liga FC26, ascensos/descensos, tamaño
    ('es1', 'LaLiga EA Sports', 'España', 1, 'es.1', 'La Liga', 3, 20),
    ('es2', 'LaLiga Hypermotion', 'España', 2, 'es.2', 'La Liga 2', 3, 22),
    ('en1', 'Premier League', 'Inglaterra', 1, 'en.1', 'Premier League', 3, 20),
    ('en2', 'Championship', 'Inglaterra', 2, 'en.2', 'Championship', 3, 24),
    ('it1', 'Serie A', 'Italia', 1, 'it.1', 'Serie A', 3, 20),
    ('it2', 'Serie B', 'Italia', 2, 'it.2', 'Serie B', 3, 20),
    ('de1', 'Bundesliga', 'Alemania', 1, 'de.1', 'Bundesliga', 2, 18),
    ('de2', '2. Bundesliga', 'Alemania', 2, 'de.2', '2. Bundesliga', 2, 18),
    ('fr1', 'Ligue 1', 'Francia', 1, 'fr.1', 'Ligue 1', 2, 18),
    ('fr2', 'Ligue 2', 'Francia', 2, 'fr.2', 'Ligue 2', 2, 18),
]
EXCLUDE = {'Dynamo Kyiv', 'Shakhtar Donetsk', 'Barcelona de Guayaquil', 'Independiente del Valle', 'LDU Quito',
           'Mushuc Runa', 'Universidad Católica del Ecuador', 'Blau-Weiß Linz', 'FC Red Bull Salzburg', 'FK Austria Wien',
           'Grazer AK 1902', 'LASK Linz', 'SC Rheindorf Altach', 'SK Rapid', 'SK Sturm Graz', 'SV Ried', 'TSV Hartberg',
           'WSG Tirol', 'Wolfsberger AC'}

def level(club):
    s = sorted((num(r['overall']) for r in by_club[club]), reverse=True)[:11]
    return sum(s) / len(s) if s else 60

def load_feed(code):
    p = os.path.join(A.fixtures, code + '.json')
    if not os.path.exists(p): return None
    d = json.load(open(p, encoding='utf-8'))
    out = []
    for m in d.get('matches', []):
        h, a = M.find(m['team1']), M.find(m['team2'])
        if not h or not a: sys.exit(f'Equipo sin emparejar en {code}: {m["team1"]} / {m["team2"]}')
        rn = int(re.sub(r'\D', '', m.get('round', '0')) or 0)
        out.append((m['date'], rn, h, a))
    return out

feeds = {d[0]: load_feed(d[4]) for d in DIVS}
div_clubs = {}
for did, name, country, tier, code, fcl, sw, size in DIVS:
    if feeds[did]:
        div_clubs[did] = sorted({f[2] for f in feeds[did]} | {f[3] for f in feeds[did]})
in_feed = {c for v in div_clubs.values() for c in v}
for did, name, country, tier, code, fcl, sw, size in DIVS:
    if did in div_clubs: continue
    top = next(d for d in DIVS if d[2] == country and d[3] == 1)
    base = [c for c, l in club_league.items() if l == fcl and c not in EXCLUDE and c not in in_feed]
    relegated = [c for c, l in club_league.items() if l == top[5] and c not in EXCLUDE and c not in in_feed]
    keep = sorted(base, key=level, reverse=True)[:max(0, size - len(relegated))]
    div_clubs[did] = sorted(set(keep) | set(relegated))
    in_feed |= set(div_clubs[did])

def weekend_dates(n, start='2026-08-15', end='2027-05-30'):
    s, e = dt.date.fromisoformat(start), dt.date.fromisoformat(end)
    out = []
    for i in range(n):
        d = s + dt.timedelta(days=round(i * (e - s).days / max(1, n - 1)))
        while d.weekday() not in (5, 6): d -= dt.timedelta(days=1)
        out.append(d.isoformat())
    return out

# ---------------------------------------------------------------- competiciones UEFA (V24)
EURO = {
 'ucl': ('UEFA Champions League', ['2026-09-08','2026-10-13','2026-10-20','2026-11-03','2026-11-24','2026-12-08','2027-01-20','2027-01-27'],
         {'po':['2027-02-16','2027-02-23'],'r16':['2027-03-09','2027-03-16'],'qf':['2027-04-06','2027-04-13'],'sf':['2027-04-27','2027-05-04'],'f':['2027-05-29']},
         ['Arsenal','Aston Villa','Liverpool','Manchester City','Manchester United','Real Madrid','Barcelona','Atlético Madrid','Real Betis','Villarreal','Bayern Munich','Borussia Dortmund','Leipzig','Stuttgart','Paris Saint-Germain','Lille','Lens','Inter','Napoli','Roma','Como','Porto','Sporting CP','Feyenoord','PSV','Club Brugge','Slavia Praha','Galatasaray','Fenerbahçe','AEK Athens','Bodø/Glimt','Viking','Slovan Bratislava','Shakhtar','LASK','Sabah']),
 'uel': ('UEFA Europa League', ['2026-09-16','2026-10-15','2026-10-22','2026-11-05','2026-11-26','2026-12-10','2027-01-21','2027-01-28'],
         {'po':['2027-02-18','2027-02-25'],'r16':['2027-03-11','2027-03-18'],'qf':['2027-04-08','2027-04-15'],'sf':['2027-04-29','2027-05-06'],'f':['2027-05-19']},
         ['Bournemouth','Sunderland','Crystal Palace','Milan','Juventus','Real Sociedad','Celta Vigo','Hoffenheim','Bayer 04 Leverkusen','Marseille','Rennes','AZ Alkmaar','Torreense','Celje','Celtic','GNK Dinamo','Hapoel Beer Sheva','Levski Sofia','Lyon','NEC Nijmegen','Olympiacos','Sparta Praha','Sturm Graz','Union Saint-Gilloise','Anderlecht','Ararat-Armenia','Benfica','Besiktas','Ferencvaros','Jagiellonia','Lech Poznan','Lillestrom','OFI Crete','Omonia','Salzburg','Viktoria Plzen']),
 'uecl': ('UEFA Conference League', ['2026-10-15','2026-10-22','2026-11-05','2026-11-26','2026-12-10','2026-12-17'],
         {'po':['2027-02-18','2027-02-25'],'r16':['2027-03-11','2027-03-18'],'qf':['2027-04-08','2027-04-15'],'sf':['2027-04-29','2027-05-06'],'f':['2027-05-26']},
         ['Brighton','Atalanta','Getafe','Freiburg','Monaco','Braga','Ajax','Twente','Gent','Sint-Truiden','Trabzonspor','Jablonec','Panathinaikos','Aarhus','Copenhagen','Midtjylland','Nordsjaelland','Brann','Pafos','Lugano','Thun','Hearts','Mjallby','Hajduk Split','Crvena Zvezda','Universitatea Craiova','Kairat Almaty','CSKA Sofia','KuPS Kuopio','Borac','Riga','Egnatia','Kauno Zalgiris','Lincoln Red Imps','Inter Escaldes','Iberia Tbilisi']),
}
# clubes europeos sin plantilla en FC26: (nombre, país, nacionalidad, nivel)
GEN = {'Slovan Bratislava':('Slovan Bratislava','Eslovaquia','Slovakia',67),'Sabah':('Sabah FK','Azerbaiyán','Azerbaijan',63),
 'Torreense':('SC Torreense','Portugal','Portugal',64),'Celje':('NK Celje','Eslovenia','Slovenia',63),'Hapoel Beer Sheva':("Hapoel Be'er Sheva",'Israel','Israel',65),
 'Levski Sofia':('Levski Sofia','Bulgaria','Bulgaria',63),'Ararat-Armenia':('Ararat-Armenia','Armenia','Armenia',60),'Lillestrom':('Lillestrøm SK','Noruega','Norway',64),
 'OFI Crete':('OFI Creta','Grecia','Greece',64),'Omonia':('Omonia Nicosia','Chipre','Cyprus',64),'Jablonec':('FK Jablonec','Chequia','Czechia',64),
 'Pafos':('Pafos FC','Chipre','Cyprus',66),'Crvena Zvezda':('Estrella Roja','Serbia','Serbia',69),'Kairat Almaty':('Kairat Almaty','Kazajistán','Kazakhstan',62),
 'CSKA Sofia':('CSKA Sofia','Bulgaria','Bulgaria',63),'KuPS Kuopio':('KuPS Kuopio','Finlandia','Finland',60),'Borac':('Borac Banja Luka','Bosnia','Bosnia and Herzegovina',60),
 'Riga':('Riga FC','Letonia','Latvia',60),'Egnatia':('KF Egnatia','Albania','Albania',58),'Kauno Zalgiris':('Kauno Žalgiris','Lituania','Lithuania',59),
 'Lincoln Red Imps':('Lincoln Red Imps','Gibraltar','Gibraltar',54),'Inter Escaldes':("Inter Club d'Escaldes",'Andorra','Andorra',54),'Iberia Tbilisi':('Iberia 1999','Georgia','Georgia',60)}

# nombre CSV -> (nombre mostrado, abreviatura, color1, color2, estadio)
TOP = {
 'Real Madrid':('Real Madrid','RMA','#f5f5f5','#d4af37','Santiago Bernabéu'),'FC Barcelona':('FC Barcelona','FCB','#a50044','#004d98','Spotify Camp Nou'),
 'Atlético Madrid':('Atlético de Madrid','ATM','#cb3524','#ffffff','Riyadh Air Metropolitano'),'Athletic Club':('Athletic Club','ATH','#ee2523','#ffffff','San Mamés'),
 'Villarreal CF':('Villarreal CF','VIL','#ffe667','#005187','Estadio de la Cerámica'),'Real Betis Balompié':('Real Betis','BET','#0bb363','#ffffff','Benito Villamarín'),
 'Real Sociedad':('Real Sociedad','RSO','#0067b1','#ffffff','Reale Arena'),'Sevilla FC':('Sevilla FC','SEV','#ffffff','#d70f21','Ramón Sánchez-Pizjuán'),
 'Valencia CF':('Valencia CF','VCF','#ffffff','#111111','Mestalla'),'Getafe CF':('Getafe CF','GET','#005999','#ffffff','Coliseum'),
 'RC Celta':('Celta de Vigo','CEL','#8ac3ee','#ffffff','Abanca Balaídos'),'Rayo Vallecano':('Rayo Vallecano','RAY','#ffffff','#e53027','Estadio de Vallecas'),
 'RCD Mallorca':('RCD Mallorca','MLL','#e20613','#111111','Mallorca Son Moix'),'CA Osasuna':('CA Osasuna','OSA','#d91a21','#0a346f','El Sadar'),
 'Girona FC':('Girona FC','GIR','#cd2534','#ffffff','Montilivi'),'Deportivo Alavés':('Deportivo Alavés','ALA','#005bab','#ffffff','Mendizorroza'),
 'RCD Espanyol':('RCD Espanyol','ESP','#007fc8','#ffffff','RCDE Stadium'),'Levante UD':('Levante UD','LEV','#0057a8','#a8123e','Ciutat de València'),
 'Elche CF':('Elche CF','ELC','#ffffff','#05642c','Martínez Valero'),'Real Oviedo':('Real Oviedo','OVI','#0047ab','#ffffff','Carlos Tartiere'),
 'Málaga CF':('Málaga CF','MAL','#1b75bb','#ffffff','La Rosaleda'),'RC Deportivo de La Coruña':('Deportivo de La Coruña','DEP','#1b5fae','#ffffff','Abanca Riazor'),
 'Racing Santander':('Racing de Santander','RAC','#ffffff','#0b8a3e','El Sardinero'),
 'Arsenal':('Arsenal','ARS','#ef0107','#ffffff','Emirates Stadium'),'Aston Villa':('Aston Villa','AVL','#670e36','#95bfe5','Villa Park'),
 'AFC Bournemouth':('AFC Bournemouth','BOU','#da291c','#111111','Vitality Stadium'),'Brentford':('Brentford','BRE','#e30613','#ffffff','Gtech Community Stadium'),
 'Brighton & Hove Albion':('Brighton','BHA','#0057b8','#ffffff','Amex Stadium'),'Burnley':('Burnley','BUR','#6c1d45','#99d6ea','Turf Moor'),
 'Chelsea':('Chelsea','CHE','#034694','#ffffff','Stamford Bridge'),'Crystal Palace':('Crystal Palace','CRY','#1b458f','#c4122e','Selhurst Park'),
 'Everton':('Everton','EVE','#003399','#ffffff','Hill Dickinson Stadium'),'Fulham FC':('Fulham','FUL','#ffffff','#111111','Craven Cottage'),
 'Leeds United':('Leeds United','LEE','#ffffff','#1d428a','Elland Road'),'Liverpool':('Liverpool','LIV','#c8102e','#00b2a9','Anfield'),
 'Manchester City':('Manchester City','MCI','#6cabdd','#ffffff','Etihad Stadium'),'Manchester United':('Manchester United','MUN','#da291c','#fbe122','Old Trafford'),
 'Newcastle United':('Newcastle United','NEW','#241f20','#ffffff',"St James' Park"),'Nottingham Forest':('Nottingham Forest','NFO','#dd0000','#ffffff','City Ground'),
 'Sunderland':('Sunderland','SUN','#eb172b','#ffffff','Stadium of Light'),'Tottenham Hotspur':('Tottenham Hotspur','TOT','#ffffff','#132257','Tottenham Hotspur Stadium'),
 'West Ham United':('West Ham United','WHU','#7a263a','#1bb1e7','London Stadium'),'Wolverhampton Wanderers':('Wolverhampton','WOL','#fdb913','#231f20','Molineux'),
 'Coventry City':('Coventry City','COV','#77b5e1','#ffffff','Coventry Building Society Arena'),'Hull City':('Hull City','HUL','#f5a12d','#111111','MKM Stadium'),
 'Ipswich Town':('Ipswich Town','IPS','#0044a9','#ffffff','Portman Road'),
 'AC Milan':('AC Milan','MIL','#fb090b','#111111','San Siro'),'Atalanta':('Atalanta','ATA','#1e71b8','#111111','Gewiss Stadium'),
 'Bologna':('Bologna','BOL','#a21c26','#1a2f48',"Renato Dall'Ara"),'Cagliari':('Cagliari','CAG','#a50f2d','#002350','Unipol Domus'),
 'Como':('Como','COM','#1d3f8f','#ffffff','Giuseppe Sinigaglia'),'Cremonese':('Cremonese','CRE','#a6192e','#a0a0a0','Giovanni Zini'),
 'Fiorentina':('Fiorentina','FIO','#482e92','#ffffff','Artemio Franchi'),'Genoa':('Genoa','GEN','#a6192e','#002855','Luigi Ferraris'),
 'Hellas Verona FC':('Hellas Verona','VER','#002f6c','#ffd200','Marcantonio Bentegodi'),'Inter':('Inter','INT','#0068a8','#111111','San Siro'),
 'Juventus':('Juventus','JUV','#ffffff','#111111','Allianz Stadium'),'Lazio':('Lazio','LAZ','#87d8f7','#ffffff','Stadio Olimpico'),
 'Lecce':('Lecce','LEC','#ffd700','#d71920','Via del Mare'),'Napoli':('Napoli','NAP','#12a0d7','#ffffff','Diego Armando Maradona'),
 'Parma':('Parma','PAR','#ffd200','#1b3a8c','Ennio Tardini'),'Pisa':('Pisa','PIS','#111111','#1d4f91','Arena Garibaldi'),
 'Roma':('Roma','ROM','#8e1f2f','#f0bc42','Stadio Olimpico'),'Sassuolo':('Sassuolo','SAS','#00a752','#111111','Mapei Stadium'),
 'Torino':('Torino','TOR','#8a1e03','#ffffff','Olimpico Grande Torino'),'Udinese':('Udinese','UDI','#ffffff','#111111','Bluenergy Stadium'),
 'Monza':('Monza','MON','#e2001a','#ffffff','U-Power Stadium'),'Frosinone':('Frosinone','FRO','#ffd200','#0047ab','Benito Stirpe'),'Venezia':('Venezia','VEN','#111111','#f26522','Pier Luigi Penzo'),
 '1. FC Heidenheim 1846':('1. FC Heidenheim','HDH','#e2001a','#003b79','Voith-Arena'),'1. FC Köln':('1. FC Köln','KOE','#ffffff','#ed1c24','RheinEnergieStadion'),
 '1. FC Union Berlin':('Union Berlin','FCU','#d4011d','#ffffff','An der Alten Försterei'),'1. FSV Mainz 05':('Mainz 05','M05','#c3141e','#ffffff','Mewa Arena'),
 'Bayer 04 Leverkusen':('Bayer Leverkusen','B04','#e32221','#111111','BayArena'),'Borussia Dortmund':('Borussia Dortmund','BVB','#fde100','#111111','Signal Iduna Park'),
 'Borussia Mönchengladbach':("Borussia M'gladbach",'BMG','#ffffff','#00a650','Borussia-Park'),'Eintracht Frankfurt':('Eintracht Frankfurt','SGE','#111111','#e1000f','Deutsche Bank Park'),
 'FC Augsburg':('FC Augsburg','FCA','#ba3733','#46714d','WWK Arena'),'FC Bayern München':('Bayern de Múnich','BAY','#dc052d','#0066b2','Allianz Arena'),
 'FC St. Pauli':('FC St. Pauli','STP','#624839','#ffffff','Millerntor-Stadion'),'Hamburger SV':('Hamburger SV','HSV','#ffffff','#0a3f86','Volksparkstadion'),
 'RB Leipzig':('RB Leipzig','RBL','#ffffff','#dd0741','Red Bull Arena'),'SC Freiburg':('SC Freiburg','SCF','#e2001a','#111111','Europa-Park Stadion'),
 'SV Werder Bremen':('Werder Bremen','SVW','#1d9053','#ffffff','Weserstadion'),'TSG 1899 Hoffenheim':('Hoffenheim','TSG','#1961b5','#ffffff','PreZero Arena'),
 'VfB Stuttgart':('VfB Stuttgart','VFB','#ffffff','#e32219','MHPArena'),'VfL Wolfsburg':('VfL Wolfsburg','WOB','#65b32e','#ffffff','Volkswagen Arena'),
 'FC Schalke 04':('Schalke 04','S04','#004d9d','#ffffff','Veltins-Arena'),'SC Paderborn 07':('SC Paderborn','SCP','#005ca9','#111111','Home Deluxe Arena'),
 'SV Elversberg':('SV Elversberg','SVE','#111111','#ffffff','Ursapharm-Arena'),
 'AJ Auxerre':('AJ Auxerre','AJA','#ffffff','#0b4ea2','Abbé-Deschamps'),'AS Monaco':('AS Monaco','ASM','#e51b22','#ffffff','Stade Louis II'),
 'Angers SCO':('Angers SCO','SCO','#111111','#ffffff','Raymond Kopa'),'FC Lorient':('FC Lorient','FCL','#f58113','#111111','Stade du Moustoir'),
 'FC Metz':('FC Metz','FCM','#7a1f3d','#ffffff','Saint-Symphorien'),'FC Nantes':('FC Nantes','FCN','#fcd405','#00915a','La Beaujoire'),
 'Le Havre AC':('Le Havre AC','HAC','#88bfe9','#00305e','Stade Océane'),'Lille OSC':('Lille OSC','LOS','#e01e13','#20325f','Pierre-Mauroy'),
 'OGC Nice':('OGC Nice','NIC','#e10b17','#111111','Allianz Riviera'),'Olympique Lyonnais':('Olympique de Lyon','OL','#ffffff','#1a3e8a','Groupama Stadium'),
 'Olympique de Marseille':('Olympique de Marsella','OM','#ffffff','#2faee0','Vélodrome'),'Paris FC':('Paris FC','PFC','#1b2f5d','#ffffff','Stade Jean-Bouin'),
 'Paris Saint-Germain':('Paris Saint-Germain','PSG','#004170','#da291c','Parc des Princes'),'RC Lens':('RC Lens','RCL','#ffd600','#e30613','Bollaert-Delelis'),
 'RC Strasbourg Alsace':('RC Strasbourg','RCS','#009fe3','#ffffff','Stade de la Meinau'),'Stade Brestois 29':('Stade Brestois','SB29','#e30613','#ffffff','Francis-Le Blé'),
 'Stade Rennais FC':('Stade Rennais','SRFC','#e13327','#111111','Roazhon Park'),'Toulouse FC':('Toulouse FC','TFC','#5b2c86','#ffffff','Stadium de Toulouse'),
 'ESTAC Troyes':('ESTAC Troyes','TRO','#0b5ea8','#ffffff','Stade de l\'Aube'),'Le Mans FC':('Le Mans FC','LMA','#e30613','#ffd200','Stade Marie-Marvingt'),
 'Sporting Clube de Braga':('SC Braga','BRA','#e30613','#ffffff','Estádio Municipal de Braga'),'Ferencvárosi Torna Club':('Ferencváros','FTC','#1d9053','#ffffff','Groupama Aréna'),
 'Club Brugge KV':('Club Brujas','BRU','#0060a9','#111111','Jan Breydel'),'FC Bayern':None,
}
TOP = {k: v for k, v in TOP.items() if v}
SEED_ALIAS = {'Atlético Madrid':'Atlético de Madrid','RC Celta':'Celta de Vigo','Real Betis Balompié':'Real Betis','FC Bayern München':'Bayern München',
              'Fulham FC':'Fulham','Brighton & Hove Albion':'Brighton','Wolverhampton Wanderers':'Wolves','Hellas Verona FC':'Verona',
              'Olympique Lyonnais':'Lyon','Olympique de Marseille':'Marseille'}
POSMAP = {'GK':'POR','CB':'DFC','RB':'LD','RWB':'LD','LB':'LI','LWB':'LI','CDM':'MCD','CM':'MC','CAM':'MCO',
          'RM':'ED','RW':'ED','LM':'EI','LW':'EI','ST':'DC','CF':'DC'}
seed = {norm(c['name']): c['budget'] for c in json.load(open(A.seed, encoding='utf-8'))}

# ---------------------------------------------------------------- escudos
crest_files, crest_country = {}, {}
for season in ['logos'] + ['history/' + s for s in sorted(os.listdir(os.path.join(A.logos, 'history')), reverse=True)]:
    base = os.path.join(A.logos, season)
    for league in sorted(os.listdir(base)):
        for f in sorted(os.listdir(os.path.join(base, league))):
            if f.endswith('.png'):
                crest_files.setdefault(f[:-4], os.path.join(base, league, f))
                crest_country.setdefault(f[:-4], league.split(' - ')[0])
CREST_ALIAS = {'Atlético Madrid':'Atlético de Madrid','RC Celta':'Celta de Vigo','RC Deportivo de La Coruña':'Deportivo A Coruña','Athletic Club':'Athletic Bilbao',
               'RCD Espanyol':'RCD Espanyol Barcelona','Inter':'Inter Milan','Sporting Clube de Braga':'SC Braga','Ferencvárosi Torna Club':'Ferencvárosi TC',
               'Crvena Zvezda':'Red Star Belgrade','Hearts':'Heart of Midlothian FC','Aarhus Gymnastikforening':'Aarhus GF','FC København':'FC Copenhagen',
               'Lillestrom':'Lillestrøm SK','Real Sociedad de Fútbol B':'Real Sociedad'}
COUNTRY_EN = {'España':'Spain','Inglaterra':'England','Italia':'Italy','Alemania':'Germany','Francia':'France'}
crest_norm = {}
crest_core = defaultdict(list)
for n in crest_files:
    crest_norm.setdefault(norm(n), n); crest_core[core(n)].append(n)

NO_CREST = {'Atlético Nacional','Barcelona de Guayaquil','Club Nacional de Football','Racing Club','SK Rapid','Vitória'}
badges = json.load(open(A.badges)) if A.badges and os.path.exists(A.badges) else {}
for k, v in badges.items():
    if v: crest_files['TSDB:' + k] = v if os.path.isabs(v) else os.path.join(os.path.dirname(os.path.abspath(A.badges)), v); crest_country['TSDB:' + k] = ''

def crest_for(*names, country=None):
    if any(n in NO_CREST for n in names if n): return None
    for n in names:
        if n and badges.get(n): return 'TSDB:' + n
    ok = lambda n: country is None or crest_country[n] == country
    names = [n for n in names if n]
    for n in names:
        a = CREST_ALIAS.get(n)
        if a and a in crest_files: return a
    for n in names:
        if n in crest_files and ok(n): return n
        h = crest_norm.get(norm(n))
        if h and ok(h): return h
    for n in names:
        hits = [h for h in crest_core.get(core(n), []) if ok(h)]
        if hits: return hits[0]
    for n in names:
        ct = set(core(n).split())
        if not ct: continue
        hits = [h for h in crest_files if ok(h) and (lambda t: t and (ct <= t or t <= ct))(set(core(h).split()))]
        if len({crest_files[h] for h in hits}) >= 1 and len({core(h) for h in hits}) == 1: return hits[0]
    return None

# ---------------------------------------------------------------- clubes y jugadores
clubs, cidx = [], {}
crest_review = []
players, nats, nat_idx = [], [], {}
used_short = {v[1] for v in TOP.values()}
STOPS = {'fc','cf','sc','ac','as','ud','cd','rc','rcd','sd','ss','ssc','us','afc','sv','vfl','vfb','tsg','fsv','1','sporting','real','club','de','city','united','town','fk','sk','nk','kf','pfc'}

def short_for(name):
    words = [w for w in re.split(r"[\s\.\-']+", name) if w]
    c = [w for w in words if norm(w) not in STOPS and not w.isdigit()] or words
    b = norm(c[0]).replace(' ', '').upper() or 'CLB'
    cand = b[:3]
    if cand in used_short and len(c) > 1: cand = (b[:2] + norm(c[1])[:1]).upper()
    i = 3
    while cand in used_short and i < len(b): cand = b[:2] + b[i].upper(); i += 1
    n = 0
    while cand in used_short: n += 1; cand = b[:2] + str(n)
    used_short.add(cand)
    return cand

def color_for(name):
    h = hashlib.md5(name.encode()).digest()
    pal = ['#c8102e','#0047ab','#111111','#ffffff','#ffd200','#0b7a3b','#6a2c91','#e86a10','#7a1630','#3aa0dc','#1d3f8f']
    a, b = pal[h[0] % len(pal)], pal[h[1] % len(pal)]
    return (a, b if a != b else ('#ffffff' if a != '#ffffff' else '#111111'))

def nat(n):
    if n not in nat_idx: nat_idx[n] = len(nats); nats.append(n)
    return nat_idx[n]

face_index = json.load(open(A.faces)) if A.faces and os.path.exists(A.faces) else {}
face_needed = []

def add_player(r, ci):
    pos = []
    for x in r['player_positions'].split(','):
        m = POSMAP.get(x.strip())
        if m and m not in pos: pos.append(m)
    st = [num(r[k]) for k in ('pace','shooting','passing','dribbling','defending','physic')]
    face_needed.append(r['player_id'])
    players.append([r['short_name'], '/'.join(pos or ['MC']), num(r['overall']), num(r['potential']), num(r['value_eur']),
                    num(r['wage_eur']), num(r['age']), nat(r['nationality_name']), ci] + st +
                   [1 if r['preferred_foot'] == 'Left' else 0, face_index.get(r['player_id'], -1)])

def add_club(src, div, league, country, display=None, gen=None, alt=None):
    if src in cidx: return cidx[src]
    if src in TOP: disp, short, c1, c2, stad = TOP[src]
    else:
        disp, stad = display or src, ''
        short = short_for(disp); c1, c2 = color_for(src)
    cidx[src] = len(clubs)
    crest = crest_for(src, disp, display, alt, country=COUNTRY_EN.get(country))
    if crest and norm(crest) not in (norm(src), norm(disp)): crest_review.append((disp, crest))
    clubs.append({'n': disp, 's': short, 'c1': c1, 'c2': c2, 'st': stad, 'd': div, 'l': league, 'cc': country,
                  'src': src, 'crest': crest, 'g': gen})
    if gen is None:
        for r in by_club[src]: add_player(r, cidx[src])
    return cidx[src]

divs_out = []
for di, (did, name, country, tier, code, fcl, sw, size) in enumerate(DIVS):
    ids = [add_club(c, di, name, country) for c in sorted(div_clubs[did], key=lambda c: -level(c))]
    fx = None
    if feeds[did]:
        fx = [[d, rn, cidx[h], cidx[a]] for d, rn, h, a in sorted(feeds[did])]
        rd = defaultdict(list)
        for d, rn, h, a in feeds[did]: rd[rn].append(d)
        dates = [Counter(rd[k]).most_common(1)[0][0] for k in sorted(rd)]
    else:
        dates = weekend_dates(2 * (len(ids) - 1))
    divs_out.append({'id': did, 'n': name, 'c': country, 't': tier, 'sw': sw, 'clubs': ids, 'fx': fx, 'dates': dates})

euro_out = {}
for code, (ename, dates, ko, teams) in EURO.items():
    ids = []
    for t in teams:
        src = M.find(t)
        if src and src in by_club:
            league = club_league[src]
            ci = add_club(src, -1, league, '')
        else:
            if t not in GEN: sys.exit('Club europeo sin emparejar: ' + t)
            g = GEN[t]
            ci = add_club('GEN:' + t, -1, g[1], g[1], display=g[0], gen=[g[3], g[2]], alt=t)
        ids.append(ci)
    euro_out[code] = {'n': ename, 'dates': dates, 'ko': ko, 'clubs': ids}

# mercado internacional: media >= 70 de otras ligas y agentes libres >= 60
for r in rows:
    ovr = num(r['overall'])
    if not r['club_name']:
        if ovr >= 60: add_player(r, -1)
        continue
    if r['club_name'] in cidx or ovr < 70: continue
    src = r['club_name']
    if src not in cidx:
        cidx[src] = len(clubs)
        c1, c2 = color_for(src)
        clubs.append({'n': src, 's': short_for(src), 'c1': c1, 'c2': c2, 'st': '', 'd': -1, 'l': r['league_name'] or 'Internacional',
                      'cc': '', 'src': src, 'crest': crest_for(src), 'g': None, 'partial': True})
        if clubs[-1]['crest'] and norm(clubs[-1]['crest']) != norm(src): crest_review.append((src, clubs[-1]['crest']))
    add_player(r, cidx[src])

# presupuestos
sq = defaultdict(list)
for p in players:
    if p[8] >= 0: sq[p[8]].append(p)
for i, c in enumerate(clubs):
    s = sq[i]
    b = seed.get(norm(SEED_ALIAS.get(c['src'], c['src'])))
    if b is None:
        if c['g']:
            lv = c['g'][0]; b = max(1.5e6, (lv - 50) * 0.6e6)
        else:
            value = sum(p[4] for p in s); ovr = sum(p[2] for p in s) / len(s) if s else 65
            b = max(1500000, value * max(0.08, min(0.55, (ovr - 55) / 100)))
            if c['d'] >= 0 and DIVS[c['d']][3] == 2: b *= 0.45
    c['b'] = int(round(b / 100000) * 100000)
    c['w'] = int(round(sum(p[5] for p in s) * 1.08 / 1000) * 1000) if s else int(c['b'] * 0.004)

# sprite de escudos (celdas de 64 px, 16 columnas)
crest_list = sorted({c['crest'] for c in clubs if c['crest']})
from PIL import Image
CELL, COLS = 64, 16
os.makedirs(os.path.join(A.out, 'assets'), exist_ok=True)
rows_n = (len(crest_list) + COLS - 1) // COLS
sheet = Image.new('RGBA', (CELL * COLS, CELL * rows_n), (0, 0, 0, 0))
for i, name in enumerate(crest_list):
    im = Image.open(crest_files[name]).convert('RGBA')
    im.thumbnail((CELL - 4, CELL - 4), Image.LANCZOS)
    x = (i % COLS) * CELL + (CELL - im.width) // 2; y = (i // COLS) * CELL + (CELL - im.height) // 2
    sheet.alpha_composite(im, (x, y))
sheet.save(os.path.join(A.out, 'assets', 'crests.webp'), 'WEBP', quality=88, method=6)
crest_pos = {n: i for i, n in enumerate(crest_list)}
for c in clubs:
    c['k'] = crest_pos.get(c['crest'], -1)

euro_ids = {i for e in euro_out.values() for i in e['clubs']}
missing = [c['n'] for i, c in enumerate(clubs) if c['k'] < 0 and (c['d'] >= 0 or i in euro_ids)]
json.dump([[c['src'], c['n'], COUNTRY_EN.get(c['cc'], c['cc']), c['d'] >= 0 or i in euro_ids] for i, c in enumerate(clubs) if c['k'] < 0 and c['src'] not in NO_CREST],
          open(os.path.join(A.out, 'tools', 'crest_missing.json'), 'w'), ensure_ascii=False)
for c in clubs:
    for k in ('src', 'crest'): c.pop(k, None)
    if not c.get('g'): c.pop('g', None)

out = {'season': '2026/27', 'year': 2026, 'start': '2026-07-01',
       'source': 'EA SPORTS FC 26 (thompgt/fc26-player-analysis) · calendarios openfootball 2026/27 · escudos luukhopman/football-logos',
       'divs': divs_out, 'euro': euro_out, 'clubs': clubs, 'nats': nats, 'players': players,
       'faceSheet': 256, 'crestCols': COLS, 'crestRows': rows_n}
open(os.path.join(A.out, 'data.js'), 'w', encoding='utf-8').write('window.DB=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(A.out, 'tools', 'faces_needed.txt'), 'w').write('\n'.join(face_needed) + '\n')
print(f'clubes {len(clubs)} · jugadores {len(players)} · escudos {len(crest_list)} · caras {sum(1 for p in players if p[-1] >= 0)}')
print('divisiones:', [(d['id'], len(d['clubs']), 'real' if d['fx'] else 'generado') for d in divs_out])
print('sin escudo:', missing)
if os.environ.get('CREST_REVIEW'):
    for n, c in sorted(crest_review): print('  escudo', n, '->', c)

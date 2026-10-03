"""Emparejado de nombres de clubes entre fuentes (FC26, openfootball, escudos, V24)."""
import re, unicodedata

STOP = {'fc','cf','sc','ac','afc','rc','rcd','cd','ud','sd','club','de','del','la','el','the','fk','sk','bk','kv','as','us','ss','ssc',
        'calcio','sv','vfl','vfb','tsg','fsv','spvgg','1','sad','balompie','futbol','football','city','town','hotspur','and','sco','ogc','osc','aj'}
ALIASES = {
 # openfootball / V24 / escudos -> nombre del CSV FC26
 'real madrid cf':'Real Madrid','club atletico de madrid':'Atlético Madrid','atletico de madrid':'Atlético Madrid','atletico madrid':'Atlético Madrid','atleti':'Atlético Madrid',
 'rc celta de vigo':'RC Celta','celta de vigo':'RC Celta','celta vigo':'RC Celta','rcd espanyol de barcelona':'RCD Espanyol','rcd espanyol barcelona':'RCD Espanyol','espanyol':'RCD Espanyol',
 'real sociedad de futbol':'Real Sociedad','rayo vallecano de madrid':'Rayo Vallecano','real racing club de santander':'Racing Santander','racing santander':'Racing Santander',
 'rc deportivo la coruna':'Deportivo de La Coruña','deportivo a coruna':'Deportivo de La Coruña','deportivo la coruna':'Deportivo de La Coruña','athletic bilbao':'Athletic Club',
 'barcelona':'FC Barcelona','real betis':'Real Betis Balompié','villarreal':'Villarreal CF','getafe':'Getafe CF',
 'bayern munich':'FC Bayern München','bayern munchen':'FC Bayern München','fc bayern munchen':'FC Bayern München','borussia monchengladbach':'Borussia Mönchengladbach',
 'leipzig':'RB Leipzig','stuttgart':'VfB Stuttgart','hoffenheim':'TSG 1899 Hoffenheim','freiburg':'SC Freiburg','bayer leverkusen':'Bayer 04 Leverkusen','leverkusen':'Bayer 04 Leverkusen',
 'paris saint germain':'Paris Saint-Germain','paris saint germain fc':'Paris Saint-Germain','psg':'Paris Saint-Germain','lille':'Lille OSC','lens':'RC Lens','marseille':'Olympique de Marseille',
 'olympique marseille':'Olympique de Marseille','lyon':'Olympique Lyonnais','olympique lyon':'Olympique Lyonnais','rennes':'Stade Rennais FC','monaco':'AS Monaco','nice':'OGC Nice',
 'milan':'AC Milan','inter milan':'Inter','fc internazionale milano':'Inter','es troyes ac':'ESTAC Troyes','troyes':'ESTAC Troyes','racing club de lens':'RC Lens','fc internazionale':'Inter','internazionale':'Inter','napoli':'Napoli','roma':'Roma','como':'Como','juventus':'Juventus','atalanta':'Atalanta',
 'brighton':'Brighton & Hove Albion','brighton hove albion':'Brighton & Hove Albion','bournemouth':'AFC Bournemouth','wolves':'Wolverhampton Wanderers','nottm forest':'Nottingham Forest',
 'fulham':'Fulham FC','millwall':'Millwall FC','spurs':'Tottenham Hotspur','man city':'Manchester City','man utd':'Manchester United',
 'porto':'FC Porto','sporting cp':'Sporting CP','benfica':'SL Benfica','braga':'Sporting Clube de Braga','sc braga':'Sporting Clube de Braga','feyenoord':'Feyenoord','psv':'PSV','ajax':'Ajax','az alkmaar':'AZ Alkmaar','twente':'FC Twente',
 'club brugge':'Club Brugge KV','anderlecht':'RSC Anderlecht','gent':'KAA Gent','union saint gilloise':'Union Saint-Gilloise','sint truiden':'Sint-Truidense VV',
 'galatasaray':'Galatasaray SK','fenerbahce':'Fenerbahçe SK','besiktas':'Beşiktaş JK','trabzonspor':'Trabzonspor','celtic':'Celtic','hearts':'Hearts',
 'olympiacos':'Olympiacos FC','panathinaikos':'Panathinaikos FC','aek athens':'AEK Athens','copenhagen':'FC København','midtjylland':'FC Midtjylland','nordsjaelland':'FC Nordsjælland',
 'aarhus':'Aarhus Gymnastikforening','bodo glimt':'FK Bodø/Glimt','viking':'Viking FK','brann':'SK Brann','lillestrom':'Lillestrøm SK','salzburg':'FC Red Bull Salzburg','red bull salzburg':'FC Red Bull Salzburg',
 'sturm graz':'SK Sturm Graz','lask':'LASK Linz','shakhtar':'Shakhtar Donetsk','slavia praha':'SK Slavia Praha','sparta praha':'AC Sparta Praha','viktoria plzen':'FC Viktoria Plzeň',
 'gnk dinamo':'Dinamo Zagreb','dinamo zagreb':'Dinamo Zagreb','hajduk split':'Hajduk Split','crvena zvezda':'FK Crvena Zvezda','ferencvaros':'Ferencvárosi Torna Club','lech poznan':'Lech Poznań','jagiellonia':'Jagiellonia Białystok',
 'mjallby':'Mjällby AIF','lugano':'FC Lugano','thun':'FC Thun','celje':'NK Celje','slovan bratislava':'ŠK Slovan Bratislava','levski sofia':'PFC Levski Sofia','cska sofia':'PFC CSKA-Sofia',
 'universitatea craiova':'Universitatea Craiova','hapoel beer sheva':'Hapoel Be\'er Sheva','omonia':'Omonia Nicosia','pafos':'Pafos FC','nec nijmegen':'NEC Nijmegen','nec':'NEC Nijmegen',
 'torreense':'SC Torreense','ofi crete':'OFI Crete','jablonec':'FK Jablonec','kups kuopio':'KuPS','kairat almaty':'Kairat Almaty','borac':'FK Borac Banja Luka','riga':'Riga FC',
 'egnatia':'KF Egnatia','kauno zalgiris':'FK Kauno Žalgiris','lincoln red imps':'Lincoln Red Imps','inter escaldes':'Inter Club d\'Escaldes','iberia tbilisi':'Iberia 1999','sabah':'Sabah FK','ararat armenia':'FC Ararat-Armenia',
}
TRANSLIT = str.maketrans({'ł':'l','Ł':'L','ø':'o','Ø':'O','æ':'ae','Æ':'AE','ß':'ss','đ':'d','Đ':'D','ı':'i','œ':'oe'})
SYN = {'praha':'prague','kobenhavn':'copenhagen','beograd':'belgrade','munchen':'munich'}
def norm(s):
    s = unicodedata.normalize('NFD', str(s).translate(TRANSLIT)).encode('ascii', 'ignore').decode().lower().replace('&', ' and ')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()
def core(s):
    toks = [SYN.get(t, t) for t in norm(s).split() if t not in STOP and not re.fullmatch(r'\d+', t)]
    return ' '.join(toks) or norm(s)

class Matcher:
    def __init__(self, names):
        self.names = list(names)
        self.by_norm = {}
        self.by_core = {}
        for n in self.names:
            self.by_norm.setdefault(norm(n), n)
            self.by_core.setdefault(core(n), []).append(n)
    def find(self, name):
        k = norm(name)
        if k in ALIASES:
            a = ALIASES[k]
            if a in self.names: return a
            if norm(a) in self.by_norm: return self.by_norm[norm(a)]
            hit = self.by_core.get(core(a), [])
            if len(hit) == 1: return hit[0]
            fuzzy = False
        else:
            fuzzy = True
        if k in self.by_norm: return self.by_norm[k]
        c = core(name)
        if len(self.by_core.get(c, [])) == 1: return self.by_core[c][0]
        if not fuzzy: return None
        # similitud por tokens
        ct = set(c.split()); best, bs, tie = None, 0, False
        for n in self.names:
            nt = set(core(n).split())
            if not nt: continue
            j = len(ct & nt) / len(ct | nt)
            if j > bs: best, bs, tie = n, j, False
            elif j == bs: tie = True
        return best if bs >= 0.5 and not tie else None

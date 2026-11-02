# Recon map: SuperStar BTS (Android / iOS, 2018–2020)

Scope: the core rhythm loop (song select → play → result) plus the card/deck
meta-game that scales the score, stamina (headphones), records and the card shop.
For: personal use, a gift. A web app (PWA) that installs from the browser.
Date: 2026-11-02

The original shut down on 23 June 2020 (KST), so there is no live app to study.
Recon comes from public articles and fan guides only.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Soompi, end of service | https://www.soompi.com/article/1398839wpp/bts-themed-rhythm-game-superstar-bts-to-discontinue-service | announced 7 May 2020, closed 23 Jun 2020 |
| 2 | Fanlore, SuperStar series | https://fanlore.org/wiki/SuperStar_Rhythm_Games | Dalcomsoft series, launched 18 Jan 2018 |
| 3 | Fan guide (JP/EN) | https://btsarmyjp.blogspot.com/2018/11/guide-tips-and-tricks-to-rise-score-on.html | difficulties, early tap = GOOD, late = MISS, lenient long notes, card ranks R>S>A>B>C, packs, league |
| 4 | Fan wiki | https://superstarbts.fandom.com/wiki/Leveling_Up | levelling up |
| 5 | NamuWiki (via search summary) | https://en.namu.wiki/w/SuperStar%20BTS | fixed max score per difficulty, S.PERFECT, theme decks |
| 6 | Tumblr guide (series) | https://www.tumblr.com/littlecafe/182391963748/this-is-a-very-condensed-guide-to-superstar | S.PERFECT note silver/holographic, PERFECT gold, hit the note centre |
| 7 | Gamebiz (JP release) | https://gamebiz.jp/news/211308 | PONOS distribution in Japan |

## Core loop

Pick a song and a difficulty, tap the notes falling down the lanes to the beat,
get a score boosted by your card deck, earn points, get more cards, score higher.

## Screens

| ID | screen | how to reach | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Title | app open | unlock audio, enter | logo, "tap to start" | first run, returning |
| S02 | Lobby | after title, nav "Inicio" | profile, stamina, leader card | top bar (level, RP, headphones), leader card, play button, bottom nav | low stamina |
| S03 | Song list | nav "Canciones" | choose song and difficulty | song rows, difficulty tabs E/N/H, best score + rank, import | no audio loaded, analysing, ready |
| S04 | Play | from S03 | the rhythm game | lanes (3/4/7), buttons, notes (tap, long), judgment, combo, score, progress, pause | playing, paused |
| S05 | Result | song end | rank, score, counts, rewards | rank letter, judgment counts, max combo, new record, RP/EXP | new record, full combo, all S.PERFECT |
| S06 | Cards / deck | nav "Cartas" | build the deck | 7 deck slots, collection grid, filters | empty slots, theme bonus |
| S07 | Shop | nav "Tienda" | open card packs | pack, reveal animation | not enough RP |
| S08 | Settings | nav "Ajustes" | speed, offset, volume | sliders, toggles, reset | |

## Flows

```
F01 Play a song
    S02 -> S03 (song, difficulty) -> S04 -> S05 -> S03
    happy path taps: 3
    edge: song audio not loaded yet, not enough headphones, app sent to background mid-song

F02 Improve the deck
    S07 open pack -> reveal -> S06 put card in slot -> S03 replay for a higher score
    edge: duplicate card (levels up instead), no RP
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost | default, pressed, disabled | all |
| Card | grade C/B/A/S/R, theme | in deck, selected, new | S02, S05, S06, S07 |
| Song row | theme colour | locked (no audio), analysing, ready | S03 |
| Difficulty tab | EASY, NORMAL, HARD | selected | S03 |
| Stamina pill | headphones | full, regenerating | S02, S03 |
| Modal | info, confirm | open | all |

## Inferred data model

```
Profile  name, level, exp, rp, headphones, headphones_ts
         evidence: sources 3, 4 (levelling, stamina per difficulty)  confidence: high
Card     member, theme, grade (C|B|A|S|R), level
         evidence: source 3 (ranks, upgrade with duplicates)          confidence: high
Deck     slots of cards; a theme bonus when cards match the song's theme
         evidence: source 5 (theme decks dominate rankings)            confidence: medium
Record   song, difficulty, best score, rank, full combo
         evidence: source 3 ("all combo clear")                        confidence: high
Chart    notes {time, lane, end?} per difficulty
         evidence: sources 3, 6                                         confidence: medium (generated here)
```

## Out of scope

- The songs (licensed audio). The app ships with no audio. The player loads
  their own files on their own device and they never leave it.
- Member photos, the logo, the official card art: replaced with original art.
- The official charts (we generate charts from the audio).
- Leagues and online rankings (the server is gone, and this is for one person).
- Real-money diamonds and in-app purchases.

## Size

Screens 8, flows 2, entities 5. Hard parts: audio-synced timing, generating
playable charts from audio, touch input latency on phones. Size: M.

import Phaser from 'phaser';
import { GAME_H, GAME_W } from './game/layout';
import { COLORS } from './game/theme';
import { BattleScene } from './game/scenes/BattleScene';
import { DeckScene } from './game/scenes/CardScreens';
import { OpenBallScene, ShopScene, TrophyRoadScene } from './game/scenes/ShopScenes';
import { CARDS } from './sim/data/cards';
import { MenuScene } from './game/scenes/MenuScene';
import { ResultScene } from './game/scenes/ResultScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: COLORS.bg,
  // Transparente: en batalla, la capa 3D se ve a través del lienzo del HUD.
  transparent: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  render: { antialias: true, roundPixels: false },
  scene: [MenuScene, BattleScene, ResultScene, DeckScene, ShopScene, OpenBallScene, TrophyRoadScene],
});

(window as unknown as { __game?: Phaser.Game; __cards?: unknown }).__game = game;
// Catálogo accesible para las pruebas de extremo a extremo.
(window as unknown as { __cards?: unknown }).__cards = CARDS;

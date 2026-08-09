import type { ChampionLaneProfile, Lane, ScoreMap } from '../domain/types';

export interface ChampionMetadata {
  iconUrl: string;
  wikiUrl: string;
  difficultyNote: string;
}

function metadata(championName: string, difficultyNote: string, fileStem: string, wikiName = championName): ChampionMetadata {
  return {
    iconUrl: `https://wiki.leagueoflegends.com/en-us/Special:FilePath/${fileStem}Square.png`,
    wikiUrl: `https://wiki.leagueoflegends.com/en-us/${wikiName}`,
    difficultyNote,
  };
}

export const CHAMPION_METADATA: Record<string, ChampionMetadata> = {
  gragas: metadata('Gragas', 'スキルショット、当て方の変化、位置取りと味方連携を同時に扱う中難度。', 'Gragas'),
  ahri: metadata('Ahri', 'スキルショットと移動スキルの判断が中心の中難度。', 'Ahri'),
  orianna: metadata('Orianna', 'ボール位置、味方との連携、集団戦の判断を継続して管理する中高難度。', 'Orianna'),
  'lee-sin': metadata('Lee Sin', '連続入力、視野、コンボ分岐、序盤のマップ判断を要求する高難度。', 'LeeSin', 'Lee Sin'),
  sejuani: metadata('Sejuani', '操作よりも視野、開始判断、味方との連携を重視する中難度。', 'Sejuani'),
  caitlyn: metadata('Caitlyn', '射程管理と細かな通常攻撃、罠の配置を要求する中難度。', 'Caitlyn'),
  thresh: metadata('Thresh', 'フックの照準、味方救援、視野と集団戦判断を同時に扱う中高難度。', 'Thresh'),
  malphite: metadata('Malphite', '基本操作は易しく、仕掛けるタイミングと耐える判断が中心の低中難度。', 'Malphite'),
  yasuo: metadata('Yasuo', '移動を伴う連続入力、間合い、風の壁と戦闘継続判断を要求する高難度。', 'Yasuo'),
  kindred: metadata('Kindred', 'マーク、射程、ジャングル経路、アルティメット判断を同時に扱う高難度。', 'Kindred'),
  milio: metadata('Milio', '味方の状態を見て強化と解除を選ぶ反応的な中難度。', 'Milio'),
  nautilus: metadata('Nautilus', 'フックの照準と開始後の対象選択、視野管理を要求する低中難度。', 'Nautilus'),
  azir: metadata('Azir', '兵士の位置、複数対象、連続入力、長期的な射程管理を要求する非常に高い難度。', 'Azir'),
  vayne: metadata('Vayne', 'カイト、短い移動、対象選択、終盤の立ち位置を要求する高難度。', 'Vayne'),
  aatrox: metadata('Aatrox', 'LoLJPWikiの考察にあるQの先端管理、間合い、回復を含む継続戦闘を踏まえた高難度。', 'Aatrox'),
  garen: metadata('Garen', '基本操作は易しく、短い交換、耐久、撤退判断を学びやすい低難度。', 'Garen'),
  darius: metadata('Darius', 'Qの外周、引き寄せ、スタックとキル順を管理する中難度。', 'Darius'),
  zed: metadata('Zed', '影の位置、手裏剣照準、複数の戻り先とリスク判断を要求する高難度。', 'Zed'),
  syndra: metadata('Syndra', '球の配置、スキルショット、射程、スタックを扱う中高難度。', 'Syndra'),
  vi: metadata('Vi', '操作は学びやすいが、視野、突入対象、退路と開始タイミングを判断する中難度。', 'Vi'),
  warwick: metadata('Warwick', '低体力時の回復と追跡を活かしやすく、基本的なマップ判断を学ぶ低中難度。', 'Warwick'),
  jinx: metadata('Jinx', '通常攻撃の対象選択、射程切替、集団戦の位置取りを要求する中難度。', 'Jinx'),
  ezreal: metadata('Ezreal', '複数のスキルショットを当て続け、移動スキルを温存する高い照準難度。', 'Ezreal'),
  'kai-sa': metadata('Kai\'Sa', '射程、進化条件、対象選択、突入と撤退を切り替える中高難度。', 'KaiSa', "Kai'Sa"),
  leona: metadata('Leona', '仕掛けるタイミングと味方の追撃を合わせる、学びやすい中難度。', 'Leona'),
  lulu: metadata('Lulu', '味方と敵へ同じ資源を使い分ける反応・優先順位判断の中難度。', 'Lulu'),
};

const preferenceDefaults: ScoreMap = {
  aggression: 0.5, teamSupport: 0.5, independence: 0.5, teamCoordination: 0.5,
  earlyGameFocus: 0.5, lateGameFocus: 0.5, burstPreference: 0.5, sustainedCombat: 0.5,
  reactivePlay: 0.5, riskTaking: 0.5, complexityEnjoyment: 0.5, stabilityPreference: 0.5,
  highVariancePreference: 0.5, rangePreference: 0.5, meleePreference: 0.5, mapInfluencePreference: 0.5,
};

const abilityKeys = ['reaction', 'clickAccuracy', 'inputControl', 'prediction', 'attentionDistribution', 'taskSwitching', 'decisionSpeed', 'decisionQuality', 'pressureStability', 'recovery'];

function scoreMap(values: Partial<Record<string, number>>, fallback = 0.5): ScoreMap {
  return Object.fromEntries(abilityKeys.map((key) => [key, values[key] ?? fallback]));
}

export function buildCatalogProfile(
  championId: string,
  championName: string,
  lane: Lane,
  style: Partial<Record<string, number>>,
  requirements: Partial<Record<string, number>>,
  preferences: ScoreMap,
  trainingTags: string[],
  strengthTags: string[],
  riskTags: string[],
  difficulty: Partial<Record<string, number>>,
): ChampionLaneProfile {
  const source = CHAMPION_METADATA[championId];
  return {
    championId,
    championName,
    lane,
    profileMode: 'explicit',
    styleProfile: scoreMap(style),
    minimumRequirements: scoreMap(requirements, 0),
    requirementWeights: scoreMap(Object.fromEntries(Object.keys(requirements).map((key) => [key, 0.8])), 0.35),
    preferenceProfile: { ...preferenceDefaults, ...preferences },
    difficultyProfile: {
      inputComplexity: style.inputControl ?? 0.5,
      aimDifficulty: style.clickAccuracy ?? 0.5,
      decisionComplexity: style.decisionQuality ?? 0.5,
      macroRequirement: style.attentionDistribution ?? 0.5,
      knowledgeRequirement: 0.5,
      situationalDependence: style.prediction ?? 0.5,
      ...difficulty,
    },
    strengthTags,
    riskTags,
    trainingTags,
    iconUrl: source.iconUrl,
    wikiUrl: source.wikiUrl,
    difficultyNote: source.difficultyNote,
  };
}

export const CATALOG_CHAMPION_LANES: ChampionLaneProfile[] = [
  buildCatalogProfile('aatrox', 'エイトロックス', 'TOP', { reaction: 0.75, clickAccuracy: 0.55, inputControl: 0.75, prediction: 0.8, attentionDistribution: 0.55, taskSwitching: 0.65, decisionSpeed: 0.7, decisionQuality: 0.75, pressureStability: 0.8, recovery: 0.75 }, { prediction: 0.55, inputControl: 0.5, decisionQuality: 0.55 }, { aggression: 0.8, meleePreference: 0.95, sustainedCombat: 0.9, riskTaking: 0.75, complexityEnjoyment: 0.7, teamCoordination: 0.45 }, ['prediction', 'inputControl', 'decisionQuality'], ['間合い管理', '継続戦闘'], ['Q先端の精度', '無理な継続戦闘'], { inputComplexity: 0.78, aimDifficulty: 0.55, decisionComplexity: 0.75, macroRequirement: 0.55, knowledgeRequirement: 0.75, situationalDependence: 0.8 }),
  buildCatalogProfile('garen', 'ガレン', 'TOP', { reaction: 0.4, clickAccuracy: 0.25, inputControl: 0.3, prediction: 0.4, attentionDistribution: 0.5, taskSwitching: 0.35, decisionSpeed: 0.45, decisionQuality: 0.65, pressureStability: 0.8, recovery: 0.8 }, { decisionQuality: 0.4, pressureStability: 0.45 }, { stabilityPreference: 0.9, meleePreference: 0.85, sustainedCombat: 0.65, complexityEnjoyment: 0.2, teamCoordination: 0.55 }, ['decisionQuality', 'pressureStability'], ['基本操作の習得', '安定した交換'], ['逃げ道の少なさ', '後半の射程差'], { inputComplexity: 0.25, aimDifficulty: 0.2, decisionComplexity: 0.35, macroRequirement: 0.4, knowledgeRequirement: 0.35, situationalDependence: 0.4 }),
  buildCatalogProfile('darius', 'ダリウス', 'TOP', { reaction: 0.55, clickAccuracy: 0.4, inputControl: 0.5, prediction: 0.6, attentionDistribution: 0.55, taskSwitching: 0.45, decisionSpeed: 0.55, decisionQuality: 0.7, pressureStability: 0.7, recovery: 0.65 }, { prediction: 0.45, decisionQuality: 0.5 }, { aggression: 0.85, meleePreference: 0.95, sustainedCombat: 0.85, earlyGameFocus: 0.75, riskTaking: 0.65 }, ['prediction', 'decisionQuality'], ['レーン圧力', '近接の継続火力'], ['間合いの失敗', '追い過ぎ'], { inputComplexity: 0.45, aimDifficulty: 0.35, decisionComplexity: 0.6, macroRequirement: 0.45, knowledgeRequirement: 0.55, situationalDependence: 0.65 }),
  buildCatalogProfile('zed', 'ゼド', 'MID', { reaction: 0.8, clickAccuracy: 0.8, inputControl: 0.8, prediction: 0.75, attentionDistribution: 0.6, taskSwitching: 0.75, decisionSpeed: 0.85, decisionQuality: 0.7, pressureStability: 0.45, recovery: 0.55 }, { inputControl: 0.65, clickAccuracy: 0.6, decisionSpeed: 0.6 }, { aggression: 0.85, independence: 0.8, burstPreference: 0.9, riskTaking: 0.85, complexityEnjoyment: 0.8, highVariancePreference: 0.85 }, ['inputControl', 'decisionSpeed', 'prediction'], ['瞬間火力', '影による選択肢'], ['突入後の退路', '対象選択の失敗'], { inputComplexity: 0.85, aimDifficulty: 0.75, decisionComplexity: 0.8, macroRequirement: 0.55, knowledgeRequirement: 0.7, situationalDependence: 0.9 }),
  buildCatalogProfile('syndra', 'シンドラ', 'MID', { reaction: 0.6, clickAccuracy: 0.8, inputControl: 0.55, prediction: 0.8, attentionDistribution: 0.7, taskSwitching: 0.55, decisionSpeed: 0.6, decisionQuality: 0.8, pressureStability: 0.65, recovery: 0.6 }, { clickAccuracy: 0.6, prediction: 0.6, decisionQuality: 0.55 }, { rangePreference: 0.8, burstPreference: 0.75, teamCoordination: 0.55, complexityEnjoyment: 0.7, stabilityPreference: 0.55 }, ['clickAccuracy', 'prediction', 'decisionQuality'], ['射程とゾーニング', '対象選択'], ['スキル外し', '球の位置管理'], { inputComplexity: 0.55, aimDifficulty: 0.8, decisionComplexity: 0.75, macroRequirement: 0.55, knowledgeRequirement: 0.65, situationalDependence: 0.75 }),
  buildCatalogProfile('vi', 'ヴァイ', 'JUNGLE', { reaction: 0.65, clickAccuracy: 0.45, inputControl: 0.55, prediction: 0.55, attentionDistribution: 0.7, taskSwitching: 0.6, decisionSpeed: 0.65, decisionQuality: 0.75, pressureStability: 0.7, recovery: 0.7 }, { attentionDistribution: 0.5, decisionQuality: 0.55 }, { aggression: 0.7, mapInfluencePreference: 0.85, teamCoordination: 0.75, earlyGameFocus: 0.65, meleePreference: 0.8 }, ['attentionDistribution', 'decisionQuality'], ['開始判断', 'マップへの影響'], ['突入後の孤立', '対象の優先順位'], { inputComplexity: 0.5, aimDifficulty: 0.45, decisionComplexity: 0.65, macroRequirement: 0.75, knowledgeRequirement: 0.6, situationalDependence: 0.7 }),
  buildCatalogProfile('warwick', 'ワーウィック', 'JUNGLE', { reaction: 0.5, clickAccuracy: 0.3, inputControl: 0.35, prediction: 0.45, attentionDistribution: 0.65, taskSwitching: 0.45, decisionSpeed: 0.5, decisionQuality: 0.65, pressureStability: 0.8, recovery: 0.85 }, { attentionDistribution: 0.45, pressureStability: 0.5 }, { stabilityPreference: 0.8, mapInfluencePreference: 0.75, sustainedCombat: 0.75, reactivePlay: 0.65, meleePreference: 0.8 }, ['recovery', 'attentionDistribution'], ['回復力', '追跡と開始'], ['追跡のし過ぎ', '視野不足'], { inputComplexity: 0.3, aimDifficulty: 0.25, decisionComplexity: 0.45, macroRequirement: 0.65, knowledgeRequirement: 0.45, situationalDependence: 0.5 }),
  buildCatalogProfile('jinx', 'ジンクス', 'BOT', { reaction: 0.7, clickAccuracy: 0.8, inputControl: 0.55, prediction: 0.7, attentionDistribution: 0.7, taskSwitching: 0.6, decisionSpeed: 0.65, decisionQuality: 0.65, pressureStability: 0.6, recovery: 0.6 }, { clickAccuracy: 0.55, attentionDistribution: 0.5 }, { rangePreference: 0.85, lateGameFocus: 0.8, teamCoordination: 0.7, sustainedCombat: 0.75, highVariancePreference: 0.6 }, ['clickAccuracy', 'attentionDistribution'], ['射程切替', '集団戦の加速'], ['立ち位置', '逃げ手段の少なさ'], { inputComplexity: 0.5, aimDifficulty: 0.7, decisionComplexity: 0.55, macroRequirement: 0.55, knowledgeRequirement: 0.5, situationalDependence: 0.65 }),
  buildCatalogProfile('ezreal', 'エズリアル', 'BOT', { reaction: 0.7, clickAccuracy: 0.92, inputControl: 0.65, prediction: 0.85, attentionDistribution: 0.65, taskSwitching: 0.55, decisionSpeed: 0.65, decisionQuality: 0.6, pressureStability: 0.55, recovery: 0.6 }, { clickAccuracy: 0.7, prediction: 0.65 }, { rangePreference: 0.9, independence: 0.65, complexityEnjoyment: 0.75, riskTaking: 0.5, lateGameFocus: 0.65 }, ['clickAccuracy', 'prediction'], ['スキルショット精度', '安全な射程'], ['命中率への依存', '火力の遅れ'], { inputComplexity: 0.65, aimDifficulty: 0.92, decisionComplexity: 0.65, macroRequirement: 0.5, knowledgeRequirement: 0.55, situationalDependence: 0.8 }),
  buildCatalogProfile('kai-sa', 'カイ＝サ', 'BOT', { reaction: 0.75, clickAccuracy: 0.75, inputControl: 0.7, prediction: 0.65, attentionDistribution: 0.65, taskSwitching: 0.65, decisionSpeed: 0.7, decisionQuality: 0.75, pressureStability: 0.55, recovery: 0.6 }, { clickAccuracy: 0.55, decisionQuality: 0.6, taskSwitching: 0.5 }, { rangePreference: 0.65, burstPreference: 0.7, sustainedCombat: 0.65, riskTaking: 0.7, complexityEnjoyment: 0.7, highVariancePreference: 0.7 }, ['decisionQuality', 'taskSwitching', 'clickAccuracy'], ['対象選択', '突入と撤退'], ['孤立した突入', '進化条件の遅れ'], { inputComplexity: 0.7, aimDifficulty: 0.7, decisionComplexity: 0.75, macroRequirement: 0.55, knowledgeRequirement: 0.7, situationalDependence: 0.8 }),
  buildCatalogProfile('leona', 'レオナ', 'SUPPORT', { reaction: 0.65, clickAccuracy: 0.35, inputControl: 0.55, prediction: 0.6, attentionDistribution: 0.7, taskSwitching: 0.55, decisionSpeed: 0.65, decisionQuality: 0.8, pressureStability: 0.8, recovery: 0.75 }, { attentionDistribution: 0.5, decisionQuality: 0.55 }, { teamSupport: 0.85, teamCoordination: 0.9, aggression: 0.7, meleePreference: 0.85, mapInfluencePreference: 0.7 }, ['decisionQuality', 'attentionDistribution'], ['エンゲージ', '味方の開始点'], ['仕掛けの早過ぎ', '退路の不足'], { inputComplexity: 0.45, aimDifficulty: 0.35, decisionComplexity: 0.6, macroRequirement: 0.6, knowledgeRequirement: 0.5, situationalDependence: 0.7 }),
  buildCatalogProfile('lulu', 'ルル', 'SUPPORT', { reaction: 0.55, clickAccuracy: 0.45, inputControl: 0.4, prediction: 0.55, attentionDistribution: 0.85, taskSwitching: 0.65, decisionSpeed: 0.55, decisionQuality: 0.85, pressureStability: 0.8, recovery: 0.8 }, { attentionDistribution: 0.55, decisionQuality: 0.6 }, { teamSupport: 0.95, teamCoordination: 0.95, reactivePlay: 0.9, stabilityPreference: 0.85, rangePreference: 0.65 }, ['attentionDistribution', 'decisionQuality', 'recovery'], ['味方の保護', '反応的な判断'], ['対象選択', '自分の位置取り'], { inputComplexity: 0.4, aimDifficulty: 0.35, decisionComplexity: 0.7, macroRequirement: 0.6, knowledgeRequirement: 0.6, situationalDependence: 0.8 }),
];

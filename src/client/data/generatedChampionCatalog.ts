import type { ChampionLaneProfile } from '../../domain/types';

export const GENERATED_CHAMPION_LANES: ChampionLaneProfile[] = [
  {
    "championId": "gragas",
    "championName": "グラガス",
    "lane": "TOP",
    "profileMode": "derived",
    "styleProfile": {
      "reaction": 0.55,
      "clickAccuracy": 0.45,
      "inputControl": 0.55,
      "prediction": 0.7,
      "attentionDistribution": 0.65,
      "taskSwitching": 0.55,
      "decisionSpeed": 0.55,
      "decisionQuality": 0.75,
      "pressureStability": 0.7,
      "recovery": 0.75
    },
    "minimumRequirements": {
      "prediction": 0.4,
      "decisionQuality": 0.5
    },
    "requirementWeights": {
      "prediction": 0.7,
      "decisionQuality": 0.9
    },
    "preferenceProfile": {
      "aggression": 0.55,
      "teamSupport": 0.6,
      "independence": 0.55,
      "teamCoordination": 0.7,
      "earlyGameFocus": 0.45,
      "lateGameFocus": 0.6,
      "burstPreference": 0.55,
      "sustainedCombat": 0.5,
      "reactivePlay": 0.65,
      "riskTaking": 0.4,
      "complexityEnjoyment": 0.5,
      "stabilityPreference": 0.7,
      "highVariancePreference": 0.35,
      "rangePreference": 0.2,
      "meleePreference": 0.8,
      "mapInfluencePreference": 0.5
    },
    "difficultyProfile": {
      "inputComplexity": 0.4,
      "aimDifficulty": 0.35,
      "decisionComplexity": 0.6,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.45,
      "situationalDependence": 0.55
    },
    "strengthTags": [
      "判断の切り替え",
      "安定した対応"
    ],
    "riskTags": [
      "距離管理"
    ],
    "trainingTags": [
      "prediction",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/GragasSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Gragas",
    "difficultyNote": "スキルショット、当て方の変化、位置取りと味方連携を同時に扱う中難度。"
  },
  {
    "championId": "ahri",
    "championName": "アーリ",
    "lane": "MID",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.7,
      "clickAccuracy": 0.7,
      "inputControl": 0.65,
      "prediction": 0.75,
      "attentionDistribution": 0.6,
      "taskSwitching": 0.7,
      "decisionSpeed": 0.75,
      "decisionQuality": 0.65,
      "pressureStability": 0.55,
      "recovery": 0.6
    },
    "minimumRequirements": {
      "clickAccuracy": 0.45,
      "prediction": 0.45
    },
    "requirementWeights": {
      "clickAccuracy": 0.8,
      "prediction": 0.75
    },
    "preferenceProfile": {
      "aggression": 0.7,
      "teamSupport": 0.4,
      "independence": 0.65,
      "teamCoordination": 0.55,
      "earlyGameFocus": 0.55,
      "lateGameFocus": 0.5,
      "burstPreference": 0.75,
      "sustainedCombat": 0.3,
      "reactivePlay": 0.55,
      "riskTaking": 0.65,
      "complexityEnjoyment": 0.65,
      "stabilityPreference": 0.35,
      "highVariancePreference": 0.7,
      "rangePreference": 0.65,
      "meleePreference": 0.1,
      "mapInfluencePreference": 0.65
    },
    "difficultyProfile": {
      "inputComplexity": 0.55,
      "aimDifficulty": 0.65,
      "decisionComplexity": 0.6,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.55,
      "situationalDependence": 0.7
    },
    "strengthTags": [
      "移動予測",
      "瞬間判断"
    ],
    "riskTags": [
      "スキル精度"
    ],
    "trainingTags": [
      "clickAccuracy",
      "prediction"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/AhriSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Ahri",
    "difficultyNote": "スキルショットと移動スキルの判断が中心の中難度。"
  },
  {
    "championId": "orianna",
    "championName": "オリアナ",
    "lane": "MID",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.5,
      "clickAccuracy": 0.6,
      "inputControl": 0.5,
      "prediction": 0.65,
      "attentionDistribution": 0.8,
      "taskSwitching": 0.55,
      "decisionSpeed": 0.5,
      "decisionQuality": 0.85,
      "pressureStability": 0.75,
      "recovery": 0.65
    },
    "minimumRequirements": {
      "attentionDistribution": 0.5,
      "decisionQuality": 0.55
    },
    "requirementWeights": {
      "attentionDistribution": 0.9,
      "decisionQuality": 0.85
    },
    "preferenceProfile": {
      "aggression": 0.4,
      "teamSupport": 0.7,
      "independence": 0.35,
      "teamCoordination": 0.85,
      "earlyGameFocus": 0.35,
      "lateGameFocus": 0.75,
      "burstPreference": 0.55,
      "sustainedCombat": 0.5,
      "reactivePlay": 0.7,
      "riskTaking": 0.3,
      "complexityEnjoyment": 0.65,
      "stabilityPreference": 0.75,
      "highVariancePreference": 0.35,
      "rangePreference": 0.75,
      "meleePreference": 0.1,
      "mapInfluencePreference": 0.7
    },
    "difficultyProfile": {
      "inputComplexity": 0.5,
      "aimDifficulty": 0.5,
      "decisionComplexity": 0.75,
      "macroRequirement": 0.6,
      "knowledgeRequirement": 0.65,
      "situationalDependence": 0.7
    },
    "strengthTags": [
      "盤面把握",
      "計画的な判断"
    ],
    "riskTags": [
      "位置取り"
    ],
    "trainingTags": [
      "attentionDistribution",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/OriannaSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Orianna",
    "difficultyNote": "ボール位置、味方との連携、集団戦の判断を継続して管理する中高難度。"
  },
  {
    "championId": "lee-sin",
    "championName": "リー・シン",
    "lane": "JUNGLE",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.8,
      "clickAccuracy": 0.8,
      "inputControl": 0.9,
      "prediction": 0.75,
      "attentionDistribution": 0.65,
      "taskSwitching": 0.85,
      "decisionSpeed": 0.85,
      "decisionQuality": 0.6,
      "pressureStability": 0.5,
      "recovery": 0.6
    },
    "minimumRequirements": {
      "inputControl": 0.6,
      "taskSwitching": 0.55
    },
    "requirementWeights": {
      "inputControl": 0.95,
      "taskSwitching": 0.85
    },
    "preferenceProfile": {
      "aggression": 0.85,
      "teamSupport": 0.55,
      "independence": 0.7,
      "teamCoordination": 0.65,
      "earlyGameFocus": 0.8,
      "lateGameFocus": 0.35,
      "burstPreference": 0.75,
      "sustainedCombat": 0.45,
      "reactivePlay": 0.4,
      "riskTaking": 0.85,
      "complexityEnjoyment": 0.9,
      "stabilityPreference": 0.2,
      "highVariancePreference": 0.85,
      "rangePreference": 0.15,
      "meleePreference": 0.9,
      "mapInfluencePreference": 0.85
    },
    "difficultyProfile": {
      "inputComplexity": 0.9,
      "aimDifficulty": 0.65,
      "decisionComplexity": 0.7,
      "macroRequirement": 0.8,
      "knowledgeRequirement": 0.65,
      "situationalDependence": 0.9
    },
    "strengthTags": [
      "高速連携",
      "対象切り替え"
    ],
    "riskTags": [
      "入力負荷"
    ],
    "trainingTags": [
      "inputControl",
      "taskSwitching"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/LeeSinSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Lee Sin",
    "difficultyNote": "連続入力、視野、コンボ分岐、序盤のマップ判断を要求する高難度。"
  },
  {
    "championId": "sejuani",
    "championName": "セジュアニ",
    "lane": "JUNGLE",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.45,
      "clickAccuracy": 0.35,
      "inputControl": 0.45,
      "prediction": 0.55,
      "attentionDistribution": 0.8,
      "taskSwitching": 0.65,
      "decisionSpeed": 0.45,
      "decisionQuality": 0.8,
      "pressureStability": 0.85,
      "recovery": 0.8
    },
    "minimumRequirements": {
      "attentionDistribution": 0.45,
      "decisionQuality": 0.5
    },
    "requirementWeights": {
      "attentionDistribution": 0.85,
      "decisionQuality": 0.9
    },
    "preferenceProfile": {
      "aggression": 0.45,
      "teamSupport": 0.85,
      "independence": 0.25,
      "teamCoordination": 0.9,
      "earlyGameFocus": 0.5,
      "lateGameFocus": 0.55,
      "burstPreference": 0.25,
      "sustainedCombat": 0.7,
      "reactivePlay": 0.7,
      "riskTaking": 0.25,
      "complexityEnjoyment": 0.35,
      "stabilityPreference": 0.85,
      "highVariancePreference": 0.2,
      "rangePreference": 0.1,
      "meleePreference": 0.9,
      "mapInfluencePreference": 0.8
    },
    "difficultyProfile": {
      "inputComplexity": 0.4,
      "aimDifficulty": 0.25,
      "decisionComplexity": 0.6,
      "macroRequirement": 0.75,
      "knowledgeRequirement": 0.6,
      "situationalDependence": 0.6
    },
    "strengthTags": [
      "味方との連携",
      "安定維持"
    ],
    "riskTags": [
      "先読み"
    ],
    "trainingTags": [
      "attentionDistribution",
      "recovery"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/SejuaniSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Sejuani",
    "difficultyNote": "操作よりも視野、開始判断、味方との連携を重視する中難度。"
  },
  {
    "championId": "caitlyn",
    "championName": "ケイトリン",
    "lane": "BOT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.65,
      "clickAccuracy": 0.85,
      "inputControl": 0.55,
      "prediction": 0.8,
      "attentionDistribution": 0.7,
      "taskSwitching": 0.55,
      "decisionSpeed": 0.6,
      "decisionQuality": 0.65,
      "pressureStability": 0.55,
      "recovery": 0.55
    },
    "minimumRequirements": {
      "clickAccuracy": 0.6,
      "prediction": 0.5
    },
    "requirementWeights": {
      "clickAccuracy": 0.95,
      "prediction": 0.75
    },
    "preferenceProfile": {
      "aggression": 0.65,
      "teamSupport": 0.4,
      "independence": 0.45,
      "teamCoordination": 0.75,
      "earlyGameFocus": 0.7,
      "lateGameFocus": 0.65,
      "burstPreference": 0.6,
      "sustainedCombat": 0.7,
      "reactivePlay": 0.45,
      "riskTaking": 0.45,
      "complexityEnjoyment": 0.5,
      "stabilityPreference": 0.6,
      "highVariancePreference": 0.55,
      "rangePreference": 0.95,
      "meleePreference": 0.05,
      "mapInfluencePreference": 0.35
    },
    "difficultyProfile": {
      "inputComplexity": 0.45,
      "aimDifficulty": 0.85,
      "decisionComplexity": 0.5,
      "macroRequirement": 0.45,
      "knowledgeRequirement": 0.45,
      "situationalDependence": 0.65
    },
    "strengthTags": [
      "精密エイム",
      "射程管理"
    ],
    "riskTags": [
      "接近戦"
    ],
    "trainingTags": [
      "clickAccuracy",
      "prediction"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/CaitlynSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Caitlyn",
    "difficultyNote": "射程管理と細かな通常攻撃、罠の配置を要求する中難度。"
  },
  {
    "championId": "thresh",
    "championName": "スレッシュ",
    "lane": "SUPPORT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.6,
      "clickAccuracy": 0.55,
      "inputControl": 0.7,
      "prediction": 0.7,
      "attentionDistribution": 0.8,
      "taskSwitching": 0.75,
      "decisionSpeed": 0.65,
      "decisionQuality": 0.8,
      "pressureStability": 0.65,
      "recovery": 0.7
    },
    "minimumRequirements": {
      "attentionDistribution": 0.55,
      "decisionQuality": 0.55
    },
    "requirementWeights": {
      "attentionDistribution": 0.9,
      "decisionQuality": 0.85
    },
    "preferenceProfile": {
      "aggression": 0.6,
      "teamSupport": 0.9,
      "independence": 0.25,
      "teamCoordination": 0.95,
      "earlyGameFocus": 0.5,
      "lateGameFocus": 0.5,
      "burstPreference": 0.4,
      "sustainedCombat": 0.45,
      "reactivePlay": 0.65,
      "riskTaking": 0.5,
      "complexityEnjoyment": 0.65,
      "stabilityPreference": 0.55,
      "highVariancePreference": 0.55,
      "rangePreference": 0.35,
      "meleePreference": 0.65,
      "mapInfluencePreference": 0.9
    },
    "difficultyProfile": {
      "inputComplexity": 0.65,
      "aimDifficulty": 0.55,
      "decisionComplexity": 0.75,
      "macroRequirement": 0.65,
      "knowledgeRequirement": 0.65,
      "situationalDependence": 0.85
    },
    "strengthTags": [
      "広域監視",
      "味方支援"
    ],
    "riskTags": [
      "複合入力"
    ],
    "trainingTags": [
      "inputControl",
      "attentionDistribution"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/ThreshSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Thresh",
    "difficultyNote": "フックの照準、味方救援、視野と集団戦判断を同時に扱う中高難度。"
  },
  {
    "championId": "malphite",
    "championName": "マルファイト",
    "lane": "TOP",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.4,
      "clickAccuracy": 0.3,
      "inputControl": 0.35,
      "prediction": 0.5,
      "attentionDistribution": 0.55,
      "taskSwitching": 0.4,
      "decisionSpeed": 0.4,
      "decisionQuality": 0.7,
      "pressureStability": 0.8,
      "recovery": 0.75
    },
    "minimumRequirements": {
      "decisionQuality": 0.45,
      "pressureStability": 0.5
    },
    "requirementWeights": {
      "decisionQuality": 0.8,
      "pressureStability": 0.8
    },
    "preferenceProfile": {
      "aggression": 0.45,
      "teamSupport": 0.55,
      "independence": 0.5,
      "teamCoordination": 0.65,
      "earlyGameFocus": 0.35,
      "lateGameFocus": 0.55,
      "burstPreference": 0.5,
      "sustainedCombat": 0.5,
      "reactivePlay": 0.65,
      "riskTaking": 0.25,
      "complexityEnjoyment": 0.2,
      "stabilityPreference": 0.9,
      "highVariancePreference": 0.15,
      "rangePreference": 0.1,
      "meleePreference": 0.9,
      "mapInfluencePreference": 0.3
    },
    "difficultyProfile": {
      "inputComplexity": 0.25,
      "aimDifficulty": 0.2,
      "decisionComplexity": 0.45,
      "macroRequirement": 0.45,
      "knowledgeRequirement": 0.4,
      "situationalDependence": 0.5
    },
    "strengthTags": [
      "確定判断",
      "安定維持"
    ],
    "riskTags": [
      "柔軟な切り替え"
    ],
    "trainingTags": [
      "decisionQuality",
      "recovery"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/MalphiteSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Malphite",
    "difficultyNote": "基本操作は易しく、仕掛けるタイミングと耐える判断が中心の低中難度。"
  },
  {
    "championId": "yasuo",
    "championName": "ヤスオ",
    "lane": "MID",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.85,
      "clickAccuracy": 0.75,
      "inputControl": 0.85,
      "prediction": 0.7,
      "attentionDistribution": 0.5,
      "taskSwitching": 0.8,
      "decisionSpeed": 0.8,
      "decisionQuality": 0.55,
      "pressureStability": 0.45,
      "recovery": 0.55
    },
    "minimumRequirements": {
      "inputControl": 0.65,
      "clickAccuracy": 0.5
    },
    "requirementWeights": {
      "inputControl": 0.95,
      "clickAccuracy": 0.8
    },
    "preferenceProfile": {
      "aggression": 0.9,
      "teamSupport": 0.25,
      "independence": 0.8,
      "teamCoordination": 0.45,
      "earlyGameFocus": 0.55,
      "lateGameFocus": 0.45,
      "burstPreference": 0.65,
      "sustainedCombat": 0.75,
      "reactivePlay": 0.4,
      "riskTaking": 0.9,
      "complexityEnjoyment": 0.9,
      "stabilityPreference": 0.15,
      "highVariancePreference": 0.9,
      "rangePreference": 0.15,
      "meleePreference": 0.95,
      "mapInfluencePreference": 0.4
    },
    "difficultyProfile": {
      "inputComplexity": 0.9,
      "aimDifficulty": 0.55,
      "decisionComplexity": 0.65,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.55,
      "situationalDependence": 0.85
    },
    "strengthTags": [
      "高速操作",
      "リスク選択"
    ],
    "riskTags": [
      "失敗時の罰"
    ],
    "trainingTags": [
      "inputControl",
      "pressureStability"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/YasuoSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Yasuo",
    "difficultyNote": "移動を伴う連続入力、間合い、風の壁と戦闘継続判断を要求する高難度。"
  },
  {
    "championId": "kindred",
    "championName": "キンドレッド",
    "lane": "JUNGLE",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.7,
      "clickAccuracy": 0.7,
      "inputControl": 0.65,
      "prediction": 0.8,
      "attentionDistribution": 0.85,
      "taskSwitching": 0.7,
      "decisionSpeed": 0.7,
      "decisionQuality": 0.75,
      "pressureStability": 0.55,
      "recovery": 0.65
    },
    "minimumRequirements": {
      "prediction": 0.6,
      "attentionDistribution": 0.5
    },
    "requirementWeights": {
      "prediction": 0.85,
      "attentionDistribution": 0.9
    },
    "preferenceProfile": {
      "aggression": 0.65,
      "teamSupport": 0.45,
      "independence": 0.7,
      "teamCoordination": 0.55,
      "earlyGameFocus": 0.55,
      "lateGameFocus": 0.65,
      "burstPreference": 0.45,
      "sustainedCombat": 0.7,
      "reactivePlay": 0.55,
      "riskTaking": 0.6,
      "complexityEnjoyment": 0.7,
      "stabilityPreference": 0.45,
      "highVariancePreference": 0.65,
      "rangePreference": 0.65,
      "meleePreference": 0.2,
      "mapInfluencePreference": 0.95
    },
    "difficultyProfile": {
      "inputComplexity": 0.55,
      "aimDifficulty": 0.6,
      "decisionComplexity": 0.75,
      "macroRequirement": 0.85,
      "knowledgeRequirement": 0.75,
      "situationalDependence": 0.9
    },
    "strengthTags": [
      "先読み",
      "マップ影響"
    ],
    "riskTags": [
      "判断の複雑さ"
    ],
    "trainingTags": [
      "prediction",
      "attentionDistribution"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/KindredSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Kindred",
    "difficultyNote": "マーク、射程、ジャングル経路、アルティメット判断を同時に扱う高難度。"
  },
  {
    "championId": "milio",
    "championName": "ミリオ",
    "lane": "SUPPORT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.45,
      "clickAccuracy": 0.4,
      "inputControl": 0.4,
      "prediction": 0.55,
      "attentionDistribution": 0.85,
      "taskSwitching": 0.55,
      "decisionSpeed": 0.45,
      "decisionQuality": 0.85,
      "pressureStability": 0.8,
      "recovery": 0.8
    },
    "minimumRequirements": {
      "attentionDistribution": 0.55,
      "decisionQuality": 0.6
    },
    "requirementWeights": {
      "attentionDistribution": 0.9,
      "decisionQuality": 0.95
    },
    "preferenceProfile": {
      "aggression": 0.25,
      "teamSupport": 0.95,
      "independence": 0.15,
      "teamCoordination": 0.95,
      "earlyGameFocus": 0.4,
      "lateGameFocus": 0.6,
      "burstPreference": 0.2,
      "sustainedCombat": 0.45,
      "reactivePlay": 0.85,
      "riskTaking": 0.15,
      "complexityEnjoyment": 0.35,
      "stabilityPreference": 0.9,
      "highVariancePreference": 0.1,
      "rangePreference": 0.7,
      "meleePreference": 0.1,
      "mapInfluencePreference": 0.65
    },
    "difficultyProfile": {
      "inputComplexity": 0.35,
      "aimDifficulty": 0.25,
      "decisionComplexity": 0.65,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.65,
      "situationalDependence": 0.75
    },
    "strengthTags": [
      "味方支援",
      "判断の安定"
    ],
    "riskTags": [
      "単独の火力"
    ],
    "trainingTags": [
      "attentionDistribution",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/MilioSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Milio",
    "difficultyNote": "味方の状態を見て強化と解除を選ぶ反応的な中難度。"
  },
  {
    "championId": "vayne",
    "championName": "ヴェイン",
    "lane": "BOT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.8,
      "clickAccuracy": 0.85,
      "inputControl": 0.8,
      "prediction": 0.75,
      "attentionDistribution": 0.6,
      "taskSwitching": 0.75,
      "decisionSpeed": 0.8,
      "decisionQuality": 0.6,
      "pressureStability": 0.5,
      "recovery": 0.55
    },
    "minimumRequirements": {
      "clickAccuracy": 0.65,
      "inputControl": 0.55
    },
    "requirementWeights": {
      "clickAccuracy": 0.95,
      "inputControl": 0.9
    },
    "preferenceProfile": {
      "aggression": 0.75,
      "teamSupport": 0.3,
      "independence": 0.65,
      "teamCoordination": 0.5,
      "earlyGameFocus": 0.25,
      "lateGameFocus": 0.9,
      "burstPreference": 0.45,
      "sustainedCombat": 0.9,
      "reactivePlay": 0.4,
      "riskTaking": 0.75,
      "complexityEnjoyment": 0.85,
      "stabilityPreference": 0.2,
      "highVariancePreference": 0.8,
      "rangePreference": 0.75,
      "meleePreference": 0.1,
      "mapInfluencePreference": 0.25
    },
    "difficultyProfile": {
      "inputComplexity": 0.8,
      "aimDifficulty": 0.8,
      "decisionComplexity": 0.7,
      "macroRequirement": 0.5,
      "knowledgeRequirement": 0.6,
      "situationalDependence": 0.85
    },
    "strengthTags": [
      "精密操作",
      "継続戦闘"
    ],
    "riskTags": [
      "入力と判断の負荷"
    ],
    "trainingTags": [
      "clickAccuracy",
      "inputControl"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/VayneSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Vayne",
    "difficultyNote": "カイト、短い移動、対象選択、終盤の立ち位置を要求する高難度。"
  },
  {
    "championId": "nautilus",
    "championName": "ノーチラス",
    "lane": "SUPPORT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.55,
      "clickAccuracy": 0.35,
      "inputControl": 0.65,
      "prediction": 0.55,
      "attentionDistribution": 0.65,
      "taskSwitching": 0.65,
      "decisionSpeed": 0.55,
      "decisionQuality": 0.75,
      "pressureStability": 0.7,
      "recovery": 0.7
    },
    "minimumRequirements": {
      "reaction": 0.6,
      "clickAccuracy": 0.5,
      "inputControl": 0.72,
      "prediction": 0.65,
      "attentionDistribution": 0.75,
      "taskSwitching": 0.78,
      "decisionQuality": 0.82
    },
    "requirementWeights": {
      "reaction": 0.8,
      "clickAccuracy": 0.8,
      "inputControl": 0.8,
      "prediction": 0.8,
      "attentionDistribution": 0.8,
      "taskSwitching": 0.8,
      "decisionQuality": 0.8
    },
    "preferenceProfile": {
      "aggression": 0.55,
      "teamSupport": 0.85,
      "independence": 0.25,
      "teamCoordination": 0.9,
      "earlyGameFocus": 0.55,
      "lateGameFocus": 0.45,
      "burstPreference": 0.45,
      "sustainedCombat": 0.6,
      "reactivePlay": 0.65,
      "riskTaking": 0.5,
      "complexityEnjoyment": 0.55,
      "stabilityPreference": 0.65,
      "highVariancePreference": 0.45,
      "rangePreference": 0.15,
      "meleePreference": 0.85,
      "mapInfluencePreference": 0.75
    },
    "difficultyProfile": {
      "inputComplexity": 0.65,
      "aimDifficulty": 0.45,
      "decisionComplexity": 0.7,
      "macroRequirement": 0.65,
      "knowledgeRequirement": 0.55,
      "situationalDependence": 0.7
    },
    "strengthTags": [
      "エンゲージ判断",
      "味方支援"
    ],
    "riskTags": [
      "距離管理"
    ],
    "trainingTags": [
      "inputControl",
      "attentionDistribution",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/NautilusSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Nautilus",
    "difficultyNote": "フックの照準と開始後の対象選択、視野管理を要求する低中難度。"
  },
  {
    "championId": "azir",
    "championName": "アジール",
    "lane": "MID",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.85,
      "clickAccuracy": 0.85,
      "inputControl": 0.85,
      "prediction": 0.85,
      "attentionDistribution": 0.85,
      "taskSwitching": 0.85,
      "decisionSpeed": 0.85,
      "decisionQuality": 0.85,
      "pressureStability": 0.85,
      "recovery": 0.85
    },
    "minimumRequirements": {
      "reaction": 0.88,
      "clickAccuracy": 0.88,
      "inputControl": 0.88,
      "prediction": 0.88,
      "attentionDistribution": 0.88,
      "taskSwitching": 0.88,
      "decisionSpeed": 0.88,
      "decisionQuality": 0.88,
      "pressureStability": 0.88,
      "recovery": 0.88
    },
    "requirementWeights": {
      "reaction": 0.8,
      "clickAccuracy": 0.8,
      "inputControl": 0.8,
      "prediction": 0.8,
      "attentionDistribution": 0.8,
      "taskSwitching": 0.8,
      "decisionSpeed": 0.8,
      "decisionQuality": 0.8,
      "pressureStability": 0.8,
      "recovery": 0.8
    },
    "preferenceProfile": {
      "aggression": 0.5,
      "teamSupport": 0.5,
      "independence": 0.5,
      "teamCoordination": 0.5,
      "earlyGameFocus": 0.5,
      "lateGameFocus": 0.5,
      "burstPreference": 0.5,
      "sustainedCombat": 0.5,
      "reactivePlay": 0.5,
      "riskTaking": 0.5,
      "complexityEnjoyment": 0.5,
      "stabilityPreference": 0.5,
      "highVariancePreference": 0.5,
      "rangePreference": 0.5,
      "meleePreference": 0.5,
      "mapInfluencePreference": 0.5
    },
    "difficultyProfile": {
      "inputComplexity": 0.9,
      "aimDifficulty": 0.85,
      "decisionComplexity": 0.9,
      "macroRequirement": 0.85,
      "knowledgeRequirement": 0.9,
      "situationalDependence": 0.9
    },
    "strengthTags": [
      "高度な操作",
      "長期の伸びしろ"
    ],
    "riskTags": [
      "入力負荷",
      "判断密度"
    ],
    "trainingTags": [
      "inputControl",
      "taskSwitching",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/AzirSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Azir",
    "difficultyNote": "兵士の位置、複数対象、連続入力、長期的な射程管理を要求する非常に高い難度。"
  },
  {
    "championId": "aatrox",
    "championName": "エイトロックス",
    "lane": "TOP",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.75,
      "clickAccuracy": 0.55,
      "inputControl": 0.75,
      "prediction": 0.8,
      "attentionDistribution": 0.55,
      "taskSwitching": 0.65,
      "decisionSpeed": 0.7,
      "decisionQuality": 0.75,
      "pressureStability": 0.8,
      "recovery": 0.75
    },
    "minimumRequirements": {
      "prediction": 0.55,
      "inputControl": 0.5,
      "decisionQuality": 0.55
    },
    "requirementWeights": {
      "prediction": 0.9,
      "inputControl": 0.8,
      "decisionQuality": 0.85
    },
    "preferenceProfile": {
      "aggression": 0.8,
      "meleePreference": 0.95,
      "sustainedCombat": 0.9,
      "riskTaking": 0.75,
      "complexityEnjoyment": 0.7,
      "teamCoordination": 0.45
    },
    "difficultyProfile": {
      "inputComplexity": 0.78,
      "aimDifficulty": 0.55,
      "decisionComplexity": 0.75,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.75,
      "situationalDependence": 0.8
    },
    "strengthTags": [
      "間合い管理",
      "継続戦闘"
    ],
    "riskTags": [
      "Q先端の精度",
      "無理な継続戦闘"
    ],
    "trainingTags": [
      "prediction",
      "inputControl",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/AatroxSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Aatrox",
    "difficultyNote": "LoLJPWikiの考察にあるQの先端管理、間合い、回復を含む継続戦闘を踏まえた高難度。"
  },
  {
    "championId": "garen",
    "championName": "ガレン",
    "lane": "TOP",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.4,
      "clickAccuracy": 0.25,
      "inputControl": 0.3,
      "prediction": 0.4,
      "attentionDistribution": 0.5,
      "taskSwitching": 0.35,
      "decisionSpeed": 0.45,
      "decisionQuality": 0.65,
      "pressureStability": 0.8,
      "recovery": 0.8
    },
    "minimumRequirements": {
      "decisionQuality": 0.4,
      "pressureStability": 0.45
    },
    "requirementWeights": {
      "decisionQuality": 0.8,
      "pressureStability": 0.8
    },
    "preferenceProfile": {
      "stabilityPreference": 0.9,
      "meleePreference": 0.85,
      "sustainedCombat": 0.65,
      "complexityEnjoyment": 0.2,
      "teamCoordination": 0.55
    },
    "difficultyProfile": {
      "inputComplexity": 0.25,
      "aimDifficulty": 0.2,
      "decisionComplexity": 0.35,
      "macroRequirement": 0.4,
      "knowledgeRequirement": 0.35,
      "situationalDependence": 0.4
    },
    "strengthTags": [
      "基本操作の習得",
      "安定した交換"
    ],
    "riskTags": [
      "逃げ道の少なさ",
      "後半の射程差"
    ],
    "trainingTags": [
      "decisionQuality",
      "pressureStability"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/GarenSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Garen",
    "difficultyNote": "基本操作は易しく、短い交換、耐久、撤退判断を学びやすい低難度。"
  },
  {
    "championId": "darius",
    "championName": "ダリウス",
    "lane": "TOP",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.55,
      "clickAccuracy": 0.4,
      "inputControl": 0.5,
      "prediction": 0.6,
      "attentionDistribution": 0.55,
      "taskSwitching": 0.45,
      "decisionSpeed": 0.55,
      "decisionQuality": 0.7,
      "pressureStability": 0.7,
      "recovery": 0.65
    },
    "minimumRequirements": {
      "prediction": 0.45,
      "decisionQuality": 0.5
    },
    "requirementWeights": {
      "prediction": 0.75,
      "decisionQuality": 0.85
    },
    "preferenceProfile": {
      "aggression": 0.85,
      "meleePreference": 0.95,
      "sustainedCombat": 0.85,
      "earlyGameFocus": 0.75,
      "riskTaking": 0.65
    },
    "difficultyProfile": {
      "inputComplexity": 0.45,
      "aimDifficulty": 0.35,
      "decisionComplexity": 0.6,
      "macroRequirement": 0.45,
      "knowledgeRequirement": 0.55,
      "situationalDependence": 0.65
    },
    "strengthTags": [
      "レーン圧力",
      "近接の継続火力"
    ],
    "riskTags": [
      "間合いの失敗",
      "追い過ぎ"
    ],
    "trainingTags": [
      "prediction",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/DariusSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Darius",
    "difficultyNote": "Qの外周、引き寄せ、スタックとキル順を管理する中難度。"
  },
  {
    "championId": "zed",
    "championName": "ゼド",
    "lane": "MID",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.8,
      "clickAccuracy": 0.8,
      "inputControl": 0.8,
      "prediction": 0.75,
      "attentionDistribution": 0.6,
      "taskSwitching": 0.75,
      "decisionSpeed": 0.85,
      "decisionQuality": 0.7,
      "pressureStability": 0.45,
      "recovery": 0.55
    },
    "minimumRequirements": {
      "inputControl": 0.65,
      "clickAccuracy": 0.6,
      "decisionSpeed": 0.6
    },
    "requirementWeights": {
      "inputControl": 0.9,
      "clickAccuracy": 0.85,
      "decisionSpeed": 0.85
    },
    "preferenceProfile": {
      "aggression": 0.85,
      "independence": 0.8,
      "burstPreference": 0.9,
      "riskTaking": 0.85,
      "complexityEnjoyment": 0.8,
      "highVariancePreference": 0.85
    },
    "difficultyProfile": {
      "inputComplexity": 0.85,
      "aimDifficulty": 0.75,
      "decisionComplexity": 0.8,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.7,
      "situationalDependence": 0.9
    },
    "strengthTags": [
      "瞬間火力",
      "影による選択肢"
    ],
    "riskTags": [
      "突入後の退路",
      "対象選択の失敗"
    ],
    "trainingTags": [
      "inputControl",
      "decisionSpeed",
      "prediction"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/ZedSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Zed",
    "difficultyNote": "影の位置、手裏剣照準、複数の戻り先とリスク判断を要求する高難度。"
  },
  {
    "championId": "syndra",
    "championName": "シンドラ",
    "lane": "MID",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.6,
      "clickAccuracy": 0.8,
      "inputControl": 0.55,
      "prediction": 0.8,
      "attentionDistribution": 0.7,
      "taskSwitching": 0.55,
      "decisionSpeed": 0.6,
      "decisionQuality": 0.8,
      "pressureStability": 0.65,
      "recovery": 0.6
    },
    "minimumRequirements": {
      "clickAccuracy": 0.6,
      "prediction": 0.6,
      "decisionQuality": 0.55
    },
    "requirementWeights": {
      "clickAccuracy": 0.9,
      "prediction": 0.85,
      "decisionQuality": 0.8
    },
    "preferenceProfile": {
      "rangePreference": 0.8,
      "burstPreference": 0.75,
      "teamCoordination": 0.55,
      "complexityEnjoyment": 0.7,
      "stabilityPreference": 0.55
    },
    "difficultyProfile": {
      "inputComplexity": 0.55,
      "aimDifficulty": 0.8,
      "decisionComplexity": 0.75,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.65,
      "situationalDependence": 0.75
    },
    "strengthTags": [
      "射程とゾーニング",
      "対象選択"
    ],
    "riskTags": [
      "スキル外し",
      "球の位置管理"
    ],
    "trainingTags": [
      "clickAccuracy",
      "prediction",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/SyndraSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Syndra",
    "difficultyNote": "球の配置、スキルショット、射程、スタックを扱う中高難度。"
  },
  {
    "championId": "vi",
    "championName": "ヴァイ",
    "lane": "JUNGLE",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.65,
      "clickAccuracy": 0.45,
      "inputControl": 0.55,
      "prediction": 0.55,
      "attentionDistribution": 0.7,
      "taskSwitching": 0.6,
      "decisionSpeed": 0.65,
      "decisionQuality": 0.75,
      "pressureStability": 0.7,
      "recovery": 0.7
    },
    "minimumRequirements": {
      "attentionDistribution": 0.5,
      "decisionQuality": 0.55
    },
    "requirementWeights": {
      "attentionDistribution": 0.8,
      "decisionQuality": 0.9
    },
    "preferenceProfile": {
      "aggression": 0.7,
      "mapInfluencePreference": 0.85,
      "teamCoordination": 0.75,
      "earlyGameFocus": 0.65,
      "meleePreference": 0.8
    },
    "difficultyProfile": {
      "inputComplexity": 0.5,
      "aimDifficulty": 0.45,
      "decisionComplexity": 0.65,
      "macroRequirement": 0.75,
      "knowledgeRequirement": 0.6,
      "situationalDependence": 0.7
    },
    "strengthTags": [
      "開始判断",
      "マップへの影響"
    ],
    "riskTags": [
      "突入後の孤立",
      "対象の優先順位"
    ],
    "trainingTags": [
      "attentionDistribution",
      "decisionQuality"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/ViSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Vi",
    "difficultyNote": "操作は学びやすいが、視野、突入対象、退路と開始タイミングを判断する中難度。"
  },
  {
    "championId": "warwick",
    "championName": "ワーウィック",
    "lane": "JUNGLE",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.5,
      "clickAccuracy": 0.3,
      "inputControl": 0.35,
      "prediction": 0.45,
      "attentionDistribution": 0.65,
      "taskSwitching": 0.45,
      "decisionSpeed": 0.5,
      "decisionQuality": 0.65,
      "pressureStability": 0.8,
      "recovery": 0.85
    },
    "minimumRequirements": {
      "attentionDistribution": 0.45,
      "pressureStability": 0.5
    },
    "requirementWeights": {
      "attentionDistribution": 0.75,
      "pressureStability": 0.85
    },
    "preferenceProfile": {
      "stabilityPreference": 0.8,
      "mapInfluencePreference": 0.75,
      "sustainedCombat": 0.75,
      "reactivePlay": 0.65,
      "meleePreference": 0.8
    },
    "difficultyProfile": {
      "inputComplexity": 0.3,
      "aimDifficulty": 0.25,
      "decisionComplexity": 0.45,
      "macroRequirement": 0.65,
      "knowledgeRequirement": 0.45,
      "situationalDependence": 0.5
    },
    "strengthTags": [
      "回復力",
      "追跡と開始"
    ],
    "riskTags": [
      "追跡のし過ぎ",
      "視野不足"
    ],
    "trainingTags": [
      "recovery",
      "attentionDistribution"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/WarwickSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Warwick",
    "difficultyNote": "低体力時の回復と追跡を活かしやすく、基本的なマップ判断を学ぶ低中難度。"
  },
  {
    "championId": "jinx",
    "championName": "ジンクス",
    "lane": "BOT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.7,
      "clickAccuracy": 0.8,
      "inputControl": 0.55,
      "prediction": 0.7,
      "attentionDistribution": 0.7,
      "taskSwitching": 0.6,
      "decisionSpeed": 0.65,
      "decisionQuality": 0.65,
      "pressureStability": 0.6,
      "recovery": 0.6
    },
    "minimumRequirements": {
      "clickAccuracy": 0.55,
      "attentionDistribution": 0.5
    },
    "requirementWeights": {
      "clickAccuracy": 0.9,
      "attentionDistribution": 0.75
    },
    "preferenceProfile": {
      "rangePreference": 0.85,
      "lateGameFocus": 0.8,
      "teamCoordination": 0.7,
      "sustainedCombat": 0.75,
      "highVariancePreference": 0.6
    },
    "difficultyProfile": {
      "inputComplexity": 0.5,
      "aimDifficulty": 0.7,
      "decisionComplexity": 0.55,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.5,
      "situationalDependence": 0.65
    },
    "strengthTags": [
      "射程切替",
      "集団戦の加速"
    ],
    "riskTags": [
      "立ち位置",
      "逃げ手段の少なさ"
    ],
    "trainingTags": [
      "clickAccuracy",
      "attentionDistribution"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/JinxSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Jinx",
    "difficultyNote": "通常攻撃の対象選択、射程切替、集団戦の位置取りを要求する中難度。"
  },
  {
    "championId": "ezreal",
    "championName": "エズリアル",
    "lane": "BOT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.7,
      "clickAccuracy": 0.92,
      "inputControl": 0.65,
      "prediction": 0.85,
      "attentionDistribution": 0.65,
      "taskSwitching": 0.55,
      "decisionSpeed": 0.65,
      "decisionQuality": 0.6,
      "pressureStability": 0.55,
      "recovery": 0.6
    },
    "minimumRequirements": {
      "clickAccuracy": 0.7,
      "prediction": 0.65
    },
    "requirementWeights": {
      "clickAccuracy": 0.95,
      "prediction": 0.9
    },
    "preferenceProfile": {
      "rangePreference": 0.9,
      "independence": 0.65,
      "complexityEnjoyment": 0.75,
      "riskTaking": 0.5,
      "lateGameFocus": 0.65
    },
    "difficultyProfile": {
      "inputComplexity": 0.65,
      "aimDifficulty": 0.92,
      "decisionComplexity": 0.65,
      "macroRequirement": 0.5,
      "knowledgeRequirement": 0.55,
      "situationalDependence": 0.8
    },
    "strengthTags": [
      "スキルショット精度",
      "安全な射程"
    ],
    "riskTags": [
      "命中率への依存",
      "火力の遅れ"
    ],
    "trainingTags": [
      "clickAccuracy",
      "prediction"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/EzrealSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Ezreal",
    "difficultyNote": "複数のスキルショットを当て続け、移動スキルを温存する高い照準難度。"
  },
  {
    "championId": "kai-sa",
    "championName": "カイ＝サ",
    "lane": "BOT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.75,
      "clickAccuracy": 0.75,
      "inputControl": 0.7,
      "prediction": 0.65,
      "attentionDistribution": 0.65,
      "taskSwitching": 0.65,
      "decisionSpeed": 0.7,
      "decisionQuality": 0.75,
      "pressureStability": 0.55,
      "recovery": 0.6
    },
    "minimumRequirements": {
      "clickAccuracy": 0.55,
      "decisionQuality": 0.6,
      "taskSwitching": 0.5
    },
    "requirementWeights": {
      "clickAccuracy": 0.85,
      "decisionQuality": 0.85,
      "taskSwitching": 0.75
    },
    "preferenceProfile": {
      "rangePreference": 0.65,
      "burstPreference": 0.7,
      "sustainedCombat": 0.65,
      "riskTaking": 0.7,
      "complexityEnjoyment": 0.7,
      "highVariancePreference": 0.7
    },
    "difficultyProfile": {
      "inputComplexity": 0.7,
      "aimDifficulty": 0.7,
      "decisionComplexity": 0.75,
      "macroRequirement": 0.55,
      "knowledgeRequirement": 0.7,
      "situationalDependence": 0.8
    },
    "strengthTags": [
      "対象選択",
      "突入と撤退"
    ],
    "riskTags": [
      "孤立した突入",
      "進化条件の遅れ"
    ],
    "trainingTags": [
      "decisionQuality",
      "taskSwitching",
      "clickAccuracy"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/KaiSaSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Kai'Sa",
    "difficultyNote": "射程、進化条件、対象選択、突入と撤退を切り替える中高難度。"
  },
  {
    "championId": "leona",
    "championName": "レオナ",
    "lane": "SUPPORT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.65,
      "clickAccuracy": 0.35,
      "inputControl": 0.55,
      "prediction": 0.6,
      "attentionDistribution": 0.7,
      "taskSwitching": 0.55,
      "decisionSpeed": 0.65,
      "decisionQuality": 0.8,
      "pressureStability": 0.8,
      "recovery": 0.75
    },
    "minimumRequirements": {
      "attentionDistribution": 0.5,
      "decisionQuality": 0.55
    },
    "requirementWeights": {
      "attentionDistribution": 0.8,
      "decisionQuality": 0.9
    },
    "preferenceProfile": {
      "teamSupport": 0.85,
      "teamCoordination": 0.9,
      "aggression": 0.7,
      "meleePreference": 0.85,
      "mapInfluencePreference": 0.7
    },
    "difficultyProfile": {
      "inputComplexity": 0.45,
      "aimDifficulty": 0.35,
      "decisionComplexity": 0.6,
      "macroRequirement": 0.6,
      "knowledgeRequirement": 0.5,
      "situationalDependence": 0.7
    },
    "strengthTags": [
      "エンゲージ",
      "味方の開始点"
    ],
    "riskTags": [
      "仕掛けの早過ぎ",
      "退路の不足"
    ],
    "trainingTags": [
      "decisionQuality",
      "attentionDistribution"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/LeonaSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Leona",
    "difficultyNote": "仕掛けるタイミングと味方の追撃を合わせる、学びやすい中難度。"
  },
  {
    "championId": "lulu",
    "championName": "ルル",
    "lane": "SUPPORT",
    "profileMode": "explicit",
    "styleProfile": {
      "reaction": 0.55,
      "clickAccuracy": 0.45,
      "inputControl": 0.4,
      "prediction": 0.55,
      "attentionDistribution": 0.85,
      "taskSwitching": 0.65,
      "decisionSpeed": 0.55,
      "decisionQuality": 0.85,
      "pressureStability": 0.8,
      "recovery": 0.8
    },
    "minimumRequirements": {
      "attentionDistribution": 0.55,
      "decisionQuality": 0.6
    },
    "requirementWeights": {
      "attentionDistribution": 0.9,
      "decisionQuality": 0.95
    },
    "preferenceProfile": {
      "teamSupport": 0.95,
      "teamCoordination": 0.95,
      "reactivePlay": 0.9,
      "stabilityPreference": 0.85,
      "rangePreference": 0.65
    },
    "difficultyProfile": {
      "inputComplexity": 0.4,
      "aimDifficulty": 0.35,
      "decisionComplexity": 0.7,
      "macroRequirement": 0.6,
      "knowledgeRequirement": 0.6,
      "situationalDependence": 0.8
    },
    "strengthTags": [
      "味方の保護",
      "反応的な判断"
    ],
    "riskTags": [
      "対象選択",
      "自分の位置取り"
    ],
    "trainingTags": [
      "attentionDistribution",
      "decisionQuality",
      "recovery"
    ],
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/LuluSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Lulu",
    "difficultyNote": "味方と敵へ同じ資源を使い分ける反応・優先順位判断の中難度。"
  }
];

export const CHAMPION_METADATA = [
  {
    "championId": "gragas",
    "championName": "Gragas",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/GragasSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Gragas",
    "difficultyNote": "スキルショット、当て方の変化、位置取りと味方連携を同時に扱う中難度。"
  },
  {
    "championId": "ahri",
    "championName": "Ahri",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/AhriSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Ahri",
    "difficultyNote": "スキルショットと移動スキルの判断が中心の中難度。"
  },
  {
    "championId": "orianna",
    "championName": "Orianna",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/OriannaSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Orianna",
    "difficultyNote": "ボール位置、味方との連携、集団戦の判断を継続して管理する中高難度。"
  },
  {
    "championId": "lee-sin",
    "championName": "Lee Sin",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/LeeSinSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Lee Sin",
    "difficultyNote": "連続入力、視野、コンボ分岐、序盤のマップ判断を要求する高難度。"
  },
  {
    "championId": "sejuani",
    "championName": "Sejuani",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/SejuaniSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Sejuani",
    "difficultyNote": "操作よりも視野、開始判断、味方との連携を重視する中難度。"
  },
  {
    "championId": "caitlyn",
    "championName": "Caitlyn",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/CaitlynSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Caitlyn",
    "difficultyNote": "射程管理と細かな通常攻撃、罠の配置を要求する中難度。"
  },
  {
    "championId": "thresh",
    "championName": "Thresh",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/ThreshSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Thresh",
    "difficultyNote": "フックの照準、味方救援、視野と集団戦判断を同時に扱う中高難度。"
  },
  {
    "championId": "malphite",
    "championName": "Malphite",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/MalphiteSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Malphite",
    "difficultyNote": "基本操作は易しく、仕掛けるタイミングと耐える判断が中心の低中難度。"
  },
  {
    "championId": "yasuo",
    "championName": "Yasuo",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/YasuoSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Yasuo",
    "difficultyNote": "移動を伴う連続入力、間合い、風の壁と戦闘継続判断を要求する高難度。"
  },
  {
    "championId": "kindred",
    "championName": "Kindred",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/KindredSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Kindred",
    "difficultyNote": "マーク、射程、ジャングル経路、アルティメット判断を同時に扱う高難度。"
  },
  {
    "championId": "milio",
    "championName": "Milio",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/MilioSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Milio",
    "difficultyNote": "味方の状態を見て強化と解除を選ぶ反応的な中難度。"
  },
  {
    "championId": "nautilus",
    "championName": "Nautilus",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/NautilusSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Nautilus",
    "difficultyNote": "フックの照準と開始後の対象選択、視野管理を要求する低中難度。"
  },
  {
    "championId": "azir",
    "championName": "Azir",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/AzirSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Azir",
    "difficultyNote": "兵士の位置、複数対象、連続入力、長期的な射程管理を要求する非常に高い難度。"
  },
  {
    "championId": "vayne",
    "championName": "Vayne",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/VayneSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Vayne",
    "difficultyNote": "カイト、短い移動、対象選択、終盤の立ち位置を要求する高難度。"
  },
  {
    "championId": "aatrox",
    "championName": "Aatrox",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/AatroxSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Aatrox",
    "difficultyNote": "LoLJPWikiの考察にあるQの先端管理、間合い、回復を含む継続戦闘を踏まえた高難度。"
  },
  {
    "championId": "garen",
    "championName": "Garen",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/GarenSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Garen",
    "difficultyNote": "基本操作は易しく、短い交換、耐久、撤退判断を学びやすい低難度。"
  },
  {
    "championId": "darius",
    "championName": "Darius",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/DariusSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Darius",
    "difficultyNote": "Qの外周、引き寄せ、スタックとキル順を管理する中難度。"
  },
  {
    "championId": "zed",
    "championName": "Zed",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/ZedSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Zed",
    "difficultyNote": "影の位置、手裏剣照準、複数の戻り先とリスク判断を要求する高難度。"
  },
  {
    "championId": "syndra",
    "championName": "Syndra",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/SyndraSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Syndra",
    "difficultyNote": "球の配置、スキルショット、射程、スタックを扱う中高難度。"
  },
  {
    "championId": "vi",
    "championName": "Vi",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/ViSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Vi",
    "difficultyNote": "操作は学びやすいが、視野、突入対象、退路と開始タイミングを判断する中難度。"
  },
  {
    "championId": "warwick",
    "championName": "Warwick",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/WarwickSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Warwick",
    "difficultyNote": "低体力時の回復と追跡を活かしやすく、基本的なマップ判断を学ぶ低中難度。"
  },
  {
    "championId": "jinx",
    "championName": "Jinx",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/JinxSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Jinx",
    "difficultyNote": "通常攻撃の対象選択、射程切替、集団戦の位置取りを要求する中難度。"
  },
  {
    "championId": "ezreal",
    "championName": "Ezreal",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/EzrealSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Ezreal",
    "difficultyNote": "複数のスキルショットを当て続け、移動スキルを温存する高い照準難度。"
  },
  {
    "championId": "kai-sa",
    "championName": "Kai'Sa",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/KaiSaSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Kai'Sa",
    "difficultyNote": "射程、進化条件、対象選択、突入と撤退を切り替える中高難度。"
  },
  {
    "championId": "leona",
    "championName": "Leona",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/LeonaSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Leona",
    "difficultyNote": "仕掛けるタイミングと味方の追撃を合わせる、学びやすい中難度。"
  },
  {
    "championId": "lulu",
    "championName": "Lulu",
    "iconUrl": "https://wiki.leagueoflegends.com/en-us/Special:FilePath/LuluSquare.png",
    "wikiUrl": "https://wiki.leagueoflegends.com/en-us/Lulu",
    "difficultyNote": "味方と敵へ同じ資源を使い分ける反応・優先順位判断の中難度。"
  }
] as const;

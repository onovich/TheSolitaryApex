export const DEFAULT_LANGUAGE = "zh-CN";

export const LANGUAGE_OPTIONS = [
  { id: "zh-CN", shortLabel: "中", label: "简体中文" },
  { id: "en", shortLabel: "EN", label: "English" },
  { id: "ja", shortLabel: "日本", label: "日本語" },
  { id: "es", shortLabel: "ES", label: "Español" },
  { id: "pt-BR", shortLabel: "BR", label: "Português BR" },
];

const TEXT_BUNDLES = {
  "zh-CN": {
    gameTitle: "孤崖",
    languageLabel: "语言",
    staminaLabel: "耐力 (PUMP)",
    heightLabel: "海拔",
    heightUnit: "m",
    routeLabel: "路段",
    routeRecoveryLabel: "恢复段",
    routeReadingLabel: "读线段",
    routeExposureLabel: "风口段",
    routeCruxLabel: "卡点段",
    chalkLabel: "打镁粉",
    chalkActiveLabel: "镁粉生效中...",
    protectionCamLabel: "打保护点",
    protectionCamActiveLabel: "保护已就位",
    energyGelLabel: "能量胶",
    energyGelActiveLabel: "补给中...",
    fallLabel: "状态",
    fallDeathLabel: "坠落中",
    fallRopeLabel: "保护绳坠落",
    fallHangLabel: "保护绳悬挂，按住身体收绳",
    fallReelLabel: "收绳自救",
    launchLabel: "弹射",
    launchReadyLabel: "可弹射",
    launchPrimingLabel: "长按身体",
    launchChargingLabel: "反拉蓄势",
    launchActiveLabel: "弹射中",
    launchCooldownLabel: "冷却",
    launchCheckpointLabel: "需先打保护点",
    launchStaminaLabel: "耐力不足",
    launchHangLabel: "悬挂中不可弹射",
    launchFallLabel: "坠落中不可弹射",
    launchSupportLabel: "支撑不足",
    launchDisabledLabel: "当前不可弹射",
    recoveryLabel: "回收",
    recoveryWindowLabel: "回收窗口",
    recoveryBalanceLabel: "冲坠回收",
    recoveryExhaustionLabel: "力竭回收",
    rescueCountLabel: "保护回收",
    rescueCountUnit: "次",
    staminaCapLabel: "当前耐力上限",
    finalHeightLabel: "最终到达高度",
    restLabel: "休息",
    restSupportedLabel: "支撑休息",
    restPerfectLabel: "完美休息",
    windLabel: "风压",
    injuryLabel: "手伤",
    injuryStableLabel: "稳定",
    injuryWarnLabel: "磨损",
    injuryBloodiedLabel: "流血",
    injurySevereLabel: "重伤",
    thirstLabel: "饥渴",
    eventLabel: "环境",
    earthquakeLabel: "震动",
    avalancheLabel: "雪崩",
    pursuitLabel: "追赶",
    laneBlockerLabel: "封锁",
    ropeThreatLabel: "绳威胁",
    rescueLabel: "救援",
    rescueBurdenLabel: "救援负重",
    spatialScanLabel: "空间",
    tutorial: "拖拽手脚圆环移动到上方岩点。\n先打保护点，再长按身体并向下反拉完成弹射。",
    restart: "重新攀登",
    gameOver: {
      balance: {
        title: "冲坠",
        description: "由于支撑点不足，你失去了平衡。",
      },
      exhaustion: {
        title: "力竭",
        description: "肌肉被泵感吞噬，你再也抓不住任何东西。",
      },
    },
    loadouts: {
      steadyRack: {
        label: "稳健",
        description: "更多保护点和镁粉，弹射稍重。",
      },
      boldDyno: {
        label: "冒险",
        description: "减少保护，换取更强弹射。",
      },
      technicalShoes: {
        label: "技术",
        description: "坏点效率更好，但恢复资源更少。",
      },
      rescueSupport: {
        label: "救援",
        description: "救援路线保护更多，弹射更沉。",
      },
    },
    levels: {
      "solitary-apex-prototype": {
        label: "原型攀登",
        description: "综合恢复、读线、暴露和卡点节奏的默认长路线。",
      },
      "resource-reading-ascent": {
        label: "资源读线",
        description: "更温和的路线，用于学习果子、饥渴和诱饵判断。",
      },
      "pursuit-crux-ascent": {
        label: "追赶卡点",
        description: "更快的路线，将追赶节奏叠加到暴露和卡点决策上。",
      },
      "rescue-encounter-ascent": {
        label: "救援遭遇",
        description: "强调保护点作为协作工具的救援路线。",
      },
    },
  },
  en: {
    gameTitle: "The Solitary Apex",
    languageLabel: "Language",
    staminaLabel: "Stamina (PUMP)",
    heightLabel: "Altitude",
    heightUnit: "m",
    routeLabel: "Route",
    routeRecoveryLabel: "Recovery",
    routeReadingLabel: "Reading",
    routeExposureLabel: "Exposure",
    routeCruxLabel: "Crux",
    chalkLabel: "Chalk",
    chalkActiveLabel: "Chalk active...",
    protectionCamLabel: "Place protection",
    protectionCamActiveLabel: "Protection set",
    energyGelLabel: "Energy gel",
    energyGelActiveLabel: "Refueling...",
    fallLabel: "State",
    fallDeathLabel: "Falling",
    fallRopeLabel: "Rope fall",
    fallHangLabel: "Hanging on rope, hold body to reel in",
    fallReelLabel: "Reeling in",
    launchLabel: "Dyno",
    launchReadyLabel: "Ready",
    launchPrimingLabel: "Hold body",
    launchChargingLabel: "Charging",
    launchActiveLabel: "Airborne",
    launchCooldownLabel: "Cooldown",
    launchCheckpointLabel: "Place protection first",
    launchStaminaLabel: "Low stamina",
    launchHangLabel: "No dyno while hanging",
    launchFallLabel: "No dyno while falling",
    launchSupportLabel: "Need support",
    launchDisabledLabel: "Unavailable",
    recoveryLabel: "Recover",
    recoveryWindowLabel: "Recovery window",
    recoveryBalanceLabel: "Fall recovery",
    recoveryExhaustionLabel: "Exhaustion recovery",
    rescueCountLabel: "Rescues",
    rescueCountUnit: "",
    staminaCapLabel: "Current stamina cap",
    finalHeightLabel: "Final height",
    restLabel: "Rest",
    restSupportedLabel: "Supported rest",
    restPerfectLabel: "Perfect rest",
    windLabel: "Wind",
    injuryLabel: "Hand injury",
    injuryStableLabel: "Stable",
    injuryWarnLabel: "Worn",
    injuryBloodiedLabel: "Bloodied",
    injurySevereLabel: "Severe",
    thirstLabel: "Thirst",
    eventLabel: "Event",
    earthquakeLabel: "Quake",
    avalancheLabel: "Avalanche",
    pursuitLabel: "Pursuit",
    laneBlockerLabel: "Blocker",
    ropeThreatLabel: "Rope threat",
    rescueLabel: "Rescue",
    rescueBurdenLabel: "Rescue burden",
    spatialScanLabel: "Space",
    tutorial: "Drag hand and foot rings to holds above.\nPlace protection, then hold the body and pull down to dyno.",
    restart: "Restart",
    gameOver: {
      balance: {
        title: "Fall",
        description: "You lost balance because you did not have enough support points.",
      },
      exhaustion: {
        title: "Exhausted",
        description: "Your muscles are swallowed by pump. You cannot hold anything anymore.",
      },
    },
    loadouts: {
      steadyRack: {
        label: "Steady",
        description: "More protection and chalk, with a slightly heavier dyno cost.",
      },
      boldDyno: {
        label: "Bold",
        description: "Less protection, stronger dyno commitment.",
      },
      technicalShoes: {
        label: "Technical",
        description: "Better poor-hold efficiency, with fewer recovery resources.",
      },
      rescueSupport: {
        label: "Rescue",
        description: "More protection for rescue routes, with heavier dyno movement.",
      },
    },
    levels: {
      "solitary-apex-prototype": {
        label: "Prototype",
        description: "Default long route with recovery, reading, exposure, and crux beats.",
      },
      "resource-reading-ascent": {
        label: "Resources",
        description: "A gentler route for fruit routing, thirst pressure, and decoy recognition.",
      },
      "pursuit-crux-ascent": {
        label: "Pursuit",
        description: "A faster route stacking pursuit tempo with exposure and crux choices.",
      },
      "rescue-encounter-ascent": {
        label: "Rescue",
        description: "A route that uses protection as a collaboration tool.",
      },
    },
  },
  ja: {
    gameTitle: "孤崖",
    languageLabel: "言語",
    staminaLabel: "スタミナ (PUMP)",
    heightLabel: "高度",
    heightUnit: "m",
    routeLabel: "区間",
    routeRecoveryLabel: "回復",
    routeReadingLabel: "読解",
    routeExposureLabel: "露出",
    routeCruxLabel: "核心",
    chalkLabel: "チョーク",
    chalkActiveLabel: "チョーク有効...",
    protectionCamLabel: "支点を打つ",
    protectionCamActiveLabel: "支点設置済み",
    energyGelLabel: "エナジージェル",
    energyGelActiveLabel: "補給中...",
    fallLabel: "状態",
    fallDeathLabel: "落下中",
    fallRopeLabel: "ロープ落下",
    fallHangLabel: "ロープにぶら下がり中、体を押さえて巻き取る",
    fallReelLabel: "巻き取り中",
    launchLabel: "ダイノ",
    launchReadyLabel: "可能",
    launchPrimingLabel: "体を長押し",
    launchChargingLabel: "チャージ",
    launchActiveLabel: "跳躍中",
    launchCooldownLabel: "クールダウン",
    launchCheckpointLabel: "先に支点が必要",
    launchStaminaLabel: "スタミナ不足",
    launchHangLabel: "懸垂中は不可",
    launchFallLabel: "落下中は不可",
    launchSupportLabel: "支持不足",
    launchDisabledLabel: "使用不可",
    recoveryLabel: "回収",
    recoveryWindowLabel: "回収猶予",
    recoveryBalanceLabel: "落下回収",
    recoveryExhaustionLabel: "消耗回収",
    rescueCountLabel: "救助数",
    rescueCountUnit: "回",
    staminaCapLabel: "現在の上限",
    finalHeightLabel: "到達高度",
    restLabel: "休息",
    restSupportedLabel: "支持休息",
    restPerfectLabel: "完全休息",
    windLabel: "風圧",
    injuryLabel: "手の負傷",
    injuryStableLabel: "安定",
    injuryWarnLabel: "摩耗",
    injuryBloodiedLabel: "出血",
    injurySevereLabel: "重傷",
    thirstLabel: "渇き",
    eventLabel: "環境",
    earthquakeLabel: "振動",
    avalancheLabel: "雪崩",
    pursuitLabel: "追跡",
    laneBlockerLabel: "封鎖",
    ropeThreatLabel: "ロープ脅威",
    rescueLabel: "救助",
    rescueBurdenLabel: "救助負荷",
    spatialScanLabel: "空間",
    tutorial: "手足のリングを上のホールドへドラッグ。\n支点を打ち、体を長押しして下へ引きダイノする。",
    restart: "再挑戦",
    gameOver: {
      balance: {
        title: "墜落",
        description: "支持点が足りず、バランスを失った。",
      },
      exhaustion: {
        title: "消耗",
        description: "筋肉がパンプに飲まれ、もう何もつかめない。",
      },
    },
    loadouts: {
      steadyRack: {
        label: "堅実",
        description: "支点とチョークが多いが、ダイノは少し重い。",
      },
      boldDyno: {
        label: "大胆",
        description: "支点を減らし、強いダイノに賭ける。",
      },
      technicalShoes: {
        label: "技巧",
        description: "悪いホールドに強いが、回復資源は少ない。",
      },
      rescueSupport: {
        label: "救助",
        description: "救助ルート向けに支点が多く、動きは重い。",
      },
    },
    levels: {
      "solitary-apex-prototype": {
        label: "原型",
        description: "回復、読解、露出、核心を含む長い標準ルート。",
      },
      "resource-reading-ascent": {
        label: "資源読解",
        description: "果実、渇き、デコイ判断を学ぶ穏やかなルート。",
      },
      "pursuit-crux-ascent": {
        label: "追跡核心",
        description: "追跡テンポと露出、核心判断を重ねる速いルート。",
      },
      "rescue-encounter-ascent": {
        label: "救助遭遇",
        description: "支点を協力手段として使う救助ルート。",
      },
    },
  },
  es: {
    gameTitle: "La Cumbre Solitaria",
    languageLabel: "Idioma",
    staminaLabel: "Resistencia (PUMP)",
    heightLabel: "Altitud",
    heightUnit: "m",
    routeLabel: "Ruta",
    routeRecoveryLabel: "Recuperación",
    routeReadingLabel: "Lectura",
    routeExposureLabel: "Exposición",
    routeCruxLabel: "Crux",
    chalkLabel: "Magnesio",
    chalkActiveLabel: "Magnesio activo...",
    protectionCamLabel: "Poner seguro",
    protectionCamActiveLabel: "Seguro colocado",
    energyGelLabel: "Gel",
    energyGelActiveLabel: "Reponiendo...",
    fallLabel: "Estado",
    fallDeathLabel: "Cayendo",
    fallRopeLabel: "Caída con cuerda",
    fallHangLabel: "Colgado de la cuerda, mantén el cuerpo para recoger",
    fallReelLabel: "Recogiendo",
    launchLabel: "Dyno",
    launchReadyLabel: "Listo",
    launchPrimingLabel: "Mantén el cuerpo",
    launchChargingLabel: "Cargando",
    launchActiveLabel: "En vuelo",
    launchCooldownLabel: "Espera",
    launchCheckpointLabel: "Pon un seguro primero",
    launchStaminaLabel: "Poca resistencia",
    launchHangLabel: "No dyno colgado",
    launchFallLabel: "No dyno cayendo",
    launchSupportLabel: "Falta apoyo",
    launchDisabledLabel: "No disponible",
    recoveryLabel: "Recuperar",
    recoveryWindowLabel: "Ventana de recuperación",
    recoveryBalanceLabel: "Recuperación de caída",
    recoveryExhaustionLabel: "Recuperación por agotamiento",
    rescueCountLabel: "Rescates",
    rescueCountUnit: "",
    staminaCapLabel: "Límite actual",
    finalHeightLabel: "Altura final",
    restLabel: "Descanso",
    restSupportedLabel: "Descanso apoyado",
    restPerfectLabel: "Descanso perfecto",
    windLabel: "Viento",
    injuryLabel: "Manos",
    injuryStableLabel: "Estable",
    injuryWarnLabel: "Desgaste",
    injuryBloodiedLabel: "Sangrando",
    injurySevereLabel: "Grave",
    thirstLabel: "Sed",
    eventLabel: "Entorno",
    earthquakeLabel: "Temblor",
    avalancheLabel: "Avalancha",
    pursuitLabel: "Persecución",
    laneBlockerLabel: "Bloqueo",
    ropeThreatLabel: "Amenaza cuerda",
    rescueLabel: "Rescate",
    rescueBurdenLabel: "Carga rescate",
    spatialScanLabel: "Espacio",
    tutorial: "Arrastra los anillos de manos y pies hacia presas superiores.\nPon un seguro, mantén el cuerpo y tira hacia abajo para hacer dyno.",
    restart: "Reiniciar",
    gameOver: {
      balance: {
        title: "Caída",
        description: "Perdiste el equilibrio por falta de puntos de apoyo.",
      },
      exhaustion: {
        title: "Agotado",
        description: "El bombeo devora tus músculos. Ya no puedes agarrarte.",
      },
    },
    loadouts: {
      steadyRack: {
        label: "Seguro",
        description: "Más seguros y magnesio, con dyno algo más pesado.",
      },
      boldDyno: {
        label: "Audaz",
        description: "Menos seguros, dyno más fuerte.",
      },
      technicalShoes: {
        label: "Técnico",
        description: "Mejor en presas malas, con menos recuperación.",
      },
      rescueSupport: {
        label: "Rescate",
        description: "Más seguros para rutas de rescate, movimiento más pesado.",
      },
    },
    levels: {
      "solitary-apex-prototype": {
        label: "Prototipo",
        description: "Ruta larga con recuperación, lectura, exposición y crux.",
      },
      "resource-reading-ascent": {
        label: "Recursos",
        description: "Ruta suave para leer frutas, sed y señuelos.",
      },
      "pursuit-crux-ascent": {
        label: "Persecución",
        description: "Ruta rápida con persecución, exposición y decisiones de crux.",
      },
      "rescue-encounter-ascent": {
        label: "Rescate",
        description: "Ruta que usa seguros como herramienta de colaboración.",
      },
    },
  },
  "pt-BR": {
    gameTitle: "O Ápice Solitário",
    languageLabel: "Idioma",
    staminaLabel: "Vigor (PUMP)",
    heightLabel: "Altitude",
    heightUnit: "m",
    routeLabel: "Rota",
    routeRecoveryLabel: "Recuperação",
    routeReadingLabel: "Leitura",
    routeExposureLabel: "Exposição",
    routeCruxLabel: "Crux",
    chalkLabel: "Magnésio",
    chalkActiveLabel: "Magnésio ativo...",
    protectionCamLabel: "Colocar proteção",
    protectionCamActiveLabel: "Proteção pronta",
    energyGelLabel: "Gel",
    energyGelActiveLabel: "Repondo...",
    fallLabel: "Estado",
    fallDeathLabel: "Caindo",
    fallRopeLabel: "Queda na corda",
    fallHangLabel: "Pendurado na corda, segure o corpo para recolher",
    fallReelLabel: "Recolhendo",
    launchLabel: "Dyno",
    launchReadyLabel: "Pronto",
    launchPrimingLabel: "Segure o corpo",
    launchChargingLabel: "Carregando",
    launchActiveLabel: "No ar",
    launchCooldownLabel: "Recarga",
    launchCheckpointLabel: "Coloque proteção primeiro",
    launchStaminaLabel: "Pouco vigor",
    launchHangLabel: "Sem dyno pendurado",
    launchFallLabel: "Sem dyno caindo",
    launchSupportLabel: "Falta apoio",
    launchDisabledLabel: "Indisponível",
    recoveryLabel: "Recuperar",
    recoveryWindowLabel: "Janela de recuperação",
    recoveryBalanceLabel: "Recuperação de queda",
    recoveryExhaustionLabel: "Recuperação por exaustão",
    rescueCountLabel: "Resgates",
    rescueCountUnit: "",
    staminaCapLabel: "Limite atual",
    finalHeightLabel: "Altura final",
    restLabel: "Descanso",
    restSupportedLabel: "Descanso apoiado",
    restPerfectLabel: "Descanso perfeito",
    windLabel: "Vento",
    injuryLabel: "Mãos",
    injuryStableLabel: "Estável",
    injuryWarnLabel: "Desgaste",
    injuryBloodiedLabel: "Sangrando",
    injurySevereLabel: "Grave",
    thirstLabel: "Sede",
    eventLabel: "Ambiente",
    earthquakeLabel: "Tremor",
    avalancheLabel: "Avalanche",
    pursuitLabel: "Perseguição",
    laneBlockerLabel: "Bloqueio",
    ropeThreatLabel: "Ameaça corda",
    rescueLabel: "Resgate",
    rescueBurdenLabel: "Peso resgate",
    spatialScanLabel: "Espaço",
    tutorial: "Arraste os anéis de mãos e pés para agarras acima.\nColoque proteção, segure o corpo e puxe para baixo para fazer dyno.",
    restart: "Reiniciar",
    gameOver: {
      balance: {
        title: "Queda",
        description: "Você perdeu o equilíbrio por falta de pontos de apoio.",
      },
      exhaustion: {
        title: "Exausto",
        description: "O pump engole seus músculos. Você não consegue segurar mais nada.",
      },
    },
    loadouts: {
      steadyRack: {
        label: "Seguro",
        description: "Mais proteção e magnésio, com dyno um pouco mais pesado.",
      },
      boldDyno: {
        label: "Ousado",
        description: "Menos proteção, dyno mais forte.",
      },
      technicalShoes: {
        label: "Técnico",
        description: "Melhor em agarras ruins, com menos recursos de recuperação.",
      },
      rescueSupport: {
        label: "Resgate",
        description: "Mais proteção para rotas de resgate, movimento mais pesado.",
      },
    },
    levels: {
      "solitary-apex-prototype": {
        label: "Protótipo",
        description: "Rota longa com recuperação, leitura, exposição e crux.",
      },
      "resource-reading-ascent": {
        label: "Recursos",
        description: "Rota suave para ler frutas, sede e iscas.",
      },
      "pursuit-crux-ascent": {
        label: "Perseguição",
        description: "Rota rápida com perseguição, exposição e decisões de crux.",
      },
      "rescue-encounter-ascent": {
        label: "Resgate",
        description: "Rota que usa proteção como ferramenta de colaboração.",
      },
    },
  },
};

const ITEM_TEXT_KEY_BY_ID = {
  chalk: ["chalkLabel", "chalkActiveLabel"],
  protectionCam: ["protectionCamLabel", "protectionCamActiveLabel"],
  energyGel: ["energyGelLabel", "energyGelActiveLabel"],
};

export function normalizeLanguage(language) {
  return LANGUAGE_OPTIONS.some((option) => option.id === language) ? language : DEFAULT_LANGUAGE;
}

export function getTextBundle(language = DEFAULT_LANGUAGE) {
  return TEXT_BUNDLES[normalizeLanguage(language)];
}

export function getLoadoutText(loadoutId, language = DEFAULT_LANGUAGE) {
  const text = getTextBundle(language);
  return text.loadouts[loadoutId] ?? TEXT_BUNDLES[DEFAULT_LANGUAGE].loadouts[loadoutId];
}

export function getLevelText(levelId, language = DEFAULT_LANGUAGE) {
  const text = getTextBundle(language);
  return text.levels[levelId] ?? TEXT_BUNDLES[DEFAULT_LANGUAGE].levels[levelId];
}

export function getItemLabel(item, language = DEFAULT_LANGUAGE) {
  const text = getTextBundle(language);
  const [idleKey, activeKey] = ITEM_TEXT_KEY_BY_ID[item.id] ?? [];
  const label = item.active ? text[activeKey] : text[idleKey];

  if (item.active && typeof item.channelProgressRatio === "number") {
    return `${label} ${Math.round(item.channelProgressRatio * 100)}%`;
  }

  return label ?? item.id;
}

export function getGameOverText(reason, language = DEFAULT_LANGUAGE) {
  const text = getTextBundle(language);
  return text.gameOver[reason] ?? TEXT_BUNDLES[DEFAULT_LANGUAGE].gameOver[reason];
}

export function getAllTextBundles() {
  return TEXT_BUNDLES;
}

export const UI_TEXT = TEXT_BUNDLES[DEFAULT_LANGUAGE];
export const GAME_OVER_TEXT = TEXT_BUNDLES[DEFAULT_LANGUAGE].gameOver;

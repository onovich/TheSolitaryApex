import { useEffect, useMemo, useState } from "react";
import { ITEM_ORDER } from "../../data/itemCatalog";
import { getLevelConfig, validateLevelConfig } from "../../data/levelConfig";
import { ESTIMATED_FRAMES_PER_STANCE, createLevelAnalysisSnapshot } from "../../dev/levelAnalysis";
import { DEBUG_EVENT_FIELDS, formatRunDebugConfig, sanitizeRunDebugConfig } from "../../dev/runDebugConfig";
import { generateWall } from "../../logic/engine/gameEngine";

const EDITOR_TEXT = {
  "zh-CN": {
    title: "关卡配置页",
    close: "关闭",
    officialLevels: "官方关卡",
    tabs: {
      start: "起始",
      route: "路线",
      events: "事件",
      validation: "验证",
    },
    startTitle: "测试起始状态",
    routePresetLabel: "路线预设",
    startingItemsTitle: "初始物资",
    enabledEventsTitle: "启用事件",
    applyRunConfigLabel: "应用起始状态并重开",
    routeTitle: "路线结构",
    routeSequenceLabel: "分区序列",
    wallHeightLabel: "墙高",
    seedLabel: "种子",
    templateLabel: "模板",
    spatialLabel: "空间实验",
    zonesTitle: "分区参数",
    eventsTitle: "事件编排",
    environmentEventsLabel: "环境事件",
    pursuitLabel: "追赶",
    ropeThreatLabel: "绳索威胁",
    rescueTargetsLabel: "救援目标",
    laneBlockersLabel: "阻塞点",
    draftTitle: "关卡草稿 JSON",
    draftHint: "当前版本先支持本地草稿编辑、复制和检查，不直接写回项目配置。",
    copyJsonLabel: "复制 JSON",
    resetDraftLabel: "重置草稿",
    importDraftLabel: "应用草稿",
    draftAppliedMessage: "已应用草稿",
    draftResetMessage: "已重置草稿",
    draftInvalidMessage: "草稿 JSON 无效",
    draftCopiedMessage: "已复制 JSON",
    validationTitle: "验证摘要",
    actualVsTargetLabel: "实际 / 目标",
    pressureWindowLabel: "压力窗口",
    fruitWindowLabel: "果子窗口",
    fruitGapLabel: "果子间隔",
    goldenPathLabel: "主线路径安全",
    contentLabel: "内容统计",
    timelineLabel: "事件时间线",
    ok: "正常",
    low: "偏低",
    high: "偏高",
    danger: "违规",
  },
  en: {
    title: "Level Config",
    close: "Close",
    officialLevels: "Official levels",
    tabs: {
      start: "Start",
      route: "Route",
      events: "Events",
      validation: "Validation",
    },
    startTitle: "Run start state",
    routePresetLabel: "Route preset",
    startingItemsTitle: "Starting items",
    enabledEventsTitle: "Enabled events",
    applyRunConfigLabel: "Apply and restart",
    routeTitle: "Route structure",
    routeSequenceLabel: "Zone sequence",
    wallHeightLabel: "Wall height",
    seedLabel: "Seed",
    templateLabel: "Template",
    spatialLabel: "Spatial experiment",
    zonesTitle: "Zone parameters",
    eventsTitle: "Event layout",
    environmentEventsLabel: "Environment events",
    pursuitLabel: "Pursuit",
    ropeThreatLabel: "Rope threat",
    rescueTargetsLabel: "Rescue targets",
    laneBlockersLabel: "Lane blockers",
    draftTitle: "Level draft JSON",
    draftHint: "This first pass supports local draft editing, copy, and inspection, but does not write back into project config yet.",
    copyJsonLabel: "Copy JSON",
    resetDraftLabel: "Reset draft",
    importDraftLabel: "Apply draft",
    draftAppliedMessage: "Draft applied",
    draftResetMessage: "Draft reset",
    draftInvalidMessage: "Draft JSON is invalid",
    draftCopiedMessage: "Copied JSON",
    validationTitle: "Validation summary",
    actualVsTargetLabel: "Actual / target",
    pressureWindowLabel: "Pressure window",
    fruitWindowLabel: "Fruit window",
    fruitGapLabel: "Fruit gap",
    goldenPathLabel: "Golden Path safety",
    contentLabel: "Content counts",
    timelineLabel: "Timeline",
    ok: "ok",
    low: "low",
    high: "high",
    danger: "invalid",
  },
  ja: {
    title: "レベル設定",
    close: "閉じる",
    officialLevels: "公式レベル",
    tabs: {
      start: "開始",
      route: "ルート",
      events: "イベント",
      validation: "検証",
    },
    startTitle: "開始状態",
    routePresetLabel: "ルートプリセット",
    startingItemsTitle: "初期アイテム",
    enabledEventsTitle: "有効イベント",
    applyRunConfigLabel: "適用して再開",
    routeTitle: "ルート構造",
    routeSequenceLabel: "ゾーン順序",
    wallHeightLabel: "壁の高さ",
    seedLabel: "シード",
    templateLabel: "テンプレート",
    spatialLabel: "空間実験",
    zonesTitle: "ゾーン設定",
    eventsTitle: "イベント構成",
    environmentEventsLabel: "環境イベント",
    pursuitLabel: "追跡",
    ropeThreatLabel: "ロープ脅威",
    rescueTargetsLabel: "救助目標",
    laneBlockersLabel: "妨害地点",
    draftTitle: "レベル草稿 JSON",
    draftHint: "この初版では、ローカル草稿の編集・コピー・確認をサポートしますが、まだプロジェクト設定には書き戻しません。",
    copyJsonLabel: "JSON をコピー",
    resetDraftLabel: "草稿をリセット",
    importDraftLabel: "草稿を適用",
    draftAppliedMessage: "草稿を適用しました",
    draftResetMessage: "草稿をリセットしました",
    draftInvalidMessage: "草稿 JSON が無効です",
    draftCopiedMessage: "JSON をコピーしました",
    validationTitle: "検証サマリー",
    actualVsTargetLabel: "実測 / 目標",
    pressureWindowLabel: "圧力ウィンドウ",
    fruitWindowLabel: "果実ウィンドウ",
    fruitGapLabel: "果実間隔",
    goldenPathLabel: "主経路安全",
    contentLabel: "生成内容",
    timelineLabel: "タイムライン",
    ok: "正常",
    low: "低い",
    high: "高い",
    danger: "違反",
  },
  es: {
    title: "Config del nivel",
    close: "Cerrar",
    officialLevels: "Niveles oficiales",
    tabs: {
      start: "Inicio",
      route: "Ruta",
      events: "Eventos",
      validation: "Validacion",
    },
    startTitle: "Estado inicial",
    routePresetLabel: "Preajuste de ruta",
    startingItemsTitle: "Objetos iniciales",
    enabledEventsTitle: "Eventos activos",
    applyRunConfigLabel: "Aplicar y reiniciar",
    routeTitle: "Estructura de ruta",
    routeSequenceLabel: "Secuencia de zonas",
    wallHeightLabel: "Altura del muro",
    seedLabel: "Semilla",
    templateLabel: "Plantilla",
    spatialLabel: "Experimento espacial",
    zonesTitle: "Parametros de zona",
    eventsTitle: "Plan de eventos",
    environmentEventsLabel: "Eventos ambientales",
    pursuitLabel: "Persecucion",
    ropeThreatLabel: "Amenaza cuerda",
    rescueTargetsLabel: "Objetivos de rescate",
    laneBlockersLabel: "Bloqueadores",
    draftTitle: "Borrador JSON del nivel",
    draftHint: "Esta primera version permite editar, copiar e inspeccionar un borrador local, pero aun no escribe la configuracion del proyecto.",
    copyJsonLabel: "Copiar JSON",
    resetDraftLabel: "Reiniciar borrador",
    importDraftLabel: "Aplicar borrador",
    draftAppliedMessage: "Borrador aplicado",
    draftResetMessage: "Borrador reiniciado",
    draftInvalidMessage: "El JSON del borrador no es valido",
    draftCopiedMessage: "JSON copiado",
    validationTitle: "Resumen de validacion",
    actualVsTargetLabel: "Actual / objetivo",
    pressureWindowLabel: "Ventana de presion",
    fruitWindowLabel: "Ventana de fruta",
    fruitGapLabel: "Intervalo de fruta",
    goldenPathLabel: "Seguridad de ruta principal",
    contentLabel: "Conteo de contenido",
    timelineLabel: "Linea de tiempo",
    ok: "ok",
    low: "bajo",
    high: "alto",
    danger: "invalido",
  },
  "pt-BR": {
    title: "Config do nivel",
    close: "Fechar",
    officialLevels: "Niveis oficiais",
    tabs: {
      start: "Inicio",
      route: "Rota",
      events: "Eventos",
      validation: "Validacao",
    },
    startTitle: "Estado inicial",
    routePresetLabel: "Preset de rota",
    startingItemsTitle: "Itens iniciais",
    enabledEventsTitle: "Eventos ativos",
    applyRunConfigLabel: "Aplicar e reiniciar",
    routeTitle: "Estrutura da rota",
    routeSequenceLabel: "Sequencia de zonas",
    wallHeightLabel: "Altura da parede",
    seedLabel: "Semente",
    templateLabel: "Modelo",
    spatialLabel: "Experimento espacial",
    zonesTitle: "Parametros de zona",
    eventsTitle: "Plano de eventos",
    environmentEventsLabel: "Eventos ambientais",
    pursuitLabel: "Perseguicao",
    ropeThreatLabel: "Ameaca da corda",
    rescueTargetsLabel: "Alvos de resgate",
    laneBlockersLabel: "Bloqueadores",
    draftTitle: "Rascunho JSON do nivel",
    draftHint: "Esta primeira versao permite editar, copiar e inspecionar um rascunho local, mas ainda nao grava a configuracao do projeto.",
    copyJsonLabel: "Copiar JSON",
    resetDraftLabel: "Redefinir rascunho",
    importDraftLabel: "Aplicar rascunho",
    draftAppliedMessage: "Rascunho aplicado",
    draftResetMessage: "Rascunho redefinido",
    draftInvalidMessage: "O JSON do rascunho e invalido",
    draftCopiedMessage: "JSON copiado",
    validationTitle: "Resumo de validacao",
    actualVsTargetLabel: "Atual / meta",
    pressureWindowLabel: "Janela de pressao",
    fruitWindowLabel: "Janela de fruta",
    fruitGapLabel: "Intervalo da fruta",
    goldenPathLabel: "Seguranca da rota principal",
    contentLabel: "Contagem de conteudo",
    timelineLabel: "Linha do tempo",
    ok: "ok",
    low: "baixo",
    high: "alto",
    danger: "invalido",
  },
};

function getEditorText(language) {
  return EDITOR_TEXT[language] ?? EDITOR_TEXT.en;
}

function copyToClipboard(value) {
  if (!navigator.clipboard) {
    return Promise.reject(new Error("Clipboard API unavailable"));
  }

  return navigator.clipboard.writeText(value);
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function getRangeStatus(value, range) {
  if (value < range.min) {
    return "low";
  }

  if (value > range.max) {
    return "high";
  }

  return "ok";
}

function getLimitStatus(value, max) {
  return value > max ? "high" : "ok";
}

function getSummaryClassName(status) {
  return `level-editor-card${status ? ` is-${status}` : ""}`;
}

function formatRangeComparison(value, range, digits = 1) {
  return `${Number(value).toFixed(digits)} / ${range.min.toFixed(digits)} - ${range.max.toFixed(digits)}`;
}

function formatLimitComparison(value, max) {
  return `${value} / <=${max}`;
}

function createOfficialLevelAnalysis(levelId) {
  const levelConfig = getLevelConfig(levelId);
  const { holds, goldenPath, routeSegments, environmentEvents, pursuit, ropeThreat } = generateWall(1280, 720, levelId);

  return createLevelAnalysisSnapshot({
    levelConfig,
    holds,
    goldenPath,
    routeSegments,
    environmentEvents,
    pursuit,
    ropeThreat,
  });
}

function renderStatusLabel(editorText, status) {
  if (status === "low") {
    return editorText.low;
  }

  if (status === "high") {
    return editorText.high;
  }

  if (status === "danger") {
    return editorText.danger;
  }

  return editorText.ok;
}

function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

function formatConfigFragment(levelConfig) {
  return JSON.stringify(
    {
      id: levelConfig.id,
      label: levelConfig.label,
      seed: levelConfig.seed,
      wallHeight: levelConfig.wallHeight,
      environmentEvents: levelConfig.environmentEvents,
      pursuit: levelConfig.pursuit,
      ropeThreat: levelConfig.ropeThreat,
      rescueTargets: levelConfig.rescueTargets,
      laneBlockers: levelConfig.laneBlockers,
      routeGeneration: {
        zoneSequence: levelConfig.routeGeneration.zoneSequence,
        zones: levelConfig.routeGeneration.zones,
      },
    },
    null,
    2,
  );
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function getDraftTimelineMaxFrame(levelConfig, analysis) {
  const routeFrameMax = Math.max(
    ESTIMATED_FRAMES_PER_STANCE,
    Math.round((analysis?.stanceCount ?? 1) * ESTIMATED_FRAMES_PER_STANCE),
  );
  const environmentFrameMax = Math.max(
    0,
    ...(levelConfig.environmentEvents ?? []).map(
      (eventConfig) => Number(eventConfig.startFrame ?? 0) + Number(eventConfig.durationFrames ?? 0),
    ),
  );
  const pursuitFrameMax = levelConfig.pursuit
    ? Number(levelConfig.pursuit.startFrame ?? 0) + Number(levelConfig.pursuit.durationFrames ?? 0)
    : 0;
  const ropeThreatFrameMax = levelConfig.ropeThreat ? Number(levelConfig.ropeThreat.startDelayFrames ?? 0) : 0;
  const rescueFrameMax = Math.max(
    0,
    ...(levelConfig.rescueTargets ?? []).map((targetConfig) =>
      Number(targetConfig.stanceIndex ?? 0) * ESTIMATED_FRAMES_PER_STANCE,
    ),
  );
  const blockerFrameMax = Math.max(
    0,
    ...(levelConfig.laneBlockers ?? []).map((blockerConfig) =>
      Number(blockerConfig.stanceIndex ?? 0) * ESTIMATED_FRAMES_PER_STANCE,
    ),
  );

  return Math.max(routeFrameMax, environmentFrameMax, pursuitFrameMax, ropeThreatFrameMax, rescueFrameMax, blockerFrameMax);
}

function formatTimelineValue(value, unitLabel) {
  return `${Math.round(value)} ${unitLabel}`;
}

function getTimelinePercent(value, maxFrame) {
  return (clampNumber(value, 0, maxFrame) / Math.max(1, maxFrame)) * 100;
}

function TimelineRangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  unitLabel,
  onChange,
}) {
  return (
    <label className="level-editor-timeline-control">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <strong>{formatTimelineValue(value, unitLabel)}</strong>
    </label>
  );
}

function TimelineTrackRow({
  label,
  meta,
  startFrame,
  durationFrames = 0,
  maxFrame,
  accentColor,
  children,
}) {
  const markerPercent = getTimelinePercent(startFrame, maxFrame);
  const spanPercent = durationFrames > 0 ? Math.max((durationFrames / Math.max(1, maxFrame)) * 100, 1.2) : 0;
  const spanWidth = durationFrames > 0 ? Math.min(100 - markerPercent, spanPercent) : 0;

  return (
    <div className="level-editor-timeline-row" style={{ "--timeline-accent": accentColor }}>
      <div className="level-editor-timeline-row-header">
        <strong>{label}</strong>
        <span>{meta}</span>
      </div>
      <div className="level-editor-timeline-track">
        <div className="level-editor-timeline-track-grid" />
        {durationFrames > 0 ? (
          <div
            className="level-editor-timeline-span"
            style={{
              left: `${markerPercent}%`,
              width: `${spanWidth}%`,
            }}
          />
        ) : null}
        <div
          className="level-editor-timeline-marker"
          style={{
            left: `${markerPercent}%`,
          }}
        />
      </div>
      {children ? <div className="level-editor-timeline-controls">{children}</div> : null}
    </div>
  );
}

export function LevelEditorOverlay({
  open,
  onClose,
  language,
  levels,
  runDebugConfig,
  onApplyRunDebugConfig,
  text,
}) {
  const editorText = getEditorText(language);
  const [selectedLevelId, setSelectedLevelId] = useState(runDebugConfig.levelId);
  const [activeTab, setActiveTab] = useState("start");
  const [draftRunConfig, setDraftRunConfig] = useState(runDebugConfig);
  const [draftJson, setDraftJson] = useState(() => formatJson(getLevelConfig(runDebugConfig.levelId)));
  const [draftLevelConfig, setDraftLevelConfig] = useState(() => getLevelConfig(runDebugConfig.levelId));
  const [message, setMessage] = useState("");
  const routeSettingsTitle = editorText.routeSettingsTitle ?? "Route settings";
  const eventSettingsTitle = editorText.eventSettingsTitle ?? "Event settings";
  const copyFragmentLabel = editorText.copyFragmentLabel ?? "Copy config fragment";
  const fragmentCopiedMessage = editorText.fragmentCopiedMessage ?? "Config fragment copied";
  const draftValidationTitle = editorText.draftValidationTitle ?? "Draft validation";
  const draftValidationOk = editorText.draftValidationOk ?? "Draft config shape is valid";
  const timelineOverviewTitle = editorText.timelineOverviewTitle ?? "Timeline overview";
  const timelineGuideText = editorText.timelineGuideText ?? "Use the shared frame ruler to tune pacing before fine editing the numeric fields below.";
  const routeLengthLabel = editorText.routeLengthLabel ?? "Route length";
  const frameUnitLabel = editorText.frameUnitLabel ?? "frames";
  const stanceUnitLabel = editorText.stanceUnitLabel ?? "stances";
  const startLabel = editorText.startLabel ?? "Start";
  const durationLabel = editorText.durationLabel ?? "Duration";
  const delayLabel = editorText.delayLabel ?? "Delay";
  const markerLabel = editorText.markerLabel ?? "Marker";
  const noEventsLabel = editorText.noEventsLabel ?? "No scripted events in this level.";

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedLevelId(runDebugConfig.levelId);
    setDraftRunConfig(runDebugConfig);
  }, [open, runDebugConfig]);

  useEffect(() => {
    const nextLevelConfig = getLevelConfig(selectedLevelId);
    setDraftLevelConfig(nextLevelConfig);
    setDraftJson(formatJson(nextLevelConfig));
    setDraftRunConfig((currentRunConfig) => sanitizeRunDebugConfig({ levelId: selectedLevelId }, currentRunConfig));
    setMessage("");
  }, [selectedLevelId]);

  const officialAnalyses = useMemo(
    () =>
      Object.fromEntries(
        levels.map((levelOption) => [
          levelOption.id,
          createOfficialLevelAnalysis(levelOption.id),
        ]),
      ),
    [levels],
  );
  const draftValidationErrors = useMemo(() => validateLevelConfig(draftLevelConfig), [draftLevelConfig]);

  if (!open) {
    return null;
  }

  const selectedOfficialConfig = getLevelConfig(selectedLevelId);
  const selectedAnalysis = officialAnalyses[selectedLevelId];
  const itemLabels = {
    chalk: text.chalkLabel,
    protectionCam: text.protectionCamLabel,
    energyGel: text.energyGelLabel,
  };
  const windStatus = getRangeStatus(
    selectedAnalysis.pressureSummary.averageWindMultiplier,
    selectedOfficialConfig.authoring.pressureTargets.averageWindMultiplier,
  );
  const hazardStatus = getRangeStatus(
    selectedAnalysis.pressureSummary.hazardPer100Stances,
    selectedOfficialConfig.authoring.pressureTargets.hazardPer100Stances,
  );
  const resourceStatus = getRangeStatus(
    selectedAnalysis.pressureSummary.resourcePer100Stances,
    selectedOfficialConfig.authoring.pressureTargets.resourcePer100Stances,
  );
  const fruitStaminaStatus = getRangeStatus(
    selectedAnalysis.resourcePressureSummary.staminaRecoveryPer100Stances,
    selectedOfficialConfig.authoring.resourcePressureTargets.staminaRecoveryPer100Stances,
  );
  const thirstStatus = getRangeStatus(
    selectedAnalysis.resourcePressureSummary.thirstReliefPer100Stances,
    selectedOfficialConfig.authoring.resourcePressureTargets.thirstReliefPer100Stances,
  );
  const pressureWindowStatus = getLimitStatus(
    selectedAnalysis.eventDensitySummary.maxPressureEventsInWindow.count,
    selectedOfficialConfig.authoring.pressureRules.maxPressureEventsPerWindow,
  );
  const fruitWindowStatus = getLimitStatus(
    selectedAnalysis.eventDensitySummary.maxResourceFruitsInWindow.count,
    selectedOfficialConfig.authoring.pressureRules.maxResourceFruitsPerWindow,
  );
  const fruitGapStatus = getLimitStatus(
    selectedAnalysis.eventDensitySummary.resourceGapSummary.maxGapFrames,
    selectedOfficialConfig.authoring.pressureRules.maxResourceGapFrames,
  );
  const goldenStatus = selectedAnalysis.goldenPathSafetySummary.blockedGoldenHoldCount > 0 ? "danger" : "ok";
  const timelineMaxFrame = getDraftTimelineMaxFrame(draftLevelConfig, selectedAnalysis);
  const timelineMaxStance = Math.max(1, Math.ceil(timelineMaxFrame / ESTIMATED_FRAMES_PER_STANCE));
  const timelineTicks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(timelineMaxFrame * ratio)))];
  const hasTimelineRows =
    (draftLevelConfig.environmentEvents?.length ?? 0) > 0 ||
    Boolean(draftLevelConfig.pursuit) ||
    Boolean(draftLevelConfig.ropeThreat) ||
    (draftLevelConfig.rescueTargets?.length ?? 0) > 0 ||
    (draftLevelConfig.laneBlockers?.length ?? 0) > 0;

  const updateDraftLevelConfig = (updater) => {
    setDraftLevelConfig((currentConfig) => {
      const nextConfig = cloneConfig(currentConfig);
      updater(nextConfig);
      setDraftJson(formatJson(nextConfig));
      setMessage("");
      return nextConfig;
    });
  };

  const applyDraftRunConfig = () => {
    onApplyRunDebugConfig?.(draftRunConfig);
    setMessage(editorText.applyRunConfigLabel);
  };

  const copyDraftJson = () => {
    copyToClipboard(draftJson)
      .then(() => setMessage(editorText.draftCopiedMessage))
      .catch(() => setMessage(editorText.draftInvalidMessage));
  };

  const resetDraftJson = () => {
    const nextLevelConfig = getLevelConfig(selectedLevelId);
    setDraftLevelConfig(nextLevelConfig);
    setDraftJson(formatJson(nextLevelConfig));
    setMessage(editorText.draftResetMessage);
  };

  const importDraftJson = () => {
    try {
      const parsed = JSON.parse(draftJson);
      setDraftLevelConfig(parsed);
      setMessage(editorText.draftAppliedMessage);
    } catch {
      setMessage(editorText.draftInvalidMessage);
    }
  };

  const copyConfigFragment = () => {
    copyToClipboard(formatConfigFragment(draftLevelConfig))
      .then(() => setMessage(fragmentCopiedMessage))
      .catch(() => setMessage(editorText.draftInvalidMessage));
  };

  return (
    <div className="level-editor-overlay">
      <div className="level-editor-shell">
        <aside className="level-editor-sidebar">
          <div className="level-editor-sidebar-header">
            <h2>{editorText.title}</h2>
            <button type="button" onClick={onClose}>
              {editorText.close}
            </button>
          </div>
          <p className="level-editor-sidebar-label">{editorText.officialLevels}</p>
          <div className="level-editor-level-list">
            {levels.map((levelOption) => (
              <button
                key={levelOption.id}
                type="button"
                className={`level-editor-level-button${levelOption.id === selectedLevelId ? " is-active" : ""}`}
                onClick={() => setSelectedLevelId(levelOption.id)}
              >
                <strong>{text.levels[levelOption.id]?.label ?? levelOption.label}</strong>
                <span>{levelOption.id}</span>
              </button>
            ))}
          </div>
        </aside>
        <section className="level-editor-main">
          <div className="level-editor-toolbar">
            <div className="level-editor-tabs">
              {Object.entries(editorText.tabs).map(([tabKey, label]) => (
                <button
                  key={tabKey}
                  type="button"
                  className={`level-editor-tab${activeTab === tabKey ? " is-active" : ""}`}
                  onClick={() => setActiveTab(tabKey)}
                >
                  {label}
                </button>
              ))}
            </div>
            {message ? <span className="level-editor-message">{message}</span> : null}
          </div>

          {activeTab === "start" ? (
            <div className="level-editor-panel">
              <h3>{editorText.startTitle}</h3>
              <label className="level-editor-field">
                <span>{editorText.routePresetLabel}</span>
                <select
                  value={draftRunConfig.levelId}
                  onChange={(event) => {
                    setSelectedLevelId(event.target.value);
                    setDraftRunConfig((currentConfig) =>
                      sanitizeRunDebugConfig({ levelId: event.target.value }, currentConfig),
                    );
                  }}
                >
                  {levels.map((levelOption) => (
                    <option key={levelOption.id} value={levelOption.id}>
                      {text.levels[levelOption.id]?.label ?? levelOption.label}
                    </option>
                  ))}
                </select>
              </label>
              <h4>{editorText.startingItemsTitle}</h4>
              <div className="level-editor-grid">
                {ITEM_ORDER.map((itemId) => (
                  <label className="level-editor-field" key={itemId}>
                    <span>{itemLabels[itemId] ?? itemId}</span>
                    <input
                      type="number"
                      min={0}
                      max={9}
                      step={1}
                      value={draftRunConfig.startingInventory[itemId] ?? 0}
                      onChange={(event) =>
                        setDraftRunConfig((currentConfig) =>
                          sanitizeRunDebugConfig(
                            {
                              startingInventory: {
                                [itemId]: event.target.value,
                              },
                            },
                            currentConfig,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <h4>{editorText.enabledEventsTitle}</h4>
              <div className="level-editor-checks">
                {DEBUG_EVENT_FIELDS.map((field) => (
                  <label className="level-editor-check" key={field.key}>
                    <span>{field.key}</span>
                    <input
                      type="checkbox"
                      checked={draftRunConfig.enabledEvents[field.key] !== false}
                      onChange={(event) =>
                        setDraftRunConfig((currentConfig) =>
                          sanitizeRunDebugConfig(
                            {
                              enabledEvents: {
                                [field.key]: event.target.checked,
                              },
                            },
                            currentConfig,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="level-editor-field">
                <span>Run config JSON</span>
                <textarea value={formatRunDebugConfig(draftRunConfig)} readOnly rows={10} />
              </label>
              <div className="level-editor-actions">
                <button type="button" onClick={applyDraftRunConfig}>
                  {editorText.applyRunConfigLabel}
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "route" ? (
            <div className="level-editor-panel">
              <h3>{editorText.routeTitle}</h3>
              <div className="level-editor-summary">
                <div className="level-editor-card">
                  <span>{editorText.templateLabel}</span>
                  <strong>{draftLevelConfig?.authoring?.templateId ?? "-"}</strong>
                </div>
                <div className="level-editor-card">
                  <span>{editorText.seedLabel}</span>
                  <strong>{draftLevelConfig?.seed ?? "-"}</strong>
                </div>
                <div className="level-editor-card">
                  <span>{editorText.wallHeightLabel}</span>
                  <strong>{draftLevelConfig?.wallHeight ?? "-"}</strong>
                </div>
                <div className="level-editor-card">
                  <span>{editorText.spatialLabel}</span>
                  <strong>{draftLevelConfig?.routeGeneration?.spatialExperiment?.enabled ? "ON" : "OFF"}</strong>
                </div>
              </div>
              <h4>{routeSettingsTitle}</h4>
              <div className="level-editor-grid">
                <label className="level-editor-field">
                  <span>{editorText.seedLabel}</span>
                  <input
                    type="text"
                    value={draftLevelConfig.seed ?? ""}
                    onChange={(event) =>
                      updateDraftLevelConfig((nextConfig) => {
                        nextConfig.seed = event.target.value;
                      })
                    }
                  />
                </label>
                <label className="level-editor-field">
                  <span>{editorText.wallHeightLabel}</span>
                  <input
                    type="number"
                    min={1000}
                    step={100}
                    value={draftLevelConfig.wallHeight ?? 0}
                    onChange={(event) =>
                      updateDraftLevelConfig((nextConfig) => {
                        nextConfig.wallHeight = Number(event.target.value);
                      })
                    }
                  />
                </label>
                <label className="level-editor-field">
                  <span>{editorText.routeSequenceLabel}</span>
                  <input
                    type="text"
                    value={(draftLevelConfig?.routeGeneration?.zoneSequence ?? []).join(",")}
                    onChange={(event) =>
                      updateDraftLevelConfig((nextConfig) => {
                        nextConfig.routeGeneration.zoneSequence = event.target.value
                          .split(",")
                          .map((zoneKey) => zoneKey.trim())
                          .filter(Boolean);
                      })
                    }
                  />
                </label>
              </div>
              <p className="level-editor-note">
                {editorText.routeSequenceLabel}: {(draftLevelConfig?.routeGeneration?.zoneSequence ?? []).join(" / ") || "-"}
              </p>
              <h4>{editorText.zonesTitle}</h4>
              <div className="level-editor-zone-list">
                {Object.entries(draftLevelConfig?.routeGeneration?.zones ?? {}).map(([zoneKey, zone]) => (
                  <div className="level-editor-zone-card" key={zoneKey}>
                    <div className="level-editor-zone-header">
                      <strong>{zone.label ?? zoneKey}</strong>
                      <span>{zoneKey}</span>
                    </div>
                    <p>{zone.goal}</p>
                    <div className="level-editor-zone-grid">
                      <label className="level-editor-field">
                        <span>Span min</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={zone.segmentSpanMin}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.routeGeneration.zones[zoneKey].segmentSpanMin = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Span max</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={zone.segmentSpanMax}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.routeGeneration.zones[zoneKey].segmentSpanMax = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Wind</span>
                        <input
                          type="number"
                          step={0.01}
                          value={zone.windMultiplier}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.routeGeneration.zones[zoneKey].windMultiplier = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Stamina</span>
                        <input
                          type="number"
                          step={0.001}
                          value={zone.staminaModifier}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.routeGeneration.zones[zoneKey].staminaModifier = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Fragile</span>
                        <input
                          type="number"
                          step={0.01}
                          value={zone.mechanicBudget?.fragile ?? 0}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.routeGeneration.zones[zoneKey].mechanicBudget.fragile = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Timed soft</span>
                        <input
                          type="number"
                          step={0.01}
                          value={zone.mechanicBudget?.timedSoft ?? 0}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.routeGeneration.zones[zoneKey].mechanicBudget.timedSoft = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Obstacle</span>
                        <input
                          type="number"
                          step={0.01}
                          value={zone.mechanicBudget?.obstacle ?? 0}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.routeGeneration.zones[zoneKey].mechanicBudget.obstacle = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Resource</span>
                        <input
                          type="number"
                          step={0.01}
                          value={zone.mechanicBudget?.resource ?? 0}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.routeGeneration.zones[zoneKey].mechanicBudget.resource = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "events" ? (
            <div className="level-editor-panel">
              <h3>{editorText.eventsTitle}</h3>
              <h4>{eventSettingsTitle}</h4>
              <div className="level-editor-timeline-panel">
                <div className="level-editor-summary">
                  <div className="level-editor-card">
                    <span>{routeLengthLabel}</span>
                    <strong>{formatTimelineValue(timelineMaxFrame, frameUnitLabel)}</strong>
                    <em>{formatTimelineValue(timelineMaxStance, stanceUnitLabel)}</em>
                  </div>
                  <div className="level-editor-card">
                    <span>{editorText.timelineLabel}</span>
                    <strong>{timelineTicks.map((tick) => Math.round(tick)).join(" / ")}</strong>
                    <em>{frameUnitLabel}</em>
                  </div>
                  <div className="level-editor-card">
                    <span>{editorText.eventsTitle}</span>
                    <strong>{selectedAnalysis.majorEncounters.length}</strong>
                    <em>{selectedAnalysis.majorEncounters.map((encounter) => encounter.type).join(" / ") || noEventsLabel}</em>
                  </div>
                </div>
                <h4>{timelineOverviewTitle}</h4>
                <p className="level-editor-note">{timelineGuideText}</p>
                {hasTimelineRows ? (
                  <div className="level-editor-timeline-list">
                    <div className="level-editor-timeline-scale">
                      {timelineTicks.map((tick) => (
                        <span key={tick}>{tick}</span>
                      ))}
                    </div>
                    {(draftLevelConfig.environmentEvents ?? []).map((eventConfig, eventIndex) => (
                      <TimelineTrackRow
                        key={eventConfig.id ?? `timeline-event-${eventIndex}`}
                        label={eventConfig.id ?? `event-${eventIndex + 1}`}
                        meta={`${eventConfig.type} | ${formatTimelineValue(eventConfig.startFrame, frameUnitLabel)}`}
                        startFrame={eventConfig.startFrame}
                        durationFrames={eventConfig.durationFrames}
                        maxFrame={timelineMaxFrame}
                        accentColor={eventConfig.type === "avalanche" ? "#e7d7b5" : "#d5b47d"}
                      >
                        <TimelineRangeControl
                          label={startLabel}
                          value={eventConfig.startFrame}
                          min={0}
                          max={timelineMaxFrame}
                          unitLabel={frameUnitLabel}
                          onChange={(nextValue) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.environmentEvents[eventIndex].startFrame = nextValue;
                            })
                          }
                        />
                        <TimelineRangeControl
                          label={durationLabel}
                          value={eventConfig.durationFrames}
                          min={0}
                          max={timelineMaxFrame}
                          unitLabel={frameUnitLabel}
                          onChange={(nextValue) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.environmentEvents[eventIndex].durationFrames = nextValue;
                            })
                          }
                        />
                      </TimelineTrackRow>
                    ))}
                    {draftLevelConfig.pursuit ? (
                      <TimelineTrackRow
                        label={editorText.pursuitLabel}
                        meta={`pursuit | ${formatTimelineValue(draftLevelConfig.pursuit.startFrame, frameUnitLabel)}`}
                        startFrame={draftLevelConfig.pursuit.startFrame}
                        durationFrames={draftLevelConfig.pursuit.durationFrames}
                        maxFrame={timelineMaxFrame}
                        accentColor="#c65f5f"
                      >
                        <TimelineRangeControl
                          label={startLabel}
                          value={draftLevelConfig.pursuit.startFrame}
                          min={0}
                          max={timelineMaxFrame}
                          unitLabel={frameUnitLabel}
                          onChange={(nextValue) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.pursuit.startFrame = nextValue;
                            })
                          }
                        />
                        <TimelineRangeControl
                          label={durationLabel}
                          value={draftLevelConfig.pursuit.durationFrames}
                          min={0}
                          max={timelineMaxFrame}
                          unitLabel={frameUnitLabel}
                          onChange={(nextValue) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.pursuit.durationFrames = nextValue;
                            })
                          }
                        />
                      </TimelineTrackRow>
                    ) : null}
                    {draftLevelConfig.ropeThreat ? (
                      <TimelineTrackRow
                        label={editorText.ropeThreatLabel}
                        meta={`rope | ${formatTimelineValue(draftLevelConfig.ropeThreat.startDelayFrames, frameUnitLabel)}`}
                        startFrame={draftLevelConfig.ropeThreat.startDelayFrames}
                        maxFrame={timelineMaxFrame}
                        accentColor="#d98f5c"
                      >
                        <TimelineRangeControl
                          label={delayLabel}
                          value={draftLevelConfig.ropeThreat.startDelayFrames}
                          min={0}
                          max={timelineMaxFrame}
                          unitLabel={frameUnitLabel}
                          onChange={(nextValue) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.ropeThreat.startDelayFrames = nextValue;
                            })
                          }
                        />
                      </TimelineTrackRow>
                    ) : null}
                    {(draftLevelConfig.rescueTargets ?? []).map((targetConfig, targetIndex) => (
                      <TimelineTrackRow
                        key={targetConfig.id ?? `timeline-rescue-${targetIndex}`}
                        label={targetConfig.id ?? `rescue-${targetIndex + 1}`}
                        meta={`${editorText.rescueTargetsLabel} | ${formatTimelineValue(targetConfig.stanceIndex, stanceUnitLabel)}`}
                        startFrame={targetConfig.stanceIndex * ESTIMATED_FRAMES_PER_STANCE}
                        maxFrame={timelineMaxFrame}
                        accentColor="#74c08d"
                      >
                        <TimelineRangeControl
                          label={markerLabel}
                          value={targetConfig.stanceIndex}
                          min={0}
                          max={timelineMaxStance}
                          unitLabel={stanceUnitLabel}
                          onChange={(nextValue) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.rescueTargets[targetIndex].stanceIndex = nextValue;
                            })
                          }
                        />
                      </TimelineTrackRow>
                    ))}
                    {(draftLevelConfig.laneBlockers ?? []).map((blockerConfig, blockerIndex) => (
                      <TimelineTrackRow
                        key={blockerConfig.id ?? `timeline-blocker-${blockerIndex}`}
                        label={blockerConfig.id ?? `blocker-${blockerIndex + 1}`}
                        meta={`${editorText.laneBlockersLabel} | ${formatTimelineValue(blockerConfig.stanceIndex, stanceUnitLabel)}`}
                        startFrame={blockerConfig.stanceIndex * ESTIMATED_FRAMES_PER_STANCE}
                        maxFrame={timelineMaxFrame}
                        accentColor="#d48963"
                      >
                        <TimelineRangeControl
                          label={markerLabel}
                          value={blockerConfig.stanceIndex}
                          min={0}
                          max={timelineMaxStance}
                          unitLabel={stanceUnitLabel}
                          onChange={(nextValue) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.laneBlockers[blockerIndex].stanceIndex = nextValue;
                            })
                          }
                        />
                      </TimelineTrackRow>
                    ))}
                  </div>
                ) : (
                  <p className="level-editor-note">{noEventsLabel}</p>
                )}
              </div>
              <div className="level-editor-event-editors">
                {(draftLevelConfig.environmentEvents ?? []).map((eventConfig, eventIndex) => (
                  <div className="level-editor-event-editor" key={eventConfig.id ?? eventIndex}>
                    <div className="level-editor-zone-header">
                      <strong>{eventConfig.id ?? `event-${eventIndex + 1}`}</strong>
                      <span>{eventConfig.type}</span>
                    </div>
                    <div className="level-editor-grid">
                      <label className="level-editor-field">
                        <span>Start</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={eventConfig.startFrame}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.environmentEvents[eventIndex].startFrame = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Duration</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={eventConfig.durationFrames}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.environmentEvents[eventIndex].durationFrames = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Earliest stance</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={eventConfig.earliestStanceIndex}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.environmentEvents[eventIndex].earliestStanceIndex = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
                {draftLevelConfig.pursuit ? (
                  <div className="level-editor-event-editor">
                    <div className="level-editor-zone-header">
                      <strong>{editorText.pursuitLabel}</strong>
                      <span>pursuit</span>
                    </div>
                    <div className="level-editor-grid">
                      <label className="level-editor-field">
                        <span>Start</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draftLevelConfig.pursuit.startFrame}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.pursuit.startFrame = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Duration</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draftLevelConfig.pursuit.durationFrames}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.pursuit.durationFrames = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Speed</span>
                        <input
                          type="number"
                          min={0}
                          step={0.001}
                          value={draftLevelConfig.pursuit.speed}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.pursuit.speed = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ) : null}
                {draftLevelConfig.ropeThreat ? (
                  <div className="level-editor-event-editor">
                    <div className="level-editor-zone-header">
                      <strong>{editorText.ropeThreatLabel}</strong>
                      <span>rope</span>
                    </div>
                    <div className="level-editor-grid">
                      <label className="level-editor-field">
                        <span>Delay</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draftLevelConfig.ropeThreat.startDelayFrames}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.ropeThreat.startDelayFrames = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Climb speed</span>
                        <input
                          type="number"
                          min={0}
                          step={0.0001}
                          value={draftLevelConfig.ropeThreat.climbSpeed}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.ropeThreat.climbSpeed = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                      <label className="level-editor-field">
                        <span>Danger</span>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={draftLevelConfig.ropeThreat.dangerProgress}
                          onChange={(event) =>
                            updateDraftLevelConfig((nextConfig) => {
                              nextConfig.ropeThreat.dangerProgress = Number(event.target.value);
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ) : null}
                {(draftLevelConfig.rescueTargets ?? []).length > 0 ? (
                  <div className="level-editor-event-editor">
                    <div className="level-editor-zone-header">
                      <strong>{editorText.rescueTargetsLabel}</strong>
                      <span>rescue</span>
                    </div>
                    <div className="level-editor-grid">
                      {draftLevelConfig.rescueTargets.map((targetConfig, targetIndex) => (
                        <label className="level-editor-field" key={targetConfig.id ?? targetIndex}>
                          <span>{targetConfig.id ?? `rescue-${targetIndex + 1}`}</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={targetConfig.stanceIndex}
                            onChange={(event) =>
                              updateDraftLevelConfig((nextConfig) => {
                                nextConfig.rescueTargets[targetIndex].stanceIndex = Number(event.target.value);
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                {(draftLevelConfig.laneBlockers ?? []).length > 0 ? (
                  <div className="level-editor-event-editor">
                    <div className="level-editor-zone-header">
                      <strong>{editorText.laneBlockersLabel}</strong>
                      <span>blocker</span>
                    </div>
                    <div className="level-editor-grid">
                      {draftLevelConfig.laneBlockers.map((blockerConfig, blockerIndex) => (
                        <label className="level-editor-field" key={blockerConfig.id ?? blockerIndex}>
                          <span>{blockerConfig.id ?? `blocker-${blockerIndex + 1}`}</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={blockerConfig.stanceIndex}
                            onChange={(event) =>
                              updateDraftLevelConfig((nextConfig) => {
                                nextConfig.laneBlockers[blockerIndex].stanceIndex = Number(event.target.value);
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="level-editor-event-columns">
                <div className="level-editor-event-card">
                  <span>{editorText.environmentEventsLabel}</span>
                  <pre>{formatJson(draftLevelConfig?.environmentEvents ?? [])}</pre>
                </div>
                <div className="level-editor-event-card">
                  <span>{editorText.pursuitLabel}</span>
                  <pre>{formatJson(draftLevelConfig?.pursuit ?? null)}</pre>
                </div>
                <div className="level-editor-event-card">
                  <span>{editorText.ropeThreatLabel}</span>
                  <pre>{formatJson(draftLevelConfig?.ropeThreat ?? null)}</pre>
                </div>
                <div className="level-editor-event-card">
                  <span>{editorText.rescueTargetsLabel}</span>
                  <pre>{formatJson(draftLevelConfig?.rescueTargets ?? [])}</pre>
                </div>
                <div className="level-editor-event-card">
                  <span>{editorText.laneBlockersLabel}</span>
                  <pre>{formatJson(draftLevelConfig?.laneBlockers ?? [])}</pre>
                </div>
              </div>
              <h4>{editorText.draftTitle}</h4>
              <p className="level-editor-note">{editorText.draftHint}</p>
              <label className="level-editor-field">
                <span>{editorText.draftTitle}</span>
                <textarea value={draftJson} onChange={(event) => setDraftJson(event.target.value)} rows={18} spellCheck={false} />
              </label>
              <div className="level-editor-actions">
                <button type="button" onClick={copyConfigFragment}>
                  {copyFragmentLabel}
                </button>
                <button type="button" onClick={copyDraftJson}>
                  {editorText.copyJsonLabel}
                </button>
                <button type="button" onClick={importDraftJson}>
                  {editorText.importDraftLabel}
                </button>
                <button type="button" onClick={resetDraftJson}>
                  {editorText.resetDraftLabel}
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "validation" ? (
            <div className="level-editor-panel">
              <h3>{editorText.validationTitle}</h3>
              <div className="level-editor-draft-validation">
                <h4>{draftValidationTitle}</h4>
                {draftValidationErrors.length > 0 ? (
                  <ul className="level-editor-error-list">
                    {draftValidationErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="level-editor-note">{draftValidationOk}</p>
                )}
              </div>
              <div className="level-editor-summary">
                <div className={getSummaryClassName(windStatus)}>
                  <span>wind</span>
                  <strong>{formatRangeComparison(selectedAnalysis.pressureSummary.averageWindMultiplier, selectedOfficialConfig.authoring.pressureTargets.averageWindMultiplier, 2)}</strong>
                  <em>{renderStatusLabel(editorText, windStatus)}</em>
                </div>
                <div className={getSummaryClassName(hazardStatus)}>
                  <span>hazards/100</span>
                  <strong>{formatRangeComparison(selectedAnalysis.pressureSummary.hazardPer100Stances, selectedOfficialConfig.authoring.pressureTargets.hazardPer100Stances, 1)}</strong>
                  <em>{renderStatusLabel(editorText, hazardStatus)}</em>
                </div>
                <div className={getSummaryClassName(resourceStatus)}>
                  <span>resources/100</span>
                  <strong>{formatRangeComparison(selectedAnalysis.pressureSummary.resourcePer100Stances, selectedOfficialConfig.authoring.pressureTargets.resourcePer100Stances, 1)}</strong>
                  <em>{renderStatusLabel(editorText, resourceStatus)}</em>
                </div>
                <div className={getSummaryClassName(fruitStaminaStatus)}>
                  <span>fruit stamina/100</span>
                  <strong>{formatRangeComparison(selectedAnalysis.resourcePressureSummary.staminaRecoveryPer100Stances, selectedOfficialConfig.authoring.resourcePressureTargets.staminaRecoveryPer100Stances, 1)}</strong>
                  <em>{renderStatusLabel(editorText, fruitStaminaStatus)}</em>
                </div>
                <div className={getSummaryClassName(thirstStatus)}>
                  <span>thirst relief/100</span>
                  <strong>{formatRangeComparison(selectedAnalysis.resourcePressureSummary.thirstReliefPer100Stances, selectedOfficialConfig.authoring.resourcePressureTargets.thirstReliefPer100Stances, 1)}</strong>
                  <em>{renderStatusLabel(editorText, thirstStatus)}</em>
                </div>
                <div className={getSummaryClassName(pressureWindowStatus)}>
                  <span>{editorText.pressureWindowLabel}</span>
                  <strong>{formatLimitComparison(selectedAnalysis.eventDensitySummary.maxPressureEventsInWindow.count, selectedOfficialConfig.authoring.pressureRules.maxPressureEventsPerWindow)}</strong>
                  <em>{renderStatusLabel(editorText, pressureWindowStatus)}</em>
                </div>
                <div className={getSummaryClassName(fruitWindowStatus)}>
                  <span>{editorText.fruitWindowLabel}</span>
                  <strong>{formatLimitComparison(selectedAnalysis.eventDensitySummary.maxResourceFruitsInWindow.count, selectedOfficialConfig.authoring.pressureRules.maxResourceFruitsPerWindow)}</strong>
                  <em>{renderStatusLabel(editorText, fruitWindowStatus)}</em>
                </div>
                <div className={getSummaryClassName(fruitGapStatus)}>
                  <span>{editorText.fruitGapLabel}</span>
                  <strong>{formatLimitComparison(selectedAnalysis.eventDensitySummary.resourceGapSummary.maxGapFrames, selectedOfficialConfig.authoring.pressureRules.maxResourceGapFrames)}</strong>
                  <em>{renderStatusLabel(editorText, fruitGapStatus)}</em>
                </div>
                <div className={getSummaryClassName(goldenStatus)}>
                  <span>{editorText.goldenPathLabel}</span>
                  <strong>{selectedAnalysis.goldenPathSafetySummary.blockedGoldenHoldCount} / {selectedAnalysis.goldenPathSafetySummary.goldenHoldCount}</strong>
                  <em>{renderStatusLabel(editorText, goldenStatus)}</em>
                </div>
              </div>
              <p className="level-editor-note">
                {editorText.contentLabel}: {Object.entries(selectedAnalysis.contentCounts).map(([key, value]) => `${key}:${value}`).join(" / ")}
              </p>
              <p className="level-editor-note">
                {editorText.timelineLabel}: {selectedAnalysis.majorEncounters.map((encounter) => `${encounter.type}@${encounter.frame}`).join(" / ") || "none"}
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

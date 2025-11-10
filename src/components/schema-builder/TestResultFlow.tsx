"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  TestResultConfig,
  AnalyteType,
  NotificationChannel,
  CompareTimeRange,
} from "@/types/schema";
import { ANALYTE_COLORS } from "@/lib/constants";
import { MiniVisualizer } from "./MiniVisualizer";
import { FlowFrame } from "./FlowFrame";
import { FlowNode } from "./FlowNode";
import { cn } from "@/lib/utils";

interface NodeRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface TestResultFlowProps {
  analyteType: AnalyteType;
  config: TestResultConfig;
  onConfigChange: (config: TestResultConfig) => void;
  value?: number;
  nodeRect: NodeRect; // Absolute position/size of the parent node card
  overlayRef: React.RefObject<HTMLDivElement>;
  showSummary?: boolean;
	// When true, the initial root "+" node under the card is hidden
	suppressPlusNode?: boolean;
}

type FlowStage = "condition" | "compare" | "record" | "notify";

type FlowMenuOption = {
  id: "set-condition" | "record-action" | "recommendation";
  label: string;
  target: FlowStage;
  dashed?: boolean;
};

const MENU_OPTIONS: FlowMenuOption[] = [
  { id: "set-condition", label: "Set condition", target: "condition" },
  { id: "compare-trend", label: "Compare trend", target: "compare" },
  { id: "record-action", label: "Record action", target: "record" },
  { id: "recommendation", label: "Recommendation", target: "notify", dashed: true },
];

const STAGE_SEQUENCE: FlowStage[] = ["condition", "compare", "record", "notify"];

const STAGE_WIDTHS: Record<FlowStage, number> = {
  condition: 248,
  compare: 248,
  record: 248,
  notify: 300,
};

export function TestResultFlow({
  analyteType,
  config,
  onConfigChange,
  value,
  nodeRect,
  overlayRef,
  showSummary = true,
	suppressPlusNode = false,
}: TestResultFlowProps) {
  const [openFrames, setOpenFrames] = useState<Set<string>>(new Set());
  const [overlayElement, setOverlayElement] = useState<HTMLElement | null>(null);
  const [activeMenu, setActiveMenu] = useState<FlowStage | null>(null);

  useEffect(() => {
    setOverlayElement(overlayRef.current);
  }, [overlayRef]);

  useEffect(() => {
    if (!activeMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!overlayElement) {
        setActiveMenu(null);
        return;
      }
      if (!overlayElement.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeMenu, overlayElement]);

  const accentColor = ANALYTE_COLORS[analyteType];

  const updateConfig = (updates: Partial<TestResultConfig>) => {
    const newConfig = { ...config, ...updates };
    onConfigChange(newConfig);
  };

  const openFrame = (frameId: string) => {
    setOpenFrames((prev) => new Set(prev).add(frameId));
    updateConfig({ enabled: true });

    // Auto-enable relevant feature
    if (frameId === "condition") {
      updateConfig({ scheduleFollowUp: true });
    } else if (frameId === "compare") {
      updateConfig({ compareTrendEnabled: true });
    } else if (frameId === "record") {
      updateConfig({ recordActionEnabled: true });
    } else if (frameId === "notify") {
      updateConfig({ notifications: true });
    }
  };

  const closeFrame = (frameId: string) => {
    setOpenFrames((prev) => {
      const next = new Set(prev);
      next.delete(frameId);
      return next;
    });

    // Disable relevant feature
    if (frameId === "condition") {
      updateConfig({ scheduleFollowUp: false });
    } else if (frameId === "compare") {
      updateConfig({ compareTrendEnabled: false });
    } else if (frameId === "record") {
      updateConfig({ recordActionEnabled: false });
    } else if (frameId === "notify") {
      updateConfig({ notifications: false });
    }
  };

  const conditionOpen = openFrames.has("condition");
  const compareOpen = openFrames.has("compare");
  const recordOpen = openFrames.has("record");
  const notifyOpen = openFrames.has("notify");

  const [stageHeights, setStageHeights] = useState<Record<FlowStage, number>>({
    condition: 260,
    compare: 220,
    record: 280,
    notify: 220,
  });

  const handleStageHeightChange = useCallback((stage: FlowStage, height: number) => {
    setStageHeights((prev) => {
      const previous = prev[stage] ?? 0;
      if (Math.abs(previous - height) < 1) {
        return prev;
      }
      return { ...prev, [stage]: height };
    });
  }, []);

  const FRAME_GAP = 48;

  const stageOpenMap: Record<FlowStage, boolean> = {
    condition: conditionOpen,
    compare: compareOpen,
    record: recordOpen,
    notify: notifyOpen,
  };

  const cardCenterX = nodeRect.left + nodeRect.width / 2;

  const framePositions = {} as Record<FlowStage, { x: number; y: number }>;
  const connectorPositions: Partial<Record<FlowStage, { x: number; y: number }>> = {};

  let stackY = nodeRect.bottom + FRAME_GAP;
  for (const stage of STAGE_SEQUENCE) {
    const width = STAGE_WIDTHS[stage];
    const height = stageHeights[stage] ?? 0;
    framePositions[stage] = {
      x: cardCenterX - width / 2,
      y: stackY,
    };
    if (stageOpenMap[stage]) {
      connectorPositions[stage] = {
        x: cardCenterX,
        y: stackY + height + 32,
      };
      stackY += height + FRAME_GAP;
    }
  }

  const firstNodePos = {
    x: cardCenterX,
    y: nodeRect.bottom + 48,
  };

  const conditionFramePos = framePositions.condition;
  const compareFramePos = framePositions.compare;
  const recordFramePos = framePositions.record;
  const notifyFramePos = framePositions.notify;

  const conditionConnectorPos = connectorPositions.condition ?? null;
  const compareConnectorPos = connectorPositions.compare ?? null;
  const recordConnectorPos = connectorPositions.record ?? null;
  const notifyConnectorPos = connectorPositions.notify ?? null;

  const nodePositions: Record<FlowStage, { x: number; y: number }> = {
    condition: firstNodePos,
    compare:
      compareConnectorPos ??
      {
        x: cardCenterX,
        y: compareFramePos.y - 32,
      },
    record:
      recordConnectorPos ??
      {
        x: cardCenterX,
        y: recordFramePos.y - 32,
      },
    notify:
      notifyConnectorPos ??
      {
        x: cardCenterX,
        y: notifyFramePos.y - 32,
      },
  };

  const resolveMenuPosition = (stage: FlowStage): { x: number; y: number } => {
    if (stage === "condition") {
      return nodePositions.condition;
    }
    if (stage === "record") {
      if (openFrames.has("record")) {
      return recordConnectorPos ?? nodePositions.record;
      }
      if (openFrames.has("condition")) {
      return conditionConnectorPos ?? nodePositions.record;
      }
      return nodePositions.record;
    }
    if (stage === "notify") {
      if (openFrames.has("notify")) {
      return notifyConnectorPos ?? nodePositions.notify;
      }
      if (openFrames.has("record")) {
      return recordConnectorPos ?? nodePositions.notify;
      }
      if (openFrames.has("condition")) {
      return conditionConnectorPos ?? nodePositions.notify;
      }
      return nodePositions.notify;
    }
    return nodePositions.condition;
  };

  const toggleMenu = (stage: FlowStage) => {
    setActiveMenu((prev) => (prev === stage ? null : stage));
  };

  const handleMenuSelect = (targetStage: FlowStage) => {
    openFrame(targetStage);
    setActiveMenu(null);
  };

  const overlayContent = overlayElement
    ? createPortal(
        <>
          <svg
            className="pointer-events-none absolute inset-0 z-0"
            width="100%"
            height="100%"
          >
          {/* Line from Phosphate card to plus button when condition card is closed */}
          {!suppressPlusNode && !conditionOpen && !compareOpen && !recordOpen && !notifyOpen && (
            <motion.line
              x1={nodeRect.left + nodeRect.width / 2}
              y1={nodeRect.bottom}
              x2={firstNodePos.x}
              y2={firstNodePos.y}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0.5 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Line from node to menu when menu is open */}
          {!suppressPlusNode && !conditionOpen && !compareOpen && !recordOpen && !notifyOpen && activeMenu === "condition" && (
            <motion.line
              x1={firstNodePos.x}
              y1={firstNodePos.y}
              x2={firstNodePos.x}
              y2={firstNodePos.y + 48}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}

          {/* Line from Phosphate card to Condition card when condition card is open */}
          {conditionOpen && (
            <motion.line
              x1={nodeRect.left + nodeRect.width / 2}
              y1={nodeRect.bottom}
              x2={framePositions.condition.x + STAGE_WIDTHS.condition / 2}
              y2={framePositions.condition.y}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {conditionOpen && connectorPositions.condition && (
            <motion.line
              x1={framePositions.condition.x + STAGE_WIDTHS.condition / 2}
              y1={framePositions.condition.y + stageHeights.condition}
              x2={connectorPositions.condition.x}
              y2={connectorPositions.condition.y}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {recordOpen && (
            <motion.line
              x1={
                conditionOpen && connectorPositions.condition
                  ? connectorPositions.condition.x
                  : cardCenterX
              }
              y1={
                conditionOpen && connectorPositions.condition
                  ? connectorPositions.condition.y
                  : nodeRect.bottom
              }
              x2={framePositions.record.x + STAGE_WIDTHS.record / 2}
              y2={framePositions.record.y}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {recordOpen && connectorPositions.record && (
            <motion.line
              x1={framePositions.record.x + STAGE_WIDTHS.record / 2}
              y1={framePositions.record.y + stageHeights.record}
              x2={connectorPositions.record.x}
              y2={connectorPositions.record.y}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {notifyOpen && (
            <motion.line
              x1={
                recordOpen && recordConnectorPos
                  ? recordConnectorPos.x
                  : conditionOpen && conditionConnectorPos
                  ? conditionConnectorPos.x
                  : cardCenterX
              }
              y1={
                recordOpen && recordConnectorPos
                  ? recordConnectorPos.y
                  : conditionOpen && conditionConnectorPos
                  ? conditionConnectorPos.y
                  : nodeRect.bottom
              }
              x2={notifyFramePos.x + STAGE_WIDTHS.notify / 2}
              y2={notifyFramePos.y}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {notifyOpen && notifyConnectorPos && (
            <motion.line
              x1={notifyFramePos.x + STAGE_WIDTHS.notify / 2}
              y1={notifyFramePos.y + stageHeights.notify}
              x2={notifyConnectorPos.x}
              y2={notifyConnectorPos.y}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </svg>

        <div className="absolute inset-0">
          {conditionOpen && conditionConnectorPos && (
            <FlowNode
              key="node-condition-bottom"
              isActive={compareOpen || recordOpen || notifyOpen}
              accentColor={accentColor}
              onClick={() => toggleMenu("compare")}
              position={conditionConnectorPos}
              label="compare"
              isMenuOpen={activeMenu === "compare"}
            />
          )}

          {compareOpen && compareConnectorPos && (
            <FlowNode
              key="node-compare-bottom"
              isActive={recordOpen || notifyOpen}
              accentColor={accentColor}
              onClick={() => toggleMenu("record")}
              position={compareConnectorPos}
              label="record"
              isMenuOpen={activeMenu === "record"}
            />
          )}

          {recordOpen && recordConnectorPos && (
            <FlowNode
              key="node-record-bottom"
              isActive={notifyOpen}
              accentColor={accentColor}
              onClick={() => toggleMenu("notify")}
              position={recordConnectorPos}
              label="notify"
              isMenuOpen={activeMenu === "notify"}
            />
          )}
        </div>

        <AnimatePresence>
          {activeMenu && (
            <FlowNodeMenu
              key={`menu-${activeMenu}`}
              position={resolveMenuPosition(activeMenu)}
              options={MENU_OPTIONS}
              highlightStage={activeMenu}
              onSelect={handleMenuSelect}
              nodeRect={nodeRect}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {conditionOpen && (
            <ConditionCardOverlay
              key="condition-card"
              position={conditionFramePos}
              accentColor={accentColor}
              config={config}
              onUpdate={updateConfig}
              onHeightChange={(height) => handleStageHeightChange("condition", height)}
            />
          )}

          {compareOpen && (
            <CompareTrendCardOverlay
              key="compare-card"
              position={compareFramePos}
              accentColor={accentColor}
              config={config}
              onUpdate={updateConfig}
              onClose={() => closeFrame("compare")}
              currentValue={value}
              onHeightChange={(height) => handleStageHeightChange("compare", height)}
            />
          )}

          {recordOpen && (
            <RecordActionCardOverlay
              key="record-action-card"
              position={recordFramePos}
              accentColor={accentColor}
              config={config}
              onUpdate={updateConfig}
              onHeightChange={(height) => handleStageHeightChange("record", height)}
            />
          )}

          {notifyOpen && (
            <FlowFrame
              key="notify-frame"
              label="Notify"
              icon="🔔"
              isActive={true}
              accentColor={accentColor}
              position={notifyFramePos}
              onClose={() => closeFrame("notify")}
              width={STAGE_WIDTHS.notify}
              height={stageHeights.notify}
            >
              <NotifyConfig
                config={config}
                onUpdate={updateConfig}
              />
            </FlowFrame>
          )}
        </AnimatePresence>
      </>,
        overlayElement
      )
    : null;

	const plusButton = !suppressPlusNode && !(conditionOpen || compareOpen || recordOpen || notifyOpen) ? (
    <div
      className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center z-50"
      style={{ top: "100%" }}
    >
      <motion.div
        className="w-[2px]"
        style={{ backgroundColor: accentColor }}
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: activeMenu === "condition" ? 52 : 36,
          opacity: activeMenu === "condition" ? 0.9 : 0.6,
        }}
        transition={{ duration: 0.2 }}
      />
      <FlowNode
        isActive={openFrames.has("condition")}
        accentColor={accentColor}
        onClick={() => toggleMenu("condition")}
        label="condition"
        isMenuOpen={activeMenu === "condition"}
        className="pointer-events-auto -mt-1"
      />
    </div>
  ) : null;

  return (
    <>
      {showSummary && (
        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
          <div className="flex flex-col items-center gap-2">
            <MiniVisualizer analyteType={analyteType} />
            {value !== undefined && (
              <div className="text-sm font-medium text-[#ededed]">{value}</div>
            )}
          </div>
        </div>
      )}
      {plusButton}
      {overlayContent}
    </>
  );
}

interface NotifyConfigProps {
  config: TestResultConfig;
  onUpdate: (updates: Partial<TestResultConfig>) => void;
}

function NotifyConfig({ config, onUpdate }: NotifyConfigProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#ededed]">Enable Notifications</label>
        <button
          onClick={() => onUpdate({ notifications: !config.notifications })}
          className={cn(
            "relative w-8 h-4 rounded-full transition-colors",
            config.notifications ? "bg-blue-600" : "bg-[#2a2a2a]"
          )}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full"
            animate={{ x: config.notifications ? 16 : 0 }}
            transition={{ duration: 0.15 }}
          />
        </button>
      </div>

      {config.notifications && (
        <div className="text-xs text-[#a0a0a0]">
          Notifications will be sent when threshold conditions are met or follow-up tests are scheduled.
        </div>
      )}
    </div>
  );
}

interface FlowNodeMenuProps {
  position: { x: number; y: number };
  options: FlowMenuOption[];
  highlightStage: FlowStage;
  onSelect: (stage: FlowStage) => void;
  nodeRect: NodeRect;
}

function FlowNodeMenu({
  position,
  options,
  highlightStage,
  onSelect,
  nodeRect,
}: FlowNodeMenuProps) {
  const menuWidth = 153;
  const topOffset = 44;
  const anchorX =
    highlightStage === "condition"
      ? nodeRect.left + nodeRect.width / 2
      : position.x;
  const left = anchorX - menuWidth / 2;
  const top = position.y + topOffset;

  return (
    <motion.div
      className="absolute z-[70]"
      style={{ left, top, pointerEvents: "auto" }}
      onPointerDown={(event) => event.stopPropagation()}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex w-[153px] flex-col gap-[6px] rounded-[5px] border border-[#282828] bg-[#1a1a1a] p-[10px] shadow-xl">
        {options.map((option) => {
          return (
            <button
              key={option.id}
              type="button"
              className={cn(
                "h-[26px] w-full rounded-[2px] text-[10px] font-abc-regular text-white transition-colors tracking-[0.02em]",
                option.dashed
                  ? "border border-dashed border-[#969696] bg-transparent text-[#d9d9d9]"
                  : "border border-transparent bg-[#202020] hover:bg-[#242424]"
              )}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(option.target);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export interface ConditionCardOverlayProps {
  position: { x: number; y: number };
  accentColor: string;
  config: TestResultConfig;
  onUpdate: (updates: Partial<TestResultConfig>) => void;
  onHeightChange: (height: number) => void;
}

export function ConditionCardOverlay({
  position,
  accentColor,
  config,
  onUpdate,
  onHeightChange,
}: ConditionCardOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange(entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <motion.div
      ref={containerRef}
      className="absolute z-40"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={{ duration: 0.25 }}
    >
      <ConditionCard accentColor={accentColor} config={config} onUpdate={onUpdate} />
    </motion.div>
  );
}

interface ConditionCardProps {
  accentColor: string;
  config: TestResultConfig;
  onUpdate: (updates: Partial<TestResultConfig>) => void;
}

function ConditionCard({ accentColor, config, onUpdate }: ConditionCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  
  const rule = config.conditionRule ?? {
    threshold: config.thresholdValue ?? 36,
    thresholdDirection: config.thresholdDirection ?? "above",
    frequency: config.followUpFrequency ?? "on-new-result",
    customDays: config.customDays ?? 7,
    notificationChannels: config.notificationChannels ?? ["app"],
    recipients: "",
  };

  const thresholdValue = typeof rule.threshold === "number" ? rule.threshold : 36;
  const thresholdDirection = rule.thresholdDirection ?? "above";
  const sliderMin = 0;
  const sliderMax = 100;
  const sliderPercent = Math.min(
    100,
    Math.max(0, ((thresholdValue - sliderMin) / (sliderMax - sliderMin)) * 100)
  );

  const frequency = rule.frequency ?? "on-new-result";
  const customDays = rule.customDays ?? 7;
  const channels = rule.notificationChannels ?? [];
  const recipients = rule.recipients ?? "";

  const syncRule = (updates: Partial<typeof rule>) => {
    const nextRule = { ...rule, ...updates };
    onUpdate({
      conditionRule: nextRule,
      thresholdValue: nextRule.threshold,
      thresholdDirection: nextRule.thresholdDirection,
      followUpFrequency: nextRule.frequency,
      customDays: nextRule.customDays,
      notificationChannels: nextRule.notificationChannels,
      notifications: (nextRule.notificationChannels?.length ?? 0) > 0,
      scheduleFollowUp: true,
      thresholdAlert: true,
    });
  };

  const handleThresholdInput = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      syncRule({ threshold: undefined });
      return;
    }
    syncRule({ threshold: parsed });
  };

  const handleChannelToggle = (channel: NotificationChannel) => {
    const exists = channels.includes(channel);
    const nextChannels = exists
      ? channels.filter((item) => item !== channel)
      : [...channels, channel];
    syncRule({ notificationChannels: nextChannels });
  };


  const channelOptions: { id: NotificationChannel; label: string }[] = [
    { id: "app", label: "App" },
    { id: "email", label: "Email" },
    { id: "sms", label: "SMS" },
  ];

  return (
    <div className="flex flex-col gap-[6px] pointer-events-auto" style={{ width: 248 }}>
      {/* Top card - Title */}
      <div className="rounded-[5px] border border-[#282828] bg-[#1a1a1a] px-[8px] py-[4px] flex items-center justify-between">
        <span className="font-abc-screen text-[10px] text-white tracking-[0.02em]">
          Condition
        </span>
        <div className="h-[13px] w-[188px]" />
      </div>

      {/* Bottom card - Content */}
      <div
        className={cn(
          "rounded-[5px] border bg-[#1a1a1a] flex flex-col pointer-events-auto",
          isSaved ? "px-[10px] py-[10px] gap-[6px]" : "px-[10px] pt-[10px] pb-[14px] gap-[20px]"
        )}
        style={{ borderColor: isSaved ? "#282828" : accentColor }}
      >
        {!isSaved && (
          <>
        {/* Threshold section */}
        <div className="space-y-2">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Threshold
          </span>
          
          {/* Direction selector and value input */}
          <div className="mt-[6px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Direction selector */}
              <div className="flex h-[28px] rounded-[6px] border border-[#2a2a2a] bg-[#121212] py-[2px] px-[2px]">
                <button
                  type="button"
                  onClick={() => syncRule({ thresholdDirection: "above" })}
                  className={cn(
                    "px-3 h-full text-[11px] font-abc-regular tracking-[0.08em] rounded-[4px] transition-colors cursor-pointer text-center flex items-center justify-center",
                    thresholdDirection === "above"
                      ? "bg-[#3b82f6] text-white"
                      : "text-[#9d9d9d] hover:text-[#ededed]"
                  )}
                >
                  Above
                </button>
                <button
                  type="button"
                  onClick={() => syncRule({ thresholdDirection: "below" })}
                  className={cn(
                    "px-3 h-full text-[11px] font-abc-regular tracking-[0.08em] rounded-[4px] transition-colors cursor-pointer text-center flex items-center justify-center",
                    thresholdDirection === "below"
                      ? "bg-[#3b82f6] text-white"
                      : "text-[#9d9d9d] hover:text-[#ededed]"
                  )}
                >
                  Below
                </button>
              </div>
              
              {/* Numeric input */}
              <input
                type="number"
                min={sliderMin}
                max={sliderMax}
                step={0.1}
                value={Number.isNaN(thresholdValue) ? "" : thresholdValue}
                onChange={(event) => handleThresholdInput(event.target.value)}
                className="w-12 h-[28px] rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-2 text-right text-[13px] font-abc-regular text-[#f4f4f4] focus:border-[#3b82f6] focus:outline-none"
                placeholder="--"
              />
            </div>
            <span className="font-abc-regular text-[10px] uppercase tracking-[0.18em] text-[#8f8f8f]">
              PPM
            </span>
          </div>

          {/* Progress slider bar */}
          <div className="relative h-[7px] w-full rounded-[2px] bg-[#161616] cursor-ew-resize">
            <div
              className="h-full rounded-[2px]"
              style={{
                width: `${sliderPercent}%`,
                backgroundColor: accentColor,
              }}
            />
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={0.1}
              value={Number.isNaN(thresholdValue) ? sliderMin : thresholdValue}
              onChange={(event) => syncRule({ threshold: Number(event.target.value) })}
              className="condition-slider absolute inset-0 h-full w-full cursor-ew-resize appearance-none opacity-0"
              aria-label="Threshold slider"
            />
          </div>

          {/* Helper text */}
          <p className="font-abc-regular text-[12px] text-[#666666]">
            Trigger when phosphate is {thresholdDirection === "above" ? "Above" : "Below"} {thresholdValue.toFixed(1)} PPM.
          </p>
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-[8px]">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Frequency
          </span>
          <div className="mt-[6px] flex gap-3">
            <div className="relative flex-1">
              <select
                value={frequency}
                onChange={(event) => {
                  event.stopPropagation();
                  syncRule({
                    frequency: event.target.value as typeof frequency,
                    customDays: event.target.value === "custom" ? customDays : undefined,
                  });
                }}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                className="w-full appearance-none rounded-[6px] border border-[#2a2a2a] bg-[#121212] pl-3 pr-9 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none cursor-pointer pointer-events-auto"
              >
                <option value="on-new-result">On new result</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 3 days</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom…</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[14px] text-[#d0d0d0]">⌄</span>
            </div>
            {frequency === "custom" && (
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(event) =>
                    syncRule({
                      customDays: Math.max(1, parseInt(event.target.value, 10) || 1),
                    })
                  }
                  className="w-16 rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-center text-[12px] text-[#ededed] focus:border-[#3b82f6] focus:outline-none"
                />
                <div className="relative">
                  <select
                    value="days"
                    onChange={(event) => {
                      // Handle unit change if needed in the future
                    }}
                    className="w-20 appearance-none rounded-[6px] border border-[#2a2a2a] bg-[#121212] pl-3 pr-7 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none cursor-pointer"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[13px] text-[#d0d0d0]">⌄</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notify surfaces */}
        <div className="flex flex-col gap-[8px]">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Notify
          </span>
          <div className="mt-[6px] flex gap-2">
            {channelOptions.map((channel) => {
              const active = channels.includes(channel.id);
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => handleChannelToggle(channel.id)}
                  className={cn(
                    "rounded-[6px] border px-3 py-2 text-[11px] font-abc-regular tracking-[0.08em] transition-colors cursor-pointer",
                    active
                      ? "border-[#3b82f6] bg-[#1b2a3f] text-[#e4ecff]"
                      : "border-[#2a2a2a] bg-[#121212] text-[#9d9d9d] hover:border-[#3b82f6]/60 hover:text-[#e4ecff]"
                  )}
                >
                  {channel.label}
                </button>
              );
            })}
          </div>
          {(channels.includes("email") || channels.includes("sms")) && (
            <div className="space-y-1">
              <input
                type="text"
                value={recipients}
                onChange={(event) => syncRule({ recipients: event.target.value })}
                placeholder="name@farm.co, agronomist@supply.com"
                className="w-full rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-[12px] text-[#ededed] focus:border-[#3b82f6] focus:outline-none"
              />
              <p className="font-abc-regular text-[10px] text-[#666666]">
                Add teammates or your agronomist
              </p>
            </div>
          )}
        </div>
          </>
        )}

        {/* Summary strip - Always visible */}
        <div
          className="relative overflow-hidden rounded-[8px] border border-[#2a3c85] bg-[#1b2a3f] px-4 py-3 text-[12px] font-abc-regular text-[#e4ecff]"
        >
          If phosphate is {thresholdDirection === "above" ? "Above" : "Below"} {thresholdValue.toFixed(1)} PPM → check{" "}
          {frequency === "on-new-result"
            ? "On new result"
            : frequency === "custom"
            ? `Every ${customDays} days`
            : frequency === "daily"
            ? "Daily"
            : frequency === "weekly"
            ? "Weekly"
            : frequency === "biweekly"
            ? "Every 3 days"
            : frequency === "monthly"
            ? "Monthly"
            : frequency}{" "}
          → notify {channels.join(", ")}
        </div>

        {!isSaved && (
          <div className="flex justify-center pt-2 pointer-events-auto">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsSaved(true);
            }}
            onMouseDown={(event) => event.stopPropagation()}
            disabled={
              !thresholdValue ||
              channels.length === 0 ||
              ((channels.includes("email") || channels.includes("sms")) && !recipients)
            }
            className={cn(
              "rounded-[6px] bg-[#3b82f6] px-4 py-2 text-[12px] font-abc-regular font-medium text-white transition-colors pointer-events-auto",
              !thresholdValue ||
                channels.length === 0 ||
                ((channels.includes("email") || channels.includes("sms")) && !recipients)
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-[#2563eb]"
            )}
          >
            Save Condition
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

interface CompareTrendCardOverlayProps {
  position: { x: number; y: number };
  accentColor: string;
  config: TestResultConfig;
  onUpdate: (updates: Partial<TestResultConfig>) => void;
  onClose: () => void;
  currentValue?: number;
  onHeightChange: (height: number) => void;
}

function CompareTrendCardOverlay({
  position,
  accentColor,
  config,
  onUpdate,
  onClose,
  currentValue,
  onHeightChange,
}: CompareTrendCardOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange(entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <motion.div
      ref={containerRef}
      className="absolute z-40"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={{ duration: 0.25 }}
    >
      <CompareTrendCard
        accentColor={accentColor}
        config={config}
        onUpdate={onUpdate}
        onClose={onClose}
        currentValue={currentValue}
      />
    </motion.div>
  );
}

interface CompareTrendCardProps {
  accentColor: string;
  config: TestResultConfig;
  onUpdate: (updates: Partial<TestResultConfig>) => void;
  onClose: () => void;
  currentValue?: number;
}

function CompareTrendCard({
  accentColor,
  config,
  onUpdate,
  onClose,
  currentValue,
}: CompareTrendCardProps) {
  const DEFAULT_RANGE: CompareTimeRange = "season";
  const timeRange = config.compareTimeRange ?? DEFAULT_RANGE;

  useEffect(() => {
    if (!config.compareTrendEnabled || !config.compareTimeRange) {
      onUpdate({ compareTrendEnabled: true, compareTimeRange: DEFAULT_RANGE });
    }
  }, [config.compareTrendEnabled, config.compareTimeRange, onUpdate]);

  const rangeOptions: { label: string; value: CompareTimeRange }[] = [
    { label: "Last 14 days", value: "14d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 60 days", value: "60d" },
    { label: "Last 90 days", value: "90d" },
    { label: "Full Season", value: "season" },
  ];

  const seriesData = useMemo(() => {
    const samples: Record<CompareTimeRange, number[]> = {
      "14d": [34, 37, 35, 38, 36, 39, 40, 42, 41, 43, 44, 45, 44, 46],
      "30d": [31, 33, 32, 35, 36, 38, 37, 39, 41, 40, 44, 46, 45, 43, 47, 48, 50, 49, 51, 52, 53, 51, 48, 46, 44, 45, 47, 48, 49, 50],
      "60d": [28, 29, 30, 32, 31, 33, 35, 36, 38, 39, 41, 42, 40, 39, 43, 45, 46, 48, 47, 49, 52, 50, 48, 47, 46, 45, 44, 43, 42, 41, 43, 44, 45, 46, 47, 49, 51, 52, 53, 51, 49, 48, 47, 45, 44, 43, 42, 41, 42, 44, 45, 46, 47, 48, 49, 50, 52, 51, 50, 49],
      "90d": [26, 27, 28, 29, 30, 31, 33, 32, 34, 36, 37, 39, 41, 40, 38, 37, 36, 38, 40, 42, 44, 45, 46, 45, 44, 43, 42, 41, 40, 39, 41, 42, 43, 44, 46, 48, 49, 50, 51, 52, 50, 48, 47, 46, 45, 43, 44, 45, 46, 48, 49, 51, 53, 55, 54, 53, 51, 50, 48, 47, 46, 45, 44, 43, 42, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50, 49, 48, 47, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 57],
      season: [32, 34, 33, 35, 37, 36, 38, 39, 41, 40, 42, 44, 43, 45, 47, 46, 48, 49, 50, 48, 46, 45, 44, 43, 42, 41, 40, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 52, 51, 50, 49, 47, 45, 44, 42, 41, 40, 39, 41, 42, 43, 44, 45, 47, 48, 49, 50, 51, 52],
    };
    const selected = samples[timeRange] ?? samples[DEFAULT_RANGE];
    return selected;
  }, [timeRange]);

  const displaySeries = useMemo(() => {
    if (typeof currentValue === "number") {
      const seriesCopy = [...seriesData];
      seriesCopy[seriesCopy.length - 1] = currentValue;
      return seriesCopy;
    }
    return seriesData;
  }, [seriesData, currentValue]);

  const stats = useMemo(() => {
    const sorted = [...displaySeries].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    const high = sorted[sorted.length - 1];
    const low = sorted[0];
    return { median, high, low };
  }, [displaySeries]);

  const sparkline = useMemo(() => {
    const width = 228;
    const height = 40;
    const minVal = Math.min(...displaySeries);
    const lastValue = displaySeries[displaySeries.length - 1];
    const maxVal = Math.max(...displaySeries);
    const span = maxVal - minVal || 1;

    const points = displaySeries.map((value, index) => {
      const x =
        displaySeries.length === 1
          ? width
          : (index / (displaySeries.length - 1)) * width;
      const y = height - ((value - minVal) / span) * height;
      return { x, y, value };
    });

    const path = points
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
      )
      .join(" ");

    const refY = height - ((lastValue - minVal) / span) * height;

    return {
      width,
      height,
      path,
      points,
      referenceY: refY,
      minVal,
      maxVal,
    };
  }, [displaySeries]);

  const targetRange = useMemo(() => {
    return { min: 38, max: 52 };
  }, []);

  const current = displaySeries[displaySeries.length - 1];

  const rangeSpan = (() => {
    const combinedMin = Math.min(
      sparkline.minVal,
      targetRange.min,
      current
    );
    const combinedMax = Math.max(
      sparkline.maxVal,
      targetRange.max,
      current
    );
    return {
      min: combinedMin,
      max: combinedMax,
      span: combinedMax - combinedMin || 1,
    };
  })();

  const clamp = (value: number) => Math.min(100, Math.max(0, value));

  const targetStart = clamp(
    ((targetRange.min - rangeSpan.min) / rangeSpan.span) * 100
  );
  const targetWidth = clamp(
    ((targetRange.max - targetRange.min) / rangeSpan.span) * 100
  );
  const markerLeft = clamp(
    ((current - rangeSpan.min) / rangeSpan.span) * 100
  );

  const summary = useMemo(() => {
    const parts: string[] = [];
    parts.push(
      `Current result is ${
        current >= stats.median ? "above" : "below"
      } your seasonal median`
    );
    if (current > targetRange.max) {
      parts.push("and above crop target range.");
    } else if (current < targetRange.min) {
      parts.push("and below crop target range.");
    } else {
      parts.push("and within crop target range.");
    }
    return parts.join(" ");
  }, [current, stats.median, targetRange.max, targetRange.min]);

  return (
    <div className="flex flex-col gap-[6px] pointer-events-auto" style={{ width: 248 }}>
      <div className="rounded-[5px] border border-[#282828] bg-[#1a1a1a] px-[8px] py-[4px] flex items-center justify-between">
        <span className="font-abc-screen text-[10px] text-white tracking-[0.02em]">
          Compare Trend
        </span>
      </div>

      <div
        className="rounded-[5px] border bg-[#1a1a1a] px-[10px] pt-[10px] pb-[14px] flex flex-col gap-[18px] pointer-events-auto"
        style={{ borderColor: accentColor }}
      >
        <div className="flex flex-col gap-[8px]">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Time range
          </span>
          <div className="relative mt-[6px]">
            <select
              value={timeRange}
              onChange={(event) => {
                event.stopPropagation();
                onUpdate({
                  compareTrendEnabled: true,
                  compareTimeRange: event.target.value as CompareTimeRange,
                });
              }}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              className="w-full appearance-none rounded-[6px] border border-[#2a2a2a] bg-[#121212] pl-3 pr-9 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none cursor-pointer pointer-events-auto"
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[14px] text-[#d0d0d0]">⌄</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative rounded-[6px] border border-[#1f1f1f] bg-[#111111] px-2 py-3">
            <svg
              width={sparkline.width}
              height={sparkline.height}
              viewBox={`0 0 ${sparkline.width} ${sparkline.height}`}
              className="mx-auto block"
            >
              <motion.line
                x1={0}
                x2={sparkline.width}
                y1={sparkline.referenceY}
                y2={sparkline.referenceY}
                stroke={accentColor}
                strokeWidth={1}
                strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 0.4 }}
              />
              <motion.path
                d={sparkline.path}
                fill="none"
                stroke={`rgba(255,255,255,0.35)`}
                strokeWidth={1.25}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
              {sparkline.points.map((point, index) =>
                index === sparkline.points.length - 1 ? (
                  <motion.circle
                    key={`point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill={accentColor}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  />
                ) : null
              )}
            </svg>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            { label: "Median", value: `${stats.median.toFixed(0)} PPM` },
            { label: "High", value: `${stats.high.toFixed(0)} PPM` },
            { label: "Low", value: `${stats.low.toFixed(0)} PPM` },
          ].map((metric) => (
            <div
              key={metric.label}
              className="flex-1 rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2"
            >
              <div className="font-abc-regular text-[10px] text-[#8f8f8f] tracking-[0.08em]">
                {metric.label}
              </div>
              <div className="font-abc-screen text-[12px] text-white">
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[8px]">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Crop target range
          </span>
          <div className="mt-[6px] space-y-2">
            <div className="relative h-[8px] w-full rounded-full bg-[#181818]">
              <div
                className="absolute top-0 h-full rounded-full bg-[#1f2a3f]"
                style={{
                  left: `${targetStart}%`,
                  width: `${targetWidth}%`,
                }}
              />
              <div
                className="absolute top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1f1f1f]"
                style={{
                  left: `${markerLeft}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#8f8f8f] font-abc-regular tracking-[0.08em]">
              <span>{targetRange.min} ppm</span>
              <span>{targetRange.max} ppm</span>
            </div>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[8px] border border-[#2a3c85] bg-[#1b2a3f] px-4 py-3 text-[12px] font-abc-regular text-[#e4ecff]"
        >
          {summary}
        </div>

        <div className="flex items-center justify-between pt-1 pointer-events-auto">
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="font-abc-regular text-[11px] text-[#6f8bbd] hover:text-[#9ebfff] transition-colors cursor-pointer pointer-events-auto"
          >
            View full analysis
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            onMouseDown={(event) => event.stopPropagation()}
            className="font-abc-regular text-[11px] text-[#a0a0a0] hover:text-[#ededed] transition-colors cursor-pointer pointer-events-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface RecordActionCardOverlayProps {
  position: { x: number; y: number };
  accentColor: string;
  config: TestResultConfig;
  onUpdate: (updates: Partial<TestResultConfig>) => void;
  onHeightChange: (height: number) => void;
}

function RecordActionCardOverlay({
  position,
  accentColor,
  config,
  onUpdate,
  onHeightChange,
}: RecordActionCardOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange(entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <motion.div
      ref={containerRef}
      className="absolute z-40"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={{ duration: 0.25 }}
    >
      <RecordActionCard accentColor={accentColor} config={config} onUpdate={onUpdate} />
    </motion.div>
  );
}

interface RecordActionCardProps {
  accentColor: string;
  config: TestResultConfig;
  onUpdate: (updates: Partial<TestResultConfig>) => void;
}

function RecordActionCard({ accentColor, config, onUpdate }: RecordActionCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);

  const defaultAction = useMemo(
    () => ({
      actionType: "boron-fertilizer-applied" as const,
      material: "solubor" as const,
      amountUnit: "ml" as const,
      dateApplied: todayIso,
      amount: undefined,
      notes: "",
    }),
    [todayIso]
  );

  const action = config.boronActionRecord ?? defaultAction;

  useEffect(() => {
    if (!config.boronActionRecord) {
      onUpdate({
        recordActionEnabled: true,
        boronActionRecord: defaultAction,
      });
    }
  }, [config.boronActionRecord, defaultAction, onUpdate]);

  const actionTypeOptions = [
    { value: "boron-fertilizer-applied", label: "Boron Fertilizer Applied" },
    { value: "soil-amendment", label: "Soil Amendment (Boron specific)" },
    { value: "foliar-spray", label: "Foliar Spray Application" },
    { value: "irrigation-adjustment", label: "Irrigation Adjustment" },
    { value: "other", label: "Other…" },
  ] as const;

  const materialOptions = [
    { value: "borax", label: "Borax (Sodium Borate)" },
    { value: "solubor", label: "Solubor (Boron Chelate)" },
    { value: "organic", label: "Organic Boron Source" },
    { value: "blended", label: "Blended Multi-Nutrient Mix" },
    { value: "custom", label: "Custom…" },
  ] as const;

  const unitOptions = [
    { value: "g", label: "g" },
    { value: "kg", label: "kg" },
    { value: "ml", label: "ml" },
    { value: "l", label: "L" },
    { value: "percent", label: "% solution" },
  ] as const;

  const unitLabelMap: Record<string, string> = {
    g: "g",
    kg: "kg",
    ml: "ml",
    l: "L",
    percent: "% solution",
  };

  const currentActionType =
    actionTypeOptions.find((option) => option.value === action.actionType)?.value ??
    "boron-fertilizer-applied";

  const currentMaterial =
    materialOptions.find((option) => option.value === action.material)?.value ?? "solubor";

  const syncAction = (updates: Partial<typeof action>) => {
    const next = { ...action, ...updates };
    onUpdate({
      recordActionEnabled: true,
      boronActionRecord: next,
    });
  };

  const handleAmountChange = (raw: string) => {
    const parsed = parseFloat(raw);
    syncAction({ amount: Number.isNaN(parsed) ? undefined : parsed });
  };

  const summaryMaterial =
    currentMaterial === "custom"
      ? action.materialDescription?.trim() || "custom material"
      : materialOptions.find((option) => option.value === currentMaterial)?.label ?? "material";

  const actionLabel =
    currentActionType === "other"
      ? action.actionDescription?.trim() || "custom action"
      : actionTypeOptions.find((option) => option.value === currentActionType)?.label ??
        "Recorded action";

  const formattedAmount =
    typeof action.amount === "number" && !Number.isNaN(action.amount)
      ? `${action.amount}${
          action.amountUnit
            ? action.amountUnit === "percent"
              ? " % solution"
              : unitLabelMap[action.amountUnit] ?? ""
            : ""
        }`
      : "";

  const amountFragment = formattedAmount ? ` (${formattedAmount.trim()})` : "";

  const summaryCore =
    currentActionType === "irrigation-adjustment"
      ? `Adjusted irrigation for ${summaryMaterial}`
      : currentActionType === "soil-amendment"
      ? `Amended soil with ${summaryMaterial}`
      : currentActionType === "foliar-spray"
      ? `Applied foliar spray using ${summaryMaterial}`
      : currentActionType === "other"
      ? `Recorded action: ${actionLabel}${summaryMaterial ? ` • ${summaryMaterial}` : ""}`
      : `Applied ${summaryMaterial}`;

  const datePhrase = action.dateApplied
    ? action.dateApplied === todayIso
      ? " today."
      : ` on ${format(new Date(action.dateApplied), "MMM d")}.`
    : ".";

  const summary = `${summaryCore}${amountFragment}${datePhrase}`;

  const isSaveDisabled =
    !currentActionType ||
    !summaryMaterial ||
    (currentActionType === "other" && !action.actionDescription?.trim()) ||
    (currentMaterial === "custom" && !action.materialDescription?.trim()) ||
    !action.dateApplied;

  return (
    <div className="flex flex-col gap-[6px] pointer-events-auto" style={{ width: 248 }}>
      <div className="rounded-[5px] border border-[#282828] bg-[#1a1a1a] px-[8px] py-[4px] flex items-center justify-between">
        <span className="font-abc-screen text-[10px] text-white tracking-[0.02em]">
          Record Action
        </span>
      </div>

      <div
        className={cn(
          "rounded-[5px] border bg-[#1a1a1a] flex flex-col pointer-events-auto",
          isSaved ? "px-[10px] py-[10px] gap-[6px]" : "px-[10px] pt-[10px] pb-[14px] gap-[20px]"
        )}
        style={{ borderColor: isSaved ? "#282828" : accentColor }}
      >
        {!isSaved && (
          <>
        {/* Action Type */}
        <div className="flex flex-col gap-[8px]">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Action type
          </span>
          <div className="relative mt-[6px]">
            <select
              value={currentActionType}
              onChange={(event) => {
                event.stopPropagation();
                syncAction({
                  actionType: event.target.value as typeof currentActionType,
                  actionDescription: event.target.value === "other" ? action.actionDescription : undefined,
                });
              }}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              className="w-full appearance-none rounded-[6px] border border-[#2a2a2a] bg-[#121212] pl-3 pr-9 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none cursor-pointer pointer-events-auto"
            >
              {actionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[14px] text-[#d0d0d0]">⌄</span>
          </div>
          {currentActionType === "other" && (
            <input
              type="text"
              value={action.actionDescription ?? ""}
              onChange={(event) => syncAction({ actionDescription: event.target.value })}
              placeholder="Describe action…"
              className="w-full rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none"
            />
          )}
        </div>

        {/* Material */}
        <div className="flex flex-col gap-[8px]">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Material
          </span>
          <div className="mt-[6px] flex flex-wrap gap-2">
            {materialOptions.map((option) => {
              const active = currentMaterial === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    syncAction({
                      material: option.value,
                      materialDescription: option.value === "custom" ? action.materialDescription : undefined,
                    });
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  className={cn(
                    "rounded-[6px] border px-3 py-2 text-[11px] font-abc-regular tracking-[0.08em] transition-colors cursor-pointer pointer-events-auto",
                    active
                      ? "border-[#3b82f6] bg-[#1b2a3f] text-[#e4ecff]"
                      : "border-[#2a2a2a] bg-[#121212] text-[#9d9d9d] hover:border-[#3b82f6]/60 hover:text-[#e4ecff]"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {currentMaterial === "custom" && (
            <input
              type="text"
              value={action.materialDescription ?? ""}
              onChange={(event) => syncAction({ materialDescription: event.target.value })}
              placeholder="Specify material…"
              className="w-full rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none"
            />
          )}
        </div>

        {/* Dosage */}
        <div className="flex flex-col gap-[8px]">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Amount
          </span>
          <div className="mt-[6px] flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={0.1}
              value={typeof action.amount === "number" && !Number.isNaN(action.amount) ? action.amount : ""}
              onChange={(event) => handleAmountChange(event.target.value)}
              placeholder="0"
              className="w-24 rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none"
            />
            <div className="relative">
              <select
                value={action.amountUnit ?? "ml"}
                onChange={(event) => {
                  event.stopPropagation();
                  syncAction({ amountUnit: event.target.value as (typeof unitOptions)[number]["value"] });
                }}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                className="appearance-none rounded-[6px] border border-[#2a2a2a] bg-[#121212] pl-3 pr-7 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none cursor-pointer pointer-events-auto"
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[13px] text-[#d0d0d0]">⌄</span>
            </div>
          </div>
        </div>

        {/* Date Applied */}
        <div className="flex flex-col gap-[8px]">
          <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
            Date
          </span>
          <input
            type="date"
            value={action.dateApplied ?? todayIso}
            onChange={(event) => syncAction({ dateApplied: event.target.value })}
            className="mt-[6px] w-full rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none cursor-pointer"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-[8px]">
          <input
            type="text"
            value={action.notes ?? ""}
            onChange={(event) => syncAction({ notes: event.target.value })}
            placeholder="Add context (weather, leaf condition, soil moisture)…"
            className="w-full rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none"
          />
        </div>

          </>
        )}

        {/* Summary strip - Always visible */}
        <div
          className="relative overflow-hidden rounded-[8px] border border-[#2a3c85] bg-[#1b2a3f] px-4 py-3 text-[12px] font-abc-regular text-[#e4ecff]"
        >
          {summary}
        </div>

        {!isSaved && (
          <div className="flex justify-center pt-2 pointer-events-auto">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsSaved(true);
              }}
              onMouseDown={(event) => event.stopPropagation()}
              disabled={isSaveDisabled}
              className={cn(
                "rounded-[6px] bg-[#3b82f6] px-4 py-2 text-[12px] font-abc-regular font-medium text-white transition-colors pointer-events-auto",
                isSaveDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[#2563eb]"
              )}
            >
              Save Action
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



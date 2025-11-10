"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useMemo, type RefObject } from "react";
import { motion } from "framer-motion";
import { SchemaNode, TestResultConfig, AnalyteType } from "@/types/schema";
import { ANALYTE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TestResultFlow } from "./TestResultFlow";

interface NodeCardProps {
  node: SchemaNode;
  onMove: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
  onConfigChange?: (nodeId: string, config: TestResultConfig) => void;
  overlayRef: RefObject<HTMLDivElement>;
	// When true, hide the root "+" node under this card (used when linked)
	suppressRootPlusNode?: boolean;
}

export function NodeCard({
  node,
  onMove,
  onClick,
  onConfigChange,
  overlayRef,
	suppressRootPlusNode,
}: NodeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState({ width: 260, height: 160 });

  const currentPosition = localPosition ?? { x: node.x, y: node.y };

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setCardSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const baseAccent = node.analyteType
    ? ANALYTE_COLORS[node.analyteType] ?? "#3a3a3a"
    : "#3a3a3a";

  const analytePresets: Partial<Record<AnalyteType, Record<string, unknown>>> = {
    phosphate: {
      testName: "Test P4",
      timestamp: "1h ago",
      analyteLabel: "Phosphate",
      status: "Elevated",
      statusIcon: "/Icons/exclamationmark.triangle 1.svg",
      trendImage: "/Icons/Phosphate_map.svg",
      value: 36.7,
      unit: "PPM",
      progress: 0.92,
    },
    boron: {
      testName: "Block P4 (North Plot)",
      timestamp: "8h ago",
      analyteLabel: "Boron",
      status: "Optimal",
      statusIcon: null, // No icon for Boron
      trendImage: "/Icons/Boron_map.svg",
      value: 1.20,
      unit: "PPM",
      progress: 1.0, // Full width for Boron
      progressColor: "#ea4124", // Red/orange color from Figma
      borderColor: "#282828", // Neutral border instead of accent
    },
    potassium: {
      testName: "P3 (South Plot)",
      timestamp: "2d ago",
      analyteLabel: "Potassium",
      status: "High",
      statusIcon: "/Icons/exclamationmark.triangle 1.svg",
      trendImage: "/Icons/Potassium_map.svg",
      value: 215.7,
      unit: "PPM",
      progress: 1.0, // Full width
      progressColor: "#ff9cc7", // Pink color from Figma
      borderColor: "#282828", // Neutral border instead of accent
    },
  };

  const analyteDefaults = node.analyteType
    ? {
        analyteLabel: node.label ?? "Analyte",
        accentColor: baseAccent,
        ...analytePresets[node.analyteType],
      }
    : null;

  const analyteData =
    node.analyteType && analyteDefaults
      ? {
          ...analyteDefaults,
          ...((node.data as Record<string, unknown>) || {}),
        }
      : null;

  const accentColor =
    (typeof analyteData?.accentColor === "string"
      ? (analyteData?.accentColor as string)
      : undefined) ?? baseAccent;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current && cardRef.current.contains(e.target as Node)) {
      e.stopPropagation();
      const { x, y } = currentPosition;
      setIsDragging(true);
      setDragStart({
        x: e.clientX - x,
        y: e.clientY - y,
      });
      setLocalPosition({ x, y });
      onClick(node.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setLocalPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      const { x, y } = localPosition ?? { x: node.x, y: node.y };
      const snappedX = Math.round(x / 20) * 20;
      const snappedY = Math.round(y / 20) * 20;
      onMove(node.id, snappedX, snappedY);
    }
    setIsDragging(false);
    setLocalPosition(null);
  };

  const cardDimensions = useMemo(() => ({
    left: currentPosition.x,
    top: currentPosition.y,
    right: currentPosition.x + cardSize.width,
    bottom: currentPosition.y + cardSize.height,
    width: cardSize.width,
    height: cardSize.height,
  }), [currentPosition.x, currentPosition.y, cardSize.width, cardSize.height]);

  const isAnalyteNode = Boolean(analyteData);

  const flowComponent =
    node.analyteType && onConfigChange ? (
      <TestResultFlow
        analyteType={node.analyteType}
        config={
          node.testConfig || {
            enabled: false,
            scheduleFollowUp: false,
            followUpFrequency: "weekly",
            thresholdAlert: false,
            thresholdDirection: "above",
            notifications: false,
          }
        }
        onConfigChange={(config) => onConfigChange(node.id, config)}
        value={
          typeof node.data?.value === "number" ? node.data.value : undefined
        }
        nodeRect={cardDimensions}
        overlayRef={overlayRef}
				showSummary={!Boolean(analyteData)}
				suppressPlusNode={Boolean(suppressRootPlusNode)}
      />
    ) : null;

  const analyteSummary =
    analyteData && node.analyteType ? (
      <div
        className="relative space-y-[6px]"
        style={{
          width: 248,
        }}
      >
        <div
        className="rounded-[5px] border bg-[#1a1a1a] px-[8px] py-[4px] flex items-center justify-between"
        style={{ borderColor: "#282828" }}
        >
          <span className="font-abc-screen text-[10px] text-white tracking-[0.02em]">
            {analyteData.testName}
          </span>
          <span className="font-abc-screen text-[10px] text-[#c1c1c1] tracking-[0.02em]">
            {analyteData.timestamp}
          </span>
        </div>

        <div
          className="rounded-[5px] border bg-[#1a1a1a] px-[10px] pt-[10px] pb-[14px] flex flex-col gap-[20px]"
          style={{ 
            borderColor: typeof analyteData.borderColor === "string" 
              ? analyteData.borderColor 
              : "#282828"
          }}
        >
          <div className="flex items-start justify-between">
            <span className="font-abc-regular text-[12px] text-white tracking-[0.015em]">
              {analyteData.analyteLabel}
            </span>
            <div className="flex items-center gap-[6px] rounded-[3px] border border-[#2c2c2c] bg-[#202020] px-[6px] py-[4px]">
              {analyteData.statusIcon && (
                <Image
                  src={analyteData.statusIcon as string}
                  alt=""
                  width={11}
                  height={11}
                  className="h-[11px] w-[11px]"
                  priority={false}
                />
              )}
              <span className="font-abc-mono text-[10px] leading-[11px] text-white">
                {analyteData.status}
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-[6px]">
              <span className="font-abc-regular text-[24.68px] leading-[24px] text-white">
                {typeof analyteData.value === "number"
                  ? node.analyteType === "boron"
                    ? analyteData.value.toFixed(2)
                    : analyteData.value.toFixed(1)
                  : analyteData.value}
              </span>
              <div className="flex flex-col font-abc-mono h-[36px] justify-center leading-[0] text-[#d9d9d9] text-[10px] w-[19px]">
                <span className="leading-[11px]">{analyteData.unit}</span>
              </div>
            </div>
            <Image
              src={
                typeof analyteData.trendImage === "string"
                  ? (analyteData.trendImage as string)
                  : "/Icons/Phosphate_map.svg"
              }
              alt={`${analyteData.analyteLabel} trend`}
              width={node.analyteType === "boron" ? 107 : node.analyteType === "potassium" ? 107 : 106}
              height={32}
              className={node.analyteType === "boron" ? "h-[32px] w-[107px]" : node.analyteType === "potassium" ? "h-[32px] w-[107px]" : "h-[36px] w-[106px]"}
              priority={false}
            />
          </div>

          <div className="h-[7px] w-full rounded-[2px] bg-[#161616]">
            <div
              className="h-full rounded-[2px]"
              style={{
                width: `${Math.round(
                  Math.min(
                    Math.max(
                      typeof analyteData.progress === "number"
                        ? analyteData.progress
                        : 0.92,
                      0
                    ),
                    1
                  ) * 100
                )}%`,
                backgroundColor: typeof analyteData.progressColor === "string"
                  ? analyteData.progressColor
                  : accentColor,
              }}
            />
          </div>
        </div>
        {flowComponent}
      </div>
    ) : null;

  const cardIcon = getNodeIcon(node.type);

  const defaultCard = (
    <div className="relative">
      <div
        className={cn(
          "bg-[#1a1a1a] rounded-lg border",
          "min-w-[240px]",
          "transition-all duration-200"
        )}
        style={{
          borderColor: "transparent",
          borderLeftColor: isDragging ? "transparent" : accentColor,
          borderLeftWidth: "3px",
        }}
      >
        <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-3">
          {cardIcon ? (
            <div className="text-lg">{cardIcon}</div>
          ) : null}
          <div className="flex-1">
            <div className="text-sm font-medium text-[#ededed]">{node.label}</div>
            <div className="text-xs text-[#666666] mt-0.5">{getDataType(node.type)}</div>
          </div>
        </div>

        <div className="px-4 py-3">
          {flowComponent}
          {!node.analyteType && (
            <div className="text-xs text-[#a0a0a0]">
              {node.data ? JSON.stringify(node.data, null, 2) : "No data"}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "absolute select-none",
        "group",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        left: currentPosition.x,
        top: currentPosition.y,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: isDragging ? "none" : "0 4px 16px rgba(0, 0, 0, 0.2)",
      }}
      whileHover={{}}
      transition={{ duration: 0.2 }}
    >
      {isAnalyteNode ? analyteSummary : defaultCard}
    </motion.div>
  );
}

function getNodeIcon(type: string): string {
  const icons: Record<string, string> = {
    "crop-type": "",
    "nitrate-result": "🧪",
    "phosphate-result": "🧪",
    "boron-result": "🧪",
    "potassium-result": "🧪",
    "ph-result": "🧪",
    "short-text": "📝",
    "long-text": "📄",
    "number": "#",
    "toggle": "⚡",
    "followup-reminder": "⏰",
    "webhook-action": "🔗",
    record: "",
  };
  return icons[type] || "";
}

function getDataType(type: string): string {
  const types: Record<string, string> = {
    "crop-type": "New Crop",
    "nitrate-result": "NUMBER",
    "phosphate-result": "NUMBER",
    "boron-result": "NUMBER",
    "potassium-result": "NUMBER",
    "ph-result": "NUMBER",
    "short-text": "STRING",
    "long-text": "STRING",
    number: "INTEGER",
    toggle: "BOOLEAN",
    "followup-reminder": "AUTOMATION",
    "webhook-action": "AUTOMATION",
    record: "New Record",
  };
  return types[type] || "UNKNOWN";
}


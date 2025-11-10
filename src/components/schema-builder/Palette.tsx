"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { NodeType, NodeCategory } from "@/types/schema";
import { NODE_TYPES, ANALYTE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PaletteProps {
  onNodeAdd: (nodeType: NodeType) => void;
}

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  relational: "Relational Fields",
  normal: "Recent Results",
  automation: "Automation Fields",
};

export function Palette({ onNodeAdd }: PaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
    new Set(["relational", "normal", "automation"])
  );

  const toggleCategory = (category: NodeCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const nodesByCategory = NODE_TYPES.reduce(
    (acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    },
    {} as Record<NodeCategory, NodeType[]>
  );

  return (
    <div className="h-full bg-[#0f0f0f] border-l border-[#1f1f1f] flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1f1f1f]">
        <div className="font-abc-screen text-[10px] uppercase tracking-[0.16em] text-[#6b6b6b]">
          Resources
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {(["relational", "normal", "automation"] as NodeCategory[]).map((category) => {
          const nodes = nodesByCategory[category] || [];
          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category} className="border-b border-[#1f1f1f]">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  "w-full px-4 py-3 flex items-center justify-between",
                  "hover:bg-[#121212] transition-colors",
                  "text-left"
                )}
              >
                <span className="text-[11px] font-abc-regular text-[#d4d4d4] tracking-[0.04em]">
                  {CATEGORY_LABELS[category]}
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-[#a0a0a0]"
                  >
                    <path
                      d="M6 9L1 4h10L6 9z"
                      fill="currentColor"
                    />
                  </svg>
                </motion.div>
              </button>

              {/* Category Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 py-2 space-y-3 flex flex-col items-center">
                      {(() => {
                        // Sort nodes by timestamp for normal category (Recent Results)
                        if (category === "normal") {
                          const timestampOrder: Record<string, number> = {
                            "1h ago": 1,
                            "2h ago": 2,
                            "8h ago": 8,
                            "1d ago": 24,
                            "2d ago": 48,
                            "3d ago": 72,
                          };
                          
                          const getTimestampValue = (node: NodeType): number => {
                            if (!node.analyteType) return 999;
                            const presets: Record<string, string> = {
                              phosphate: "1h ago",
                              boron: "8h ago",
                              potassium: "2d ago",
                            };
                            const timestamp = presets[node.analyteType] ?? "1h ago";
                            return timestampOrder[timestamp] ?? 999;
                          };
                          
                          const sorted = [...nodes].sort((a, b) => {
                            const aTime = getTimestampValue(a);
                            const bTime = getTimestampValue(b);
                            return aTime - bTime; // Most recent first (smaller number = more recent)
                          });
                          
                          return sorted.map((node) => (
                            <PaletteItem
                              key={node.id}
                              node={node}
                              onClick={() => onNodeAdd(node)}
                            />
                          ));
                        }
                        
                        return nodes.map((node) => (
                          <PaletteItem
                            key={node.id}
                            node={node}
                            onClick={() => onNodeAdd(node)}
                          />
                        ));
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PaletteItemProps {
  node: NodeType;
  onClick: () => void;
}

function PaletteItem({ node, onClick }: PaletteItemProps) {
  const accentColor = node.analyteType
    ? ANALYTE_COLORS[node.analyteType]
    : "#3a3a3a";

  // Special rendering for Recent Results (normal category)
  if (node.category === "normal" && node.analyteType) {
    const analyteNames = {
      nitrate: "Nitrate",
      phosphate: "Phosphate",
      boron: "Boron",
      potassium: "Potassium",
      ph: "pH"
    };

    const analyteUnits = {
      nitrate: "PPM",
      phosphate: "PPM",
      boron: "PPM",
      potassium: "PPM",
      ph: "pH"
    };

    const statusIcons = {
      nitrate: "/Icons/exclamationmark.triangle 1.svg",
      phosphate: "/Icons/exclamationmark.triangle 1.svg",
      boron: "/Icons/exclamationmark.triangle 1.svg",
      potassium: "/Icons/exclamationmark.triangle 1.svg",
      ph: "/Icons/exclamationmark.triangle 1.svg"
    };

    const analyteName = analyteNames[node.analyteType];
    const unit = analyteUnits[node.analyteType];
    const statusIcon = statusIcons[node.analyteType];

    // Mock data for display - in real app this would come from props/state
    const mockValue = node.analyteType === "phosphate" ? "36.7" :
                     node.analyteType === "nitrate" ? "24.3" :
                     node.analyteType === "boron" ? "0.8" :
                     node.analyteType === "potassium" ? "156.2" : "6.8";

    // Get preset data to match the actual card values
    const analytePresets: Partial<Record<typeof node.analyteType, { testName: string; timestamp: string; value: number; status: string; statusIcon: string | null; progress: number; progressColor?: string }>> = {
      phosphate: {
        testName: "Test P4",
        timestamp: "1h ago",
        value: 36.7,
        status: "Elevated",
        statusIcon: "/Icons/exclamationmark.triangle 1.svg",
        progress: 1.0, // Full width to match potassium and boron
      },
      boron: {
        testName: "Block P4 (North Plot)",
        timestamp: "8h ago",
        value: 1.20,
        status: "Optimal",
        statusIcon: null,
        progress: 1.0,
        progressColor: "#ea4124",
      },
      potassium: {
        testName: "P3 (South Plot)",
        timestamp: "2d ago",
        value: 215.7,
        status: "High",
        statusIcon: "/Icons/exclamationmark.triangle 1.svg",
        progress: 1.0,
        progressColor: "#ff9cc7",
      },
      nitrate: {
        testName: "Test N3",
        timestamp: "1h ago",
        value: 24.3,
        status: "Elevated",
        statusIcon: "/Icons/exclamationmark.triangle 1.svg",
        progress: 1.0, // Full width to match potassium and boron
      },
      ph: {
        testName: "Test H1",
        timestamp: "1h ago",
        value: 6.8,
        status: "Optimal",
        statusIcon: "/Icons/exclamationmark.triangle 1.svg",
        progress: 1.0, // Full width to match potassium and boron
      },
    };

    const preset = node.analyteType ? analytePresets[node.analyteType] : null;
    const testName = preset?.testName ?? `Test ${node.analyteType === "phosphate" ? "P4" : node.analyteType === "nitrate" ? "N3" : node.analyteType === "boron" ? "B2" : node.analyteType === "potassium" ? "K5" : "H1"}`;
    const timestamp = preset?.timestamp ?? "1h ago";
    const value = preset?.value ?? parseFloat(mockValue);
    const status = preset?.status ?? "Elevated";
    const hasStatusIcon = preset?.statusIcon !== null;
    const progress = preset?.progress ?? 0.92;
    const progressBarColor = preset?.progressColor ?? accentColor;

    return (
      <motion.button
        onClick={onClick}
        className="w-[180px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[5px] hover:bg-[#1f1f1f] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex flex-col gap-[6px] items-start p-[10px]">
          {/* Top row - Test name and timestamp */}
          <div className="flex items-center justify-between w-full">
            <span className="font-abc-screen text-[10px] text-[#c7c7c7] tracking-[0.02em]">
              {testName}
            </span>
            <span className="font-abc-screen text-[10px] text-[#c7c7c7] tracking-[0.02em]">
              {timestamp}
            </span>
          </div>

          {/* Middle row - Analyte name, value, and status */}
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col items-start">
              <span className="font-abc-regular text-[12px] text-white tracking-[0.015em]">
                {analyteName}
              </span>
              <div className="flex items-center gap-[2.4px]">
                <span className="font-abc-regular text-[9.872px] text-white">
                  {value.toFixed(node.analyteType === "boron" ? 2 : 1)}
                </span>
                <div className="flex flex-col justify-center h-[14px] w-[28px]">
                  <span className="font-abc-mono text-[8px] text-[#d9d9d9] leading-[4.4px]">
                    {unit}
                  </span>
                </div>
              </div>
            </div>
            {hasStatusIcon && (
              <div className="bg-[#2a2a2a] flex items-end justify-center p-[5px] rounded-[2px]">
                <Image
                  src={preset?.statusIcon ?? statusIcon}
                  alt=""
                  width={11}
                  height={10}
                  className="h-[9.928px] w-[10.991px]"
                  priority={false}
                />
              </div>
            )}
          </div>

          {/* Bottom row - Progress bar */}
          <div className="flex items-center justify-center w-full">
            <div className="rotate-[180deg] w-full">
              <div
                className="h-[7px] rounded-[2px]"
                style={{
                  width: `${progress * 100}%`,
                  backgroundColor: progressBarColor,
                }}
              />
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  // Default rendering for other categories (matching Recent Results style)
  return (
    <motion.button
      onClick={onClick}
      className="w-[180px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[5px] hover:bg-[#1f1f1f] transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col gap-[6px] items-start p-[10px]">
        {/* Top row - Label and icon */}
        <div className="flex items-center justify-between w-full">
          <span className="font-abc-screen text-[10px] text-[#c7c7c7] tracking-[0.02em]">
            {node.label}
          </span>
          {node.icon ? (
            <div className="text-base">{node.icon}</div>
          ) : null}
        </div>

        {/* Bottom row - Data type */}
        <div className="flex items-center justify-between w-full">
          <span className="font-abc-regular text-[12px] text-white tracking-[0.015em]">
            {node.dataType}
          </span>
        </div>

        {/* Bottom row - Progress bar */}
        <div className="flex items-center justify-center w-full">
          <div className="rotate-[180deg] w-full">
            <div
              className="h-[7px] rounded-[2px]"
              style={{
                width: "100%",
                backgroundColor: accentColor,
              }}
            />
          </div>
        </div>
      </div>
    </motion.button>
  );
}


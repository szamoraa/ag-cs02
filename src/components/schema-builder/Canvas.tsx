"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SchemaNode, TestResultConfig, CardLink } from "@/types/schema";
import { ANALYTE_COLORS } from "@/lib/constants";
import { NodeCard } from "./NodeCard";
import { ConditionCardOverlay } from "./TestResultFlow";
import { CombinedConditionOverlay } from "./CombinedConditionCard";
import { LinkDot } from "./LinkDot";
import { ConnectorLines } from "./ConnectorLines";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CanvasProps {
  nodes: SchemaNode[];
  links?: CardLink[];
  onNodeMove: (id: string, x: number, y: number) => void;
  onNodeClick: (id: string) => void;
  onConfigChange?: (nodeId: string, config: TestResultConfig) => void;
  onLinkCreate: (sourceId: string, targetId: string, linkDotPos: { x: number; y: number }) => void;
  onLinkRemove: (linkId: string) => void;
  onLinkUpdate: (linkId: string, updates: Partial<CardLink>) => void;
  selectedNodeId?: string;
}

const SNAP_RADIUS = 40; // 40px snap radius
const CARD_WIDTH = 248;
const CARD_HEIGHT = 160;

export function Canvas({
  nodes,
  links = [],
  onNodeMove,
  onNodeClick,
  onConfigChange,
  onLinkCreate,
  onLinkRemove,
  onLinkUpdate,
  selectedNodeId,
}: CanvasProps) {
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [suppressLinkDetection, setSuppressLinkDetection] = useState(false);
  const [hoveredLinkDot, setHoveredLinkDot] = useState<string | null>(null);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [linkOverlay, setLinkOverlay] = useState<
    | { type: "condition"; linkId: string; sourceNodeId: string }
    | { type: "combined"; linkId: string }
    | null
  >(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nodes.length > 0 && !introDismissed) {
      setIntroDismissed(true);
    }
  }, [nodes.length, introDismissed]);

  // Detect proximity between cards
  const proximityPairs = useMemo(() => {
    const pairs: Array<{
      sourceId: string;
      targetId: string;
      midpoint: { x: number; y: number };
      distance: number;
    }> = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const source = nodes[i];
        const target = nodes[j];

        // Check horizontal proximity (left card's right edge to right card's left edge)
        const sourceRight = source.x + CARD_WIDTH;
        const sourceCenterX = source.x + CARD_WIDTH / 2;
        const targetCenterX = target.x + CARD_WIDTH / 2;
        const horizontalDistance = target.x - sourceRight;

        // Check if cards are horizontally aligned (within snap radius)
        if (horizontalDistance > 0 && horizontalDistance <= SNAP_RADIUS) {
          // Check vertical overlap (cards should overlap vertically)
          const sourceTop = source.y;
          const sourceBottom = source.y + CARD_HEIGHT;
          const targetTop = target.y;
          const targetBottom = target.y + CARD_HEIGHT;

          const verticalOverlap =
            Math.max(sourceTop, targetTop) < Math.min(sourceBottom, targetBottom);

          if (verticalOverlap) {
            // Position dot below the cards, centered between card centers
            const dotX = (sourceCenterX + targetCenterX) / 2;
            const dotY = Math.max(sourceBottom, targetBottom) + 36;

            // Check if link already exists
            const linkExists = links.some(
              (link) =>
                (link.sourceNodeId === source.id && link.targetNodeId === target.id) ||
                (link.sourceNodeId === target.id && link.targetNodeId === source.id)
            );

            if (!linkExists) {
              pairs.push({
                sourceId: source.id,
                targetId: target.id,
                midpoint: { x: dotX, y: dotY },
                distance: horizontalDistance,
              });
            }
          }
        }
      }
    }

    return pairs;
  }, [nodes, links]);

  // Handle keyboard modifiers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        setSuppressLinkDetection(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        setSuppressLinkDetection(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as Node | null;
    const isCanvas = target === canvasRef.current;
    const isContent = target === contentRef.current;
    const isOverlay = target === overlayRef.current;
    if (isCanvas || isContent || isOverlay) {
      setIsPanning(true);
      panStartRef.current = { ...pan };
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !canvasRef.current) return;
    if (!panStartRef.current || !pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    setPan({ x: panStartRef.current.x + dx, y: panStartRef.current.y + dy });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
    pointerStartRef.current = null;
  }, []);

  return (
    <div
      ref={canvasRef}
      className={cn(
        "canvas-area relative w-full h-full overflow-hidden",
        "dotted-grid bg-[#111111]",
        isPanning ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={contentRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0)` }}
      >
        <AnimatePresence>
          {nodes.length === 0 && !introDismissed && (
            <motion.button
              key="agrilo-intro"
              className="absolute inset-0 flex items-center justify-center"
              onClick={() => setIntroDismissed(true)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none select-none"
              >
                <Image
                  src="/Icons/Agrilo_Icon_White-06.svg"
                  alt="Agrilo"
                  width={180}
                  height={180}
                  priority
                  className="w-[180px] h-[180px] opacity-40"
                />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>

        {nodes.length === 0 && !introDismissed ? null : (
          <>
            {/* SVG overlay for connectors and preview lines */}
            <svg
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: "100%", height: "100%" }}
            >
              {/* Preview lines for proximity pairs */}
              {!suppressLinkDetection &&
                proximityPairs.map((pair) => {
                  const sourceNode = nodes.find((n) => n.id === pair.sourceId);
                  const targetNode = nodes.find((n) => n.id === pair.targetId);
                  if (!sourceNode || !targetNode) return null;

                  const sourceAccent = sourceNode.analyteType
                    ? ANALYTE_COLORS[sourceNode.analyteType]
                    : "#3B82F6";

                  // Preview lines connect from card bottoms to the dot below
                  const sourceBottomX = sourceNode.x + CARD_WIDTH / 2;
                  const sourceBottomY = sourceNode.y + CARD_HEIGHT;
                  const targetBottomX = targetNode.x + CARD_WIDTH / 2;
                  const targetBottomY = targetNode.y + CARD_HEIGHT;

                  return (
                    <g key={`preview-${pair.sourceId}-${pair.targetId}`}>
                      <motion.line
                        x1={sourceBottomX}
                        y1={sourceBottomY}
                        x2={pair.midpoint.x}
                        y2={pair.midpoint.y}
                        stroke={sourceAccent}
                        strokeWidth={1}
                        strokeOpacity={0.3}
                        strokeDasharray="4 4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                      <motion.line
                        x1={targetBottomX}
                        y1={targetBottomY}
                        x2={pair.midpoint.x}
                        y2={pair.midpoint.y}
                        stroke={sourceAccent}
                        strokeWidth={1}
                        strokeOpacity={0.3}
                        strokeDasharray="4 4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    </g>
                  );
                })}

              {/* Render connectors for existing links */}
              {links.map((link) => {
                const sourceNode = nodes.find((n) => n.id === link.sourceNodeId);
                const targetNode = nodes.find((n) => n.id === link.targetNodeId);
                if (!sourceNode || !targetNode) return null;

                const sourcePos = {
                  x: sourceNode.x,
                  y: sourceNode.y,
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                };
                const targetPos = {
                  x: targetNode.x,
                  y: targetNode.y,
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                };

                const sourceAccent = sourceNode.analyteType
                  ? ANALYTE_COLORS[sourceNode.analyteType]
                  : "#3B82F6";

                return (
                  <ConnectorLines
                    key={link.id}
                    sourceCardPos={sourcePos}
                    targetCardPos={targetPos}
                    linkDotPos={link.linkDotPosition}
                    menuNodePos={link.menuNodePosition}
                    accentColor={sourceAccent}
                    opacity={hoveredLinkDot === link.id ? 0.6 : 0.4}
                  />
                );
              })}
            </svg>

            {/* Render nodes */}
            {nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                onMove={onNodeMove}
                onClick={onNodeClick}
                onConfigChange={onConfigChange}
                overlayRef={overlayRef}
                suppressRootPlusNode={links.some((l) => l.sourceNodeId === node.id || l.targetNodeId === node.id)}
              />
            ))}

            {/* Render link dots for proximity pairs - behind cards */}
            {!suppressLinkDetection &&
              proximityPairs.map((pair, index) => {
                const sourceNode = nodes.find((n) => n.id === pair.sourceId);
                const targetNode = nodes.find((n) => n.id === pair.targetId);
                if (!sourceNode || !targetNode) return null;

                const sourceAccent = sourceNode.analyteType
                  ? ANALYTE_COLORS[sourceNode.analyteType]
                  : "#3B82F6";

                return (
                  <LinkDot
                    key={`proximity-${pair.sourceId}-${pair.targetId}`}
                    position={pair.midpoint}
                    isLinked={false}
                    onLink={() => {
                      onLinkCreate(pair.sourceId, pair.targetId, pair.midpoint);
                    }}
                    accentColor={sourceAccent}
                  />
                );
              })}

            {/* Render link dots for existing links - behind cards */}
            {links.map((link) => {
              const sourceNode = nodes.find((n) => n.id === link.sourceNodeId);
              const targetNode = nodes.find((n) => n.id === link.targetNodeId);
              if (!sourceNode || !targetNode) return null;

              // Check if cards are still within 2x snap radius
              const sourceRight = sourceNode.x + CARD_WIDTH;
              const targetLeft = targetNode.x;
              const distance = targetLeft - sourceRight;
              const maxDistance = SNAP_RADIUS * 2;

              if (distance > maxDistance) return null; // Hide dot if too far

              const sourceAccent = sourceNode.analyteType
                ? ANALYTE_COLORS[sourceNode.analyteType]
                : "#3B82F6";

              return (
                <LinkDot
                  key={link.id}
                  position={link.linkDotPosition}
                  isLinked={true}
                  onLink={() => {
                    // Open menu if not already open
                    if (!link.menuOpen) {
                      const menuY = link.linkDotPosition.y + 60;
                      onLinkUpdate(link.id, {
                        menuNodePosition: { x: link.linkDotPosition.x, y: menuY },
                        menuOpen: true,
                      });
                    }
                  }}
                  onUnlink={() => onLinkRemove(link.id)}
                  onHover={(hovered) => {
                    setHoveredLinkDot(hovered ? link.id : null);
                  }}
                  accentColor={sourceAccent}
                  linkedClickOpensMenu={true}
                />
              );
            })}

            {/* Connection menus anchored to link dots */}
            {links.map((link) => {
              if (!link.menuOpen || !link.menuNodePosition) return null;
              const left = link.menuNodePosition.x - 76; // ~153px width / 2
              const top = link.menuNodePosition.y;
              return (
                <div
                  key={`menu-${link.id}`}
                  className="absolute z-[70]"
                  style={{ left, top, pointerEvents: "auto" }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex w-[153px] flex-col gap-[6px] rounded-[5px] border border-[#282828] bg-[#1a1a1a] p-[10px] shadow-xl">
                    {[
                      { id: "combined-condition", label: "Combined condition" },
                      { id: "set-condition", label: "Set condition" },
                      { id: "compare-trend", label: "Compare trend" },
                      { id: "record-action", label: "Record action" },
                      { id: "recommendation", label: "Recommendation", dashed: true },
                    ].map((option) => (
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
                          onLinkUpdate(link.id, { menuOpen: false });
                          if (option.id === "set-condition") {
                            setLinkOverlay({ type: "condition", linkId: link.id, sourceNodeId: link.sourceNodeId });
                            // Initialize basic config if needed
                            const source = nodes.find((n) => n.id === link.sourceNodeId);
                            if (source && onConfigChange) {
                              const nextConfig = {
                                enabled: true,
                                scheduleFollowUp: true,
                                followUpFrequency: "weekly" as const,
                                thresholdAlert: false,
                                thresholdDirection: "above" as const,
                                notifications: false,
                              };
                              onConfigChange(source.id, { ...(source.testConfig ?? {}), ...nextConfig });
                            }
                          } else if (option.id === "combined-condition") {
                            setLinkOverlay({ type: "combined", linkId: link.id });
                          }
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Overlay card for connection actions */}
            {linkOverlay && (() => {
              const link = links.find((l) => l.id === linkOverlay.linkId);
              if (!link || !link.menuNodePosition) return null;
              const overlayPos = { x: link.menuNodePosition.x - 124, y: link.menuNodePosition.y + 8 }; // center ~248px
              if (linkOverlay.type === "condition") {
                const sourceNode = nodes.find((n) => n.id === linkOverlay.sourceNodeId);
                if (!sourceNode) return null;
                const accent = sourceNode.analyteType ? ANALYTE_COLORS[sourceNode.analyteType] : "#3B82F6";
                const config = sourceNode.testConfig ?? {
                  enabled: true,
                  scheduleFollowUp: true,
                  followUpFrequency: "weekly" as const,
                  thresholdAlert: false,
                  thresholdDirection: "above" as const,
                  notifications: false,
                };
                return (
                  <ConditionCardOverlay
                    position={overlayPos}
                    accentColor={accent}
                    config={config}
                    onUpdate={(updates) => onConfigChange?.(sourceNode.id, { ...(sourceNode.testConfig ?? {}), ...updates })}
                    onHeightChange={() => {}}
                  />
                );
              }
              // Combined condition
              const source = nodes.find((n) => n.id === link.sourceNodeId);
              const target = nodes.find((n) => n.id === link.targetNodeId);
              if (!source || !target) return null;
              // Units already validated on link creation; proceed
              const accent = source.analyteType ? ANALYTE_COLORS[source.analyteType] : "#3B82F6";
              const nutrients = [
                {
                  nodeId: source.id,
                  analyteLabel: source.label,
                  unit: "PPM" as const,
                  defaultValue: typeof source.data?.value === "number" ? source.data.value : undefined,
                },
                {
                  nodeId: target.id,
                  analyteLabel: target.label,
                  unit: "PPM" as const,
                  defaultValue: typeof target.data?.value === "number" ? target.data.value : undefined,
                },
              ];
              return (
                <CombinedConditionOverlay
                  position={overlayPos}
                  accentColor={accent}
                  nutrients={nutrients}
                  initial={link.combinedCondition ?? null}
                  onSave={(config) => {
                    onLinkUpdate(link.id, { combinedCondition: config });
                    setLinkOverlay(null);
                    // Placeholder toast
                    console.log("Combined condition saved. Agrilo will monitor these nutrients.");
                  }}
                  onCancel={() => setLinkOverlay(null)}
                  onHeightChange={() => {}}
                />
              );
            })()}
          </>
        )}

        {/* Flow overlay (follows content transform) */}
        <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-30" />
      </div>

      {/* UI overlay (fixed to viewport) */}
      {nodes.length > 0 && (
        <div className="absolute bottom-4 right-4 text-xs text-[#666666] select-none pointer-events-none">
          Canvas offset: {pan.x}px, {pan.y}px
        </div>
      )}
    </div>
  );
}


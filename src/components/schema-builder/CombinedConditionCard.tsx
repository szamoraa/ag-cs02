"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CombinedConditionConfig,
  CombinedThreshold,
  NotificationChannel,
} from "@/types/schema";

export interface CombinedConditionOverlayProps {
  position: { x: number; y: number };
  accentColor: string;
  nutrients: Array<{
    nodeId: string;
    analyteLabel: string;
    unit: "PPM";
    defaultValue?: number;
  }>;
  initial?: CombinedConditionConfig | null;
  onSave: (config: CombinedConditionConfig) => void;
  onCancel?: () => void;
  onHeightChange?: (height: number) => void;
}

export function CombinedConditionOverlay({
  position,
  accentColor,
  nutrients,
  initial,
  onSave,
  onCancel,
  onHeightChange,
}: CombinedConditionOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange?.(entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const defaultThresholds: CombinedThreshold[] = nutrients.map((n) => ({
    nodeId: n.nodeId,
    analyteLabel: n.analyteLabel,
    direction: "above",
    value: typeof n.defaultValue === "number" ? Math.round(n.defaultValue) : 36,
    unit: "PPM",
  }));

  const [logic, setLogic] = useState<CombinedConditionConfig["logic"]>(
    initial?.logic ?? "any"
  );
  const [thresholds, setThresholds] = useState<CombinedThreshold[]>(
    initial?.thresholds ?? defaultThresholds
  );
  const [frequency, setFrequency] =
    useState<CombinedConditionConfig["frequency"]>(
      initial?.frequency ?? "on-new-result"
    );
  const [customDays, setCustomDays] = useState<number>(
    initial?.customDays ?? 7
  );
  const [channels, setChannels] = useState<NotificationChannel[]>(
    initial?.notificationChannels ?? ["app"]
  );
  const [recipients, setRecipients] = useState<string>(
    initial?.recipients ?? ""
  );
  const [severity, setSeverity] =
    useState<CombinedConditionConfig["severity"]>(
      initial?.severity ?? "warning"
    );
  const [tock, setTock] = useState(0);

  const updateThreshold = (
    nodeId: string,
    updates: Partial<CombinedThreshold>
  ) => {
    setThresholds((prev) =>
      prev.map((t) => (t.nodeId === nodeId ? { ...t, ...updates } : t))
    );
    setTock((x) => x + 1);
  };

  const toggleChannel = (channel: NotificationChannel) => {
    setChannels((prev) => {
      const exists = prev.includes(channel);
      return exists ? prev.filter((c) => c !== channel) : [...prev, channel];
    });
  };

  const isSaveDisabled =
    channels.length === 0 || thresholds.some((t) => Number.isNaN(t.value));

  const summary = useMemo(() => {
    const comparisons = thresholds.map((t) => {
      const symbol = t.direction === "above" ? ">" : "<";
      return `${t.analyteLabel} ${symbol} ${t.value} ${t.unit}`;
    });
    const lhs =
      logic === "any"
        ? `Trigger if ${comparisons.join(" or ")}`
        : `Trigger when ${comparisons.join(" and ")}`;
    const cadence =
      frequency === "on-new-result"
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
        : "On new result";
    const routes = channels.join(", ");
    return `${lhs} → check ${cadence} → notify ${routes || "—"}`;
  }, [logic, thresholds, frequency, customDays, channels, tock]);

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
      <div
        className="flex flex-col gap-[6px] pointer-events-auto"
        style={{ width: 248 }}
      >
        <div className="rounded-[5px] border border-[#282828] bg-[#1a1a1a] px-[8px] py-[4px] flex items-center justify-between">
          <span className="font-abc-screen text-[10px] text-white tracking-[0.02em]">
            Combined Condition
          </span>
          <div className="h-[13px] w-[188px]" />
        </div>

        <div
          className="rounded-[5px] border bg-[#1a1a1a] flex flex-col px-[10px] pt-[10px] pb-[14px] gap-[14px] pointer-events-auto"
          style={{ borderColor: accentColor }}
        >
          <div className="flex flex-col gap-[8px]">
            <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
              LOGIC
            </span>
            <div className="flex h-[28px] rounded-[6px] border border-[#2a2a2a] bg-[#121212] py-[2px] px-[2px]">
              <button
                type="button"
                onClick={() => setLogic("any")}
                className={cn(
                  "px-3 h-full text-[11px] font-abc-regular tracking-[0.08em] rounded-[4px] transition-colors cursor-pointer text-center flex items-center justify-center",
                  logic === "any"
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#9d9d9d] hover:text-[#ededed]"
                )}
              >
                ANY
              </button>
              <button
                type="button"
                onClick={() => setLogic("all")}
                className={cn(
                  "px-3 h-full text-[11px] font-abc-regular tracking-[0.08em] rounded-[4px] transition-colors cursor-pointer text-center flex items-center justify-center",
                  logic === "all"
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#9d9d9d] hover:text-[#ededed]"
                )}
              >
                ALL
              </button>
            </div>
            <p className="font-abc-regular text-[10px] text-[#777777]">
              {logic === "any"
                ? "Trigger if any linked nutrient crosses its threshold."
                : "Trigger only when all linked nutrients cross their thresholds."}
            </p>
          </div>

          <div className="flex flex-col gap-[8px]">
            <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
              THRESHOLDS
            </span>
            <div className="flex flex-col gap-[10px]">
              {thresholds.map((t) => (
                <div key={t.nodeId} className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-abc-regular text-[11px] text-[#ededed]">
                      {t.analyteLabel}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-[28px] rounded-[6px] border border-[#2a2a2a] bg-[#121212] py-[2px] px-[2px]">
                        <button
                          type="button"
                          onClick={() =>
                            updateThreshold(t.nodeId, { direction: "above" })
                          }
                          className={cn(
                            "px-3 h-full text-[11px] font-abc-regular tracking-[0.08em] rounded-[4px] transition-colors cursor-pointer",
                            t.direction === "above"
                              ? "bg-[#3b82f6] text-white"
                              : "text-[#9d9d9d] hover:text-[#ededed]"
                          )}
                        >
                          Above
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateThreshold(t.nodeId, { direction: "below" })
                          }
                          className={cn(
                            "px-3 h-full text-[11px] font-abc-regular tracking-[0.08em] rounded-[4px] transition-colors cursor-pointer",
                            t.direction === "below"
                              ? "bg-[#3b82f6] text-white"
                              : "text-[#9d9d9d] hover:text-[#ededed]"
                          )}
                        >
                          Below
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={Number.isNaN(t.value) ? "" : t.value}
                          onChange={(e) =>
                            updateThreshold(t.nodeId, {
                              value: Math.max(
                                0,
                                Math.min(100, parseFloat(e.target.value))
                              ),
                            })
                          }
                          className="w-12 h-[28px] rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-2 text-right text-[13px] font-abc-regular text-[#f4f4f4] focus:border-[#3b82f6] focus:outline-none"
                          placeholder="--"
                        />
                        <span className="font-abc-regular text-[10px] uppercase tracking-[0.18em] text-[#8f8f8f]">
                          {t.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-[7px] w-full rounded-[2px] bg-[#161616]">
                    <div
                      className="h-full rounded-[2px]"
                      style={{
                        width: `${Math.min(100, Math.max(0, t.value))}%`,
                        backgroundColor: accentColor,
                      }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.1}
                      value={Number.isNaN(t.value) ? 0 : t.value}
                      onChange={(e) =>
                        updateThreshold(t.nodeId, {
                          value: Number(e.target.value),
                        })
                      }
                      className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none opacity-0"
                      aria-label="Threshold slider"
                    />
                  </div>
                  <p className="font-abc-regular text-[12px] text-[#666666]">
                    Trigger when {t.analyteLabel} is{" "}
                    {t.direction === "above" ? "Above" : "Below"} {t.value}{" "}
                    {t.unit}.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
              FREQUENCY
            </span>
            <div className="mt-[6px] flex gap-3">
              <div className="relative flex-1">
                <select
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as typeof frequency)
                  }
                  className="w-full appearance-none rounded-[6px] border border-[#2a2a2a] bg-[#121212] pl-3 pr-9 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none cursor-pointer pointer-events-auto"
                >
                  <option value="on-new-result">On new result</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 3 days</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom…</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[14px] text-[#d0d0d0]">
                  ⌄
                </span>
              </div>
              {frequency === "custom" && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) =>
                      setCustomDays(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-16 rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-center text-[12px] text-[#ededed] focus:border-[#3b82f6] focus:outline-none"
                  />
                  <div className="relative">
                    <select
                      value="days"
                      onChange={() => {}}
                      className="w-20 appearance-none rounded-[6px] border border-[#2a2a2a] bg-[#121212] pl-3 pr-7 py-2 text-[12px] font-abc-regular text-[#ededed] focus:border-[#3b82f6] focus:outline-none cursor-pointer"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[13px] text-[#d0d0d0]">
                      ⌄
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
              NOTIFY SURFACES
            </span>
            <div className="mt-[6px] flex gap-2">
              {["app", "email", "sms"].map((c) => {
                const active = channels.includes(c as NotificationChannel);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChannel(c as NotificationChannel)}
                    className={cn(
                      "rounded-[6px] border px-3 py-2 text-[11px] font-abc-regular tracking-[0.08em] transition-colors cursor-pointer pointer-events-auto",
                      active
                        ? "border-[#3b82f6] bg-[#1b2a3f] text-[#e4ecff]"
                        : "border-[#2a2a2a] bg-[#121212] text-[#9d9d9d] hover:border-[#3b82f6]/60 hover:text-[#e4ecff]"
                    )}
                  >
                    {c === "app" ? "App" : c === "email" ? "Email" : "SMS"}
                  </button>
                );
              })}
            </div>
            {(channels.includes("email") || channels.includes("sms")) && (
              <div className="space-y-1">
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="name@farm.co, agronomist@supply.com"
                  className="w-full rounded-[6px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-[12px] text-[#ededed] focus:border-[#3b82f6] focus:outline-none"
                />
                <p className="font-abc-regular text-[10px] text-[#666666]">
                  Add teammates or your agronomist
                </p>
              </div>
            )}
            {channels.length === 0 && (
              <p className="font-abc-regular text-[10px] text-[#e86a6a]">
                Select at least one notify surface.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[8px]">
            <span className="font-abc-regular text-[11px] text-[#c7c7c7] tracking-[0.08em]">
              SEVERITY
            </span>
            <div className="flex h-[28px] rounded-[6px] border border-[#2a2a2a] bg-[#121212] py-[2px] px-[2px]">
              {(["info", "warning", "critical"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={cn(
                    "px-3 h-full text-[11px] font-abc-regular tracking-[0.08em] rounded-[4px] transition-colors cursor-pointer",
                    severity === level
                      ? "bg-[#3b82f6] text-white"
                      : "text-[#9d9d9d] hover:text-[#ededed]"
                  )}
                >
                  {level === "info" ? "Info" : level === "warning" ? "Warning" : "Critical"}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            key={summary}
            className="relative overflow-hidden rounded-[8px] border border-[#2a3c85] bg-[#1b2a3f] px-4 py-3 text-[12px] font-abc-regular text-[#e4ecff]"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {summary}
          </motion.div>

          <div className="flex items-center justify-between gap-6 pt-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => onCancel?.()}
              className="font-abc-regular text-[11px] text-[#a0a0a0] hover:text-[#ededed] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaveDisabled}
              onClick={() =>
                onSave({
                  logic,
                  thresholds,
                  frequency,
                  customDays: frequency === "custom" ? customDays : undefined,
                  notificationChannels: channels,
                  recipients:
                    channels.includes("email") || channels.includes("sms")
                      ? recipients
                      : undefined,
                  severity,
                })
              }
              className={cn(
                "rounded-[6px] bg-[#3b82f6] px-4 py-2 text-[12px] font-abc-regular font-medium text-white transition-colors",
                isSaveDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[#2563eb]"
              )}
            >
              Save Combined Condition
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}



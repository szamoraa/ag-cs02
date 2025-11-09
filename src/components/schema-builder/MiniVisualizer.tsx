"use client";

import { motion } from "framer-motion";
import { AnalyteType } from "@/types/schema";
import { ANALYTE_COLORS } from "@/lib/constants";

interface MiniVisualizerProps {
  analyteType: AnalyteType;
}

export function MiniVisualizer({ analyteType }: MiniVisualizerProps) {
  const color = ANALYTE_COLORS[analyteType];

  const bars = Array.from({ length: 12 }, (_, index) => {
    const normalized = (index % 6) / 5;
    const base = 45 + Math.sin(normalized * Math.PI) * 25;
    const peak = base + 20;
    const duration = 1.3 + (index % 4) * 0.15;
    const delay = index * 0.06;
    return { base, peak, duration, delay };
  });

  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          className="w-1.5 rounded-t"
          style={{
            backgroundColor: color,
            height: `${bar.base}%`,
          }}
          animate={{
            height: [`${bar.base}%`, `${bar.peak}%`, `${bar.base}%`],
          }}
          transition={{
            duration: bar.duration,
            repeat: Infinity,
            delay: index * 0.05 + bar.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}


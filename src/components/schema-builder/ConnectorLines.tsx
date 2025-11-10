"use client";

import { motion } from "framer-motion";

interface ConnectorLinesProps {
  sourceCardPos: { x: number; y: number; width: number; height: number };
  targetCardPos: { x: number; y: number; width: number; height: number };
  linkDotPos: { x: number; y: number };
  menuNodePos?: { x: number; y: number };
  accentColor?: string;
  opacity?: number;
}

export function ConnectorLines({
  sourceCardPos,
  targetCardPos,
  linkDotPos,
  menuNodePos,
  accentColor = "#3B82F6",
  opacity = 0.4,
}: ConnectorLinesProps) {
  // Connect from card bottoms to the link dot below
  const sourceBottomX = sourceCardPos.x + sourceCardPos.width / 2;
  const sourceBottomY = sourceCardPos.y + sourceCardPos.height;
  const targetBottomX = targetCardPos.x + targetCardPos.width / 2;
  const targetBottomY = targetCardPos.y + targetCardPos.height;

  return (
    <g className="pointer-events-none">
			{/* Connector from source card bottom to link dot */}
			<motion.line
				x1={sourceBottomX}
				y1={sourceBottomY}
				x2={linkDotPos.x}
				y2={linkDotPos.y}
				stroke={accentColor}
				strokeWidth={1.5}
				strokeOpacity={opacity}
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.3 }}
			/>

      {/* Connector from target card bottom to link dot */}
			<motion.line
				x1={targetBottomX}
				y1={targetBottomY}
				x2={linkDotPos.x}
				y2={linkDotPos.y}
				stroke={accentColor}
				strokeWidth={1.5}
				strokeOpacity={opacity}
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.3 }}
			/>

      {/* Vertical leader line from link dot to menu node */}
      {menuNodePos && (
        <motion.line
          x1={linkDotPos.x}
          y1={linkDotPos.y}
          x2={menuNodePos.x}
          y2={menuNodePos.y}
          stroke={accentColor}
          strokeWidth={1.5}
          strokeOpacity={opacity}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
      )}
    </g>
  );
}


"use client";

import { cn } from "@/lib/utils";

interface HeaderProps {
  schemaName: string;
  onApplyChanges: () => void;
}

export function Header({ schemaName, onApplyChanges }: HeaderProps) {
  return (
    <header className="h-16 bg-[#0f0f0f] border-b border-[#1f1f1f] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="rounded-[6px] border border-[#242424] bg-[#121212] px-3 py-2 flex items-center gap-2">
          <span className="text-[12px] text-[#575757]">▢</span>
          <span className="text-[11px] text-[#4f4f4f]">›</span>
          <span className="font-abc-regular text-[12px] text-white tracking-[0.04em]">
            {schemaName}
          </span>
        </div>
      </div>
      <button
        onClick={onApplyChanges}
        className={cn(
          "rounded-[6px] border border-[#2563eb]/40 bg-[#1a1f2b]",
          "px-4 py-2 font-abc-regular text-[11px] tracking-[0.08em] uppercase",
          "text-[#dbe5ff] transition-colors duration-200",
          "hover:border-[#3b82f6] hover:text-white hover:bg-[#1f2f4d]"
        )}
      >
        Apply Changes
      </button>
    </header>
  );
}


"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeaderProps {
  schemaName: string;
  onApplyChanges?: () => void;
}

export function Header({ schemaName, onApplyChanges }: HeaderProps) {
  return (
    <header className="h-16 bg-[#0f0f0f] border-b border-[#1f1f1f] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="rounded-[6px] border border-[#242424] bg-[#121212] px-4 py-1.5 flex items-center justify-center gap-1">
          <Image
            src="/Icons/Agrilo_Icon_White-06.svg"
            alt="Agrilo"
            width={24}
            height={24}
            className="w-6 h-6"
            priority={false}
          />
          <span className="font-abc-regular text-[12px] text-white tracking-[0.02em]">
            New Space
          </span>
        </div>
      </div>
      {onApplyChanges ? (
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
      ) : null}
    </header>
  );
}


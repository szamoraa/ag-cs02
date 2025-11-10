"use client";

import { cn } from "@/lib/utils";

interface SidebarProps {
  currentView?: string;
}

export function Sidebar({ currentView = "schemas" }: SidebarProps) {
  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "action-space", label: "Action Space", badge: 3 },
    { id: "history", label: "History" },
    { id: "apps", label: "Apps" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="w-64 h-full bg-[#0f0f0f] border-r border-[#1f1f1f] flex flex-col">
      {/* User Profile */}
      <div className="px-4 py-4 border-b border-[#1f1f1f]">
        <div className="rounded-[6px] border border-[#242424] bg-[#121212] px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#1d2b47] border border-[#2d3f63] flex items-center justify-center text-[#6c8dfc] text-[13px] font-abc-regular aspect-square">
            R
          </div>
          <div className="flex-1">
            <div className="font-abc-regular text-[12px] text-white tracking-[0.02em]">
              Ronin
            </div>
            <div className="font-abc-screen text-[10px] text-[#8a8a8a] tracking-[0.08em]">
              ronin@robertsonlab.com
            </div>
          </div>
        </div>
      </div>

      {/* No Views Section */}
      <div className="px-4 py-4 border-b border-[#1f1f1f]">
        <div className="space-y-2">
					<div className="font-abc-screen text-[10px] uppercase tracking-[0.16em] text-[#7d7d7d]">
						Views
					</div>
					<p className="font-abc-regular text-[11px] text-[#969696] leading-[1.5]">
						Quickly access key records by creating saved views inside{" "}
						<button className="text-[#87a5ff] hover:text-[#a5bdff] transition-colors">
							Explore
						</button>
						.
					</p>
				</div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-3 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                "mx-2 px-4 py-2.5 rounded-[6px] border",
                "flex items-center gap-3",
                "cursor-pointer transition-colors",
                isActive
                  ? "bg-[#161616] border-[#2f2f2f] text-white"
                  : "border-transparent text-[#8f8f8f] hover:border-[#2f2f2f] hover:text-[#d4d4d4]"
              )}
            >
              <div className="flex-1 font-abc-regular text-[11px] text-inherit tracking-[0.05em]">
                {item.label}
              </div>
              {item.badge && (
                <div className="px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#89aaff] font-abc-screen text-[10px] tracking-[0.12em]">
                  {item.badge}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1f1f1f]">
        <div className="rounded-[6px] border border-[#242424] bg-[#121212] px-4 py-3">
          <div className="font-abc-screen text-[10px] uppercase tracking-[0.16em] text-[#6b6b6b]">
            Workspace
          </div>
          <div className="font-abc-regular text-[11px] text-[#b5b5b5] mt-1 tracking-[0.04em]">
            Robertsonlab
          </div>
        </div>
      </div>
    </div>
  );
}


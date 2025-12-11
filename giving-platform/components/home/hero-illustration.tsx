"use client";

import * as React from "react";

// All available causes - more than 6 so we can cycle through them
const ALL_CAUSES = [
  { icon: "🏥", label: "Health" },
  { icon: "🎓", label: "Education" },
  { icon: "🌍", label: "Environment" },
  { icon: "🏠", label: "Housing" },
  { icon: "🍲", label: "Food" },
  { icon: "🎨", label: "Arts" },
  { icon: "🐾", label: "Animals" },
  { icon: "⚖️", label: "Justice" },
  { icon: "🎗️", label: "Health" },
  { icon: "👶", label: "Children" },
  { icon: "🧓", label: "Seniors" },
  { icon: "🌊", label: "Oceans" },
  { icon: "⛪", label: "Faith" },
  { icon: "🎖️", label: "Veterans" },
];

// Positions for the 6 icon slots
const POSITIONS = [
  { className: "top-4 left-1/2 -translate-x-1/2", floatDelay: "0s" },
  { className: "top-[18%] right-4", floatDelay: "0.5s" },
  { className: "bottom-[18%] right-4", floatDelay: "1s" },
  { className: "bottom-4 left-1/2 -translate-x-1/2", floatDelay: "1.5s" },
  { className: "bottom-[18%] left-4", floatDelay: "2s" },
  { className: "top-[18%] left-4", floatDelay: "2.5s" },
];

interface CauseIconProps {
  cause: { icon: string; label: string };
  nextCause: { icon: string; label: string };
  isFlipping: boolean;
  floatDelay: string;
  className: string;
}

function CauseIcon({ cause, nextCause, isFlipping, floatDelay, className }: CauseIconProps) {
  return (
    <div
      className={`absolute ${className} animate-float z-10`}
      style={{ animationDelay: floatDelay }}
    >
      <div className="relative group" style={{ perspective: "600px" }}>
        <div
          className={`relative w-[72px] h-[72px] transition-transform duration-500 ease-in-out`}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipping ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-emerald-400 opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-300 scale-110" />
          {/* Front face - current cause */}
          <div
            className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-lg ring-1 ring-slate-200/50 flex flex-col items-center justify-center gap-0.5 transition-shadow duration-300 group-hover:shadow-xl group-hover:ring-blue-200"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{cause.icon}</span>
            <span className="text-[11px] text-slate-600 font-medium leading-tight">{cause.label}</span>
          </div>
          {/* Back face - next cause */}
          <div
            className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-lg ring-1 ring-slate-200/50 flex flex-col items-center justify-center gap-0.5"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-2xl">{nextCause.icon}</span>
            <span className="text-[11px] text-slate-600 font-medium leading-tight">{nextCause.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroIllustration() {
  // Track which causes are currently displayed (indices into ALL_CAUSES)
  const [displayedIndices, setDisplayedIndices] = React.useState([0, 1, 2, 3, 4, 5]);
  // Track which slot is currently flipping
  const [flippingSlot, setFlippingSlot] = React.useState<number | null>(null);
  // Track the next cause index for the flipping slot
  const [nextCauseIndex, setNextCauseIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const flipInterval = setInterval(() => {
      // Pick a random slot to flip
      const slotToFlip = Math.floor(Math.random() * 6);

      // Find a cause that's not currently displayed
      const availableIndices = ALL_CAUSES.map((_, i) => i).filter(
        (i) => !displayedIndices.includes(i)
      );

      if (availableIndices.length === 0) return;

      // Pick a random available cause
      const newCauseIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

      // Start the flip
      setNextCauseIndex(newCauseIndex);
      setFlippingSlot(slotToFlip);

      // After flip animation completes, update the displayed causes
      setTimeout(() => {
        setDisplayedIndices((prev) => {
          const newIndices = [...prev];
          newIndices[slotToFlip] = newCauseIndex;
          return newIndices;
        });
        setFlippingSlot(null);
        setNextCauseIndex(null);
      }, 500); // Match the CSS transition duration
    }, 3000); // Flip every 3 seconds

    return () => clearInterval(flipInterval);
  }, [displayedIndices]);

  return (
    <div className="relative aspect-square max-w-lg mx-auto">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-emerald-50 to-purple-100 rounded-full blur-3xl opacity-60" />

      {/* Central hub - represents the donor/platform */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl blur-xl opacity-40 scale-110" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-2xl font-bold">$</div>
              <div className="text-xs opacity-80">One Gift</div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated flow lines - SVG (behind cards) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Health - top center (slight curve for visibility) */}
        <path d="M200,200 Q215,130 200,56" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" />
        {/* Education - top right */}
        <path d="M200,200 Q290,150 340,100" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "0.3s" }} />
        {/* Environment - bottom right */}
        <path d="M200,200 Q290,250 340,300" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "0.6s" }} />
        {/* Housing - bottom center (slight curve for visibility) */}
        <path d="M200,200 Q185,270 200,344" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "0.9s" }} />
        {/* Food - bottom left */}
        <path d="M200,200 Q110,250 60,300" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "1.2s" }} />
        {/* Arts - top left */}
        <path d="M200,200 Q110,150 60,100" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "1.5s" }} />
      </svg>

      {/* Orbiting cause nodes with flip animation */}
      {POSITIONS.map((pos, slotIndex) => {
        const currentCauseIndex = displayedIndices[slotIndex];
        const isFlipping = flippingSlot === slotIndex;
        const nextCause = nextCauseIndex !== null ? ALL_CAUSES[nextCauseIndex] : ALL_CAUSES[currentCauseIndex];

        return (
          <CauseIcon
            key={slotIndex}
            cause={ALL_CAUSES[currentCauseIndex]}
            nextCause={nextCause}
            isFlipping={isFlipping}
            floatDelay={pos.floatDelay}
            className={pos.className}
          />
        );
      })}
    </div>
  );
}

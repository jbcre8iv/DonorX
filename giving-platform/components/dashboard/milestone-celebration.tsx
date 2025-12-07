"use client";

import { useEffect, useCallback } from "react";
import { X, Trophy, Star, Sparkles, Gift } from "lucide-react";

interface MilestoneCelebrationProps {
  milestone: {
    type: "amount" | "count" | "streak" | "first";
    value: number;
    label: string;
  } | null;
  onDismiss: () => void;
}

// Static confetti positions (deterministic, no random)
const CONFETTI_PIECES = [
  { id: 0, x: 5, delay: 0.1, color: "#3b82f6" },
  { id: 1, x: 15, delay: 0.2, color: "#10b981" },
  { id: 2, x: 25, delay: 0.05, color: "#f59e0b" },
  { id: 3, x: 35, delay: 0.3, color: "#ec4899" },
  { id: 4, x: 45, delay: 0.15, color: "#8b5cf6" },
  { id: 5, x: 55, delay: 0.25, color: "#3b82f6" },
  { id: 6, x: 65, delay: 0.1, color: "#10b981" },
  { id: 7, x: 75, delay: 0.35, color: "#f59e0b" },
  { id: 8, x: 85, delay: 0.2, color: "#ec4899" },
  { id: 9, x: 95, delay: 0.05, color: "#8b5cf6" },
  { id: 10, x: 10, delay: 0.4, color: "#3b82f6" },
  { id: 11, x: 20, delay: 0.15, color: "#10b981" },
  { id: 12, x: 30, delay: 0.3, color: "#f59e0b" },
  { id: 13, x: 40, delay: 0.1, color: "#ec4899" },
  { id: 14, x: 50, delay: 0.25, color: "#8b5cf6" },
  { id: 15, x: 60, delay: 0.45, color: "#3b82f6" },
  { id: 16, x: 70, delay: 0.2, color: "#10b981" },
  { id: 17, x: 80, delay: 0.35, color: "#f59e0b" },
  { id: 18, x: 90, delay: 0.1, color: "#ec4899" },
  { id: 19, x: 2, delay: 0.5, color: "#8b5cf6" },
  { id: 20, x: 12, delay: 0.15, color: "#3b82f6" },
  { id: 21, x: 22, delay: 0.3, color: "#10b981" },
  { id: 22, x: 32, delay: 0.05, color: "#f59e0b" },
  { id: 23, x: 42, delay: 0.4, color: "#ec4899" },
  { id: 24, x: 52, delay: 0.25, color: "#8b5cf6" },
  { id: 25, x: 62, delay: 0.1, color: "#3b82f6" },
  { id: 26, x: 72, delay: 0.45, color: "#10b981" },
  { id: 27, x: 82, delay: 0.2, color: "#f59e0b" },
  { id: 28, x: 92, delay: 0.35, color: "#ec4899" },
  { id: 29, x: 8, delay: 0.15, color: "#8b5cf6" },
];

export function MilestoneCelebration({ milestone, onDismiss }: MilestoneCelebrationProps) {
  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Auto dismiss after 5 seconds
  useEffect(() => {
    if (!milestone) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [milestone, handleDismiss]);

  if (!milestone) return null;

  const getIcon = () => {
    switch (milestone.type) {
      case "amount":
        return <Trophy className="h-8 w-8 text-amber-500" />;
      case "count":
        return <Star className="h-8 w-8 text-blue-500" />;
      case "streak":
        return <Sparkles className="h-8 w-8 text-orange-500" />;
      case "first":
        return <Gift className="h-8 w-8 text-emerald-500" />;
      default:
        return <Trophy className="h-8 w-8 text-amber-500" />;
    }
  };

  const getMessage = () => {
    switch (milestone.type) {
      case "amount":
        return `You've donated ${milestone.label}!`;
      case "count":
        return `${milestone.value} donations and counting!`;
      case "streak":
        return `${milestone.value} month giving streak!`;
      case "first":
        return "Congratulations on your first donation!";
      default:
        return milestone.label;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleDismiss} />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {CONFETTI_PIECES.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-3 h-3 rounded-sm animate-confetti"
            style={{
              left: `${piece.x}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 animate-bounce-subtle">
          {getIcon()}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          🎉 Milestone Reached!
        </h2>

        <p className="text-lg text-slate-600 mb-6">{getMessage()}</p>

        <button
          onClick={handleDismiss}
          className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          Keep Going!
        </button>
      </div>
    </div>
  );
}

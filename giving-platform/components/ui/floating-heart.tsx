"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Heart } from "lucide-react";

interface FloatingHeartProps {
  startPosition: { x: number; y: number };
  onComplete: () => void;
}

function FloatingHeartAnimation({ startPosition, onComplete }: FloatingHeartProps) {
  const [mounted, setMounted] = React.useState(false);
  const heartRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || !heartRef.current) return;

    // Find the giving list button in the header
    const targetButton = document.querySelector('[data-giving-list-button]');
    if (!targetButton) {
      onComplete();
      return;
    }

    const targetRect = targetButton.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    // Calculate the distance to travel
    const deltaX = targetX - startPosition.x;
    const deltaY = targetY - startPosition.y;

    // Set CSS custom properties for the animation
    heartRef.current.style.setProperty('--start-x', `${startPosition.x}px`);
    heartRef.current.style.setProperty('--start-y', `${startPosition.y}px`);
    heartRef.current.style.setProperty('--delta-x', `${deltaX}px`);
    heartRef.current.style.setProperty('--delta-y', `${deltaY}px`);

    // Trigger animation
    heartRef.current.classList.add('animate-float-to-target');

    // Clean up after animation
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [mounted, startPosition, onComplete]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={heartRef}
      className="fixed pointer-events-none z-[9999] floating-heart-container"
      style={{
        left: 0,
        top: 0,
      }}
    >
      <div className="relative">
        <Heart className="h-6 w-6 text-pink-500 fill-pink-500 drop-shadow-lg" />
        {/* Sparkle effects */}
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-pink-300 rounded-full animate-ping opacity-75" />
        <span className="absolute -bottom-1 -left-1 h-1.5 w-1.5 bg-pink-400 rounded-full animate-ping opacity-75 animation-delay-100" />
      </div>
    </div>,
    document.body
  );
}

// Context for triggering floating hearts from anywhere
interface FloatingHeartContextType {
  triggerFloatingHeart: (sourceElement: HTMLElement) => void;
}

const FloatingHeartContext = React.createContext<FloatingHeartContextType | null>(null);

export function FloatingHeartProvider({ children }: { children: React.ReactNode }) {
  const [hearts, setHearts] = React.useState<{ id: number; position: { x: number; y: number } }[]>([]);
  const idCounter = React.useRef(0);

  const triggerFloatingHeart = React.useCallback((sourceElement: HTMLElement) => {
    const rect = sourceElement.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const id = idCounter.current++;
    setHearts(prev => [...prev, { id, position }]);
  }, []);

  const removeHeart = React.useCallback((id: number) => {
    setHearts(prev => prev.filter(h => h.id !== id));
  }, []);

  return (
    <FloatingHeartContext.Provider value={{ triggerFloatingHeart }}>
      {children}
      {hearts.map(heart => (
        <FloatingHeartAnimation
          key={heart.id}
          startPosition={heart.position}
          onComplete={() => removeHeart(heart.id)}
        />
      ))}
    </FloatingHeartContext.Provider>
  );
}

export function useFloatingHeart() {
  const context = React.useContext(FloatingHeartContext);
  if (!context) {
    throw new Error("useFloatingHeart must be used within a FloatingHeartProvider");
  }
  return context;
}

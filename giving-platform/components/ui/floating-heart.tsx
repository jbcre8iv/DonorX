"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Heart } from "lucide-react";

interface FloatingHeartProps {
  startPosition: { x: number; y: number };
  onComplete: () => void;
}

// Easing function - starts slow, accelerates toward the end
// Combines ease-in with a slight ease-out at the very end for smooth landing
function easeInOutCustom(t: number): number {
  // First 30%: very slow start (quadratic ease-in)
  // Middle 50%: accelerating
  // Last 20%: slight deceleration for smooth landing
  if (t < 0.3) {
    // Slow start - quadratic ease in, scaled to 0-0.15 output
    const localT = t / 0.3;
    return 0.15 * (localT * localT);
  } else if (t < 0.8) {
    // Accelerating phase - maps 0.3-0.8 input to 0.15-0.85 output
    const localT = (t - 0.3) / 0.5;
    return 0.15 + 0.7 * localT;
  } else {
    // Smooth landing - ease out for final approach
    const localT = (t - 0.8) / 0.2;
    return 0.85 + 0.15 * (1 - Math.pow(1 - localT, 2));
  }
}

// Quadratic bezier curve for smooth arc path
function quadraticBezier(t: number, p0: number, p1: number, p2: number): number {
  const oneMinusT = 1 - t;
  return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2;
}

// Trigger impact effect on the giving list button
function triggerImpactEffect(targetButton: Element) {
  // Add impact class for the pulse/glow effect
  targetButton.classList.add('heart-impact');

  // Remove after animation completes
  setTimeout(() => {
    targetButton.classList.remove('heart-impact');
  }, 400);
}

function FloatingHeartAnimation({ startPosition, onComplete }: FloatingHeartProps) {
  const [mounted, setMounted] = React.useState(false);
  const heartRef = React.useRef<HTMLDivElement>(null);
  const animationRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || !heartRef.current) return;

    // Find the VISIBLE giving list button in the header
    // There are two buttons (desktop and mobile), we need the one that's actually visible
    const allButtons = document.querySelectorAll('[data-giving-list-button]');
    let targetButton: Element | null = null;

    for (const button of allButtons) {
      const rect = button.getBoundingClientRect();
      // Check if the button is visible (has dimensions and is on screen)
      if (rect.width > 0 && rect.height > 0 && rect.top >= 0) {
        targetButton = button;
        break;
      }
    }

    if (!targetButton) {
      onComplete();
      return;
    }

    const targetRect = targetButton.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    // Start and end positions
    const startX = startPosition.x;
    const startY = startPosition.y;
    const endX = targetX;
    const endY = targetY;

    // Control point for the bezier curve - creates a nice arc
    // Place it to the left and above the midpoint for a sweeping curve
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const controlX = midX - 100; // Curve to the left
    const controlY = midY - 80; // And upward

    const duration = 850; // ms - slower for eye tracking
    const startTime = performance.now();
    let impactTriggered = false;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Apply easing - starts slow so user can focus, then accelerates
      const progress = easeInOutCustom(rawProgress);

      // Calculate position along bezier curve
      const x = quadraticBezier(progress, startX, controlX, endX);
      const y = quadraticBezier(progress, startY, controlY, endY);

      // Scale: start at 1, grow to 1.3 at 25%, shrink to 0.3 at end
      let scale: number;
      if (progress < 0.25) {
        scale = 1 + (progress / 0.25) * 0.3; // 1 -> 1.3
      } else {
        scale = 1.3 - ((progress - 0.25) / 0.75) * 1.0; // 1.3 -> 0.3
      }

      // Opacity: fully visible until 70%, then fade out
      const opacity = progress < 0.7 ? 1 : 1 - ((progress - 0.7) / 0.3);

      if (heartRef.current) {
        heartRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
        heartRef.current.style.opacity = String(opacity);
      }

      // Trigger impact effect when heart is about to land (85% through animation)
      if (!impactTriggered && rawProgress >= 0.85) {
        impactTriggered = true;
        triggerImpactEffect(targetButton);
      }

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mounted, startPosition, onComplete]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={heartRef}
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: 0,
        top: 0,
        willChange: 'transform, opacity',
      }}
    >
      <div className="relative">
        <Heart className="h-6 w-6 text-pink-500 fill-pink-500 drop-shadow-lg" />
        {/* Trail effect - smaller hearts that follow */}
        <Heart
          className="absolute inset-0 h-6 w-6 text-pink-400 fill-pink-400 opacity-40 blur-[1px]"
          style={{ transform: 'translate(-2px, 2px)' }}
        />
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

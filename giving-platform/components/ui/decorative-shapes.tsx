"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Hook to detect if user prefers reduced motion or is on mobile
function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Check for mobile (rough heuristic: screen width < 1024px)
    const isMobile = window.innerWidth < 1024;

    setReducedMotion(mediaQuery.matches || isMobile);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches || window.innerWidth < 1024);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

interface BlobProps {
  className?: string;
  color?: string;
  animate?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "w-64 h-64",
  md: "w-96 h-96",
  lg: "w-[32rem] h-[32rem]",
  xl: "w-[48rem] h-[48rem]",
};

/**
 * Organic blob shape - similar to Give Lively's teal curved background
 * Use for hero sections and feature areas
 */
export function Blob({ className, color = "bg-blue-500", animate = true, size = "lg" }: BlobProps) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  const blob = (
    <div
      className={cn(
        "absolute rounded-full blur-3xl opacity-30",
        sizeMap[size],
        color,
        className
      )}
      style={{
        borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
      }}
    />
  );

  if (!shouldAnimate) return blob;

  return (
    <motion.div
      className={cn(
        "absolute rounded-full blur-3xl opacity-30",
        sizeMap[size],
        color,
        className
      )}
      style={{
        borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        willChange: "border-radius",
      }}
      animate={{
        borderRadius: [
          "60% 40% 30% 70% / 60% 30% 70% 40%",
          "30% 60% 70% 40% / 50% 60% 30% 60%",
          "60% 40% 30% 70% / 60% 30% 70% 40%",
        ],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/**
 * Curved wave shape for section dividers
 */
export function WaveDivider({
  className,
  flip = false,
  color = "#f8fafc",
}: {
  className?: string;
  flip?: boolean;
  color?: string;
}) {
  return (
    <div className={cn("absolute left-0 right-0 overflow-hidden", flip ? "rotate-180" : "", className)}>
      <svg
        viewBox="0 0 1440 120"
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <path
          fill={color}
          d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
}

/**
 * Organic curved corner shape - like Give Lively's teal corner accent
 */
export function CornerBlob({
  className,
  position = "top-right",
  color = "fill-blue-500",
}: {
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  color?: string;
}) {
  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0 -scale-x-100",
    "bottom-right": "bottom-0 right-0 -scale-y-100",
    "bottom-left": "bottom-0 left-0 -scale-x-100 -scale-y-100",
  };

  return (
    <div className={cn("absolute pointer-events-none", positionClasses[position], className)}>
      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="w-full h-auto"
      >
        <path
          className={cn("opacity-90", color)}
          d="M400,0 C400,220 220,400 0,400 L400,400 L400,0 Z"
        />
      </svg>
    </div>
  );
}

/**
 * Seeded random number generator for deterministic "random" values
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

/**
 * Floating circles/dots pattern
 */
export function FloatingDots({
  className,
  count = 6,
  color = "bg-blue-200",
}: {
  className?: string;
  count?: number;
  color?: string;
}) {
  const reducedMotion = useReducedMotion();

  // Use deterministic values based on index to avoid Math.random during render
  const dots = Array.from({ length: count }).map((_, i) => ({
    id: i,
    size: seededRandom(i * 4 + 1) * 24 + 8,
    x: seededRandom(i * 4 + 2) * 100,
    y: seededRandom(i * 4 + 3) * 100,
    delay: seededRandom(i * 4 + 4) * 2,
    duration: 3 + seededRandom(i * 4 + 5) * 2,
  }));

  // On mobile/reduced motion: show static dots
  if (reducedMotion) {
    return (
      <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
        {dots.map((dot) => (
          <div
            key={dot.id}
            className={cn("absolute rounded-full opacity-40", color)}
            style={{
              width: dot.size,
              height: dot.size,
              left: `${dot.x}%`,
              top: `${dot.y}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className={cn("absolute rounded-full opacity-40", color)}
          style={{
            width: dot.size,
            height: dot.size,
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            willChange: "transform",
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Gradient orb for glow effects
 */
export function GradientOrb({
  className,
  from = "from-blue-400",
  to = "to-emerald-400",
  size = "md",
  animate = true,
}: {
  className?: string;
  from?: string;
  to?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  const sizeClasses = {
    sm: "w-48 h-48",
    md: "w-72 h-72",
    lg: "w-96 h-96",
    xl: "w-[32rem] h-[32rem]",
  };

  const orb = (
    <div
      className={cn(
        "absolute rounded-full blur-3xl opacity-50 bg-gradient-to-r",
        from,
        to,
        sizeClasses[size],
        className
      )}
    />
  );

  if (!shouldAnimate) return orb;

  return (
    <motion.div
      className={cn(
        "absolute rounded-full blur-3xl opacity-50 bg-gradient-to-r",
        from,
        to,
        sizeClasses[size],
        className
      )}
      style={{ willChange: "transform, opacity" }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.6, 0.5],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/**
 * Grid pattern background
 */
export function GridPattern({
  className,
  color = "stroke-slate-200",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              className={color}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/**
 * Radial gradient background
 */
export function RadialGradient({
  className,
  from = "from-blue-100",
  to = "to-transparent",
}: {
  className?: string;
  from?: string;
  to?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none bg-radial",
        from,
        to,
        className
      )}
      style={{
        background: `radial-gradient(ellipse at center, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 70%)`,
      }}
    />
  );
}

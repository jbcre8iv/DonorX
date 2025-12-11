"use client";

import { useRef, useEffect, useState } from "react";
import { Heart, Shield, Users, Globe, Award, TrendingUp } from "lucide-react";

interface Position {
  x: number;
  y: number;
}

export function NetworkIllustration() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [positions, setPositions] = useState<{ center: Position; nodes: Position[] }>({
    center: { x: 150, y: 112 },
    nodes: [],
  });

  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current || !centerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const centerRect = centerRef.current.getBoundingClientRect();

      // Calculate center position relative to container (as percentage for SVG viewBox)
      const center = {
        x: ((centerRect.left + centerRect.width / 2 - containerRect.left) / containerRect.width) * 300,
        y: ((centerRect.top + centerRect.height / 2 - containerRect.top) / containerRect.height) * 225,
      };

      // Calculate node positions
      const nodes = nodeRefs.current.map((ref) => {
        if (!ref) return { x: 0, y: 0 };
        const rect = ref.getBoundingClientRect();
        return {
          x: ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 300,
          y: ((rect.top + rect.height / 2 - containerRect.top) / containerRect.height) * 225,
        };
      });

      setPositions({ center, nodes });
    };

    // Update positions on animation frame for smooth tracking
    let animationId: number;
    const animate = () => {
      updatePositions();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Generate curved path from center to node
  const getPath = (nodeIndex: number) => {
    const node = positions.nodes[nodeIndex];
    if (!node) return "";

    const cx = positions.center.x;
    const cy = positions.center.y;
    const nx = node.x;
    const ny = node.y;

    // Control point for quadratic curve (offset perpendicular to line)
    const midX = (cx + nx) / 2;
    const midY = (cy + ny) / 2;

    // Add slight curve based on position
    const curveOffset = 15;
    const qx = midX;
    let qy = midY;

    // Offset control point slightly for visual interest
    if (nodeIndex === 0 || nodeIndex === 1) {
      // Top nodes - curve upward
      qy -= curveOffset;
    } else if (nodeIndex === 2 || nodeIndex === 3) {
      // Middle nodes - slight vertical curve
      qy += nodeIndex === 2 ? -curveOffset : curveOffset;
    } else {
      // Bottom nodes - curve downward
      qy += curveOffset;
    }

    return `M${cx},${cy} Q${qx},${qy} ${nx},${ny}`;
  };

  const setNodeRef = (index: number) => (el: HTMLDivElement | null) => {
    nodeRefs.current[index] = el;
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col items-center justify-center relative">
      {/* Central donor hub */}
      <div
        ref={centerRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg z-10 animate-pulse-soft"
      >
        <Heart className="h-8 w-8 text-white" />
      </div>

      {/* Connection lines - dynamically positioned */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 225" preserveAspectRatio="none">
        {positions.nodes.map((_, index) => (
          <path
            key={index}
            d={getPath(index)}
            stroke="#93c5fd"
            strokeWidth="2"
            strokeDasharray="4 2"
            fill="none"
            className="animate-dash"
          />
        ))}
      </svg>

      {/* Nonprofit nodes */}
      <div
        ref={setNodeRef(0)}
        className="absolute top-2 left-8 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-300 animate-float"
      >
        <Globe className="h-5 w-5 text-emerald-600" />
      </div>
      <div
        ref={setNodeRef(1)}
        className="absolute top-2 right-8 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-300 animate-float"
        style={{ animationDelay: "0.5s" }}
      >
        <Users className="h-5 w-5 text-purple-600" />
      </div>
      <div
        ref={setNodeRef(2)}
        className="absolute top-1/2 -translate-y-1/2 left-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-300 animate-float"
        style={{ animationDelay: "1s" }}
      >
        <Shield className="h-4 w-4 text-blue-600" />
      </div>
      <div
        ref={setNodeRef(3)}
        className="absolute top-1/2 -translate-y-1/2 right-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-300 animate-float"
        style={{ animationDelay: "1.5s" }}
      >
        <Award className="h-4 w-4 text-amber-600" />
      </div>
      <div
        ref={setNodeRef(4)}
        className="absolute bottom-2 left-12 w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-300 animate-float"
        style={{ animationDelay: "2s" }}
      >
        <Heart className="h-5 w-5 text-rose-500" />
      </div>
      <div
        ref={setNodeRef(5)}
        className="absolute bottom-2 right-12 w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center border-2 border-teal-300 animate-float"
        style={{ animationDelay: "2.5s" }}
      >
        <TrendingUp className="h-5 w-5 text-teal-600" />
      </div>
    </div>
  );
}

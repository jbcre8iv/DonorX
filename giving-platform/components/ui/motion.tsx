"use client";

import * as React from "react";
import { motion, type MotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Hook to detect if we should use reduced/simpler animations
function useSimplifiedAnimations() {
  const [simplified, setSimplified] = React.useState(false);

  React.useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Check for mobile (rough heuristic: screen width < 1024px)
    const isMobile = window.innerWidth < 1024;

    setSimplified(mediaQuery.matches || isMobile);

    const handleChange = (e: MediaQueryListEvent) => {
      setSimplified(e.matches || window.innerWidth < 1024);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return simplified;
}

// Animation variants for common patterns
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Simplified variants for mobile - just fade, no transforms
const simpleFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Simplified stagger - faster, less delay
const simpleStaggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },
};

// Default transition for smooth animations
const defaultTransition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

// Faster transition for mobile
const mobileTransition = {
  duration: 0.3,
  ease: "easeOut" as const,
};

interface AnimatedProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

/**
 * Fade in animation - triggers when element enters viewport
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  once = true,
  ...props
}: AnimatedProps) {
  const simplified = useSimplifiedAnimations();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={fadeIn}
      transition={simplified ? { ...mobileTransition, delay: delay * 0.5 } : { ...defaultTransition, duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in and slide up animation
 */
export function FadeInUp({
  children,
  className,
  delay = 0,
  duration = 0.5,
  once = true,
  ...props
}: AnimatedProps) {
  const simplified = useSimplifiedAnimations();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={simplified ? simpleFadeIn : fadeInUp}
      transition={simplified ? { ...mobileTransition, delay: delay * 0.5 } : { ...defaultTransition, duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in and slide down animation
 */
export function FadeInDown({
  children,
  className,
  delay = 0,
  duration = 0.5,
  once = true,
  ...props
}: AnimatedProps) {
  const simplified = useSimplifiedAnimations();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={simplified ? simpleFadeIn : fadeInDown}
      transition={simplified ? { ...mobileTransition, delay: delay * 0.5 } : { ...defaultTransition, duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in from left animation
 */
export function FadeInLeft({
  children,
  className,
  delay = 0,
  duration = 0.5,
  once = true,
  ...props
}: AnimatedProps) {
  const simplified = useSimplifiedAnimations();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={simplified ? simpleFadeIn : fadeInLeft}
      transition={simplified ? { ...mobileTransition, delay: delay * 0.5 } : { ...defaultTransition, duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in from right animation
 */
export function FadeInRight({
  children,
  className,
  delay = 0,
  duration = 0.5,
  once = true,
  ...props
}: AnimatedProps) {
  const simplified = useSimplifiedAnimations();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={simplified ? simpleFadeIn : fadeInRight}
      transition={simplified ? { ...mobileTransition, delay: delay * 0.5 } : { ...defaultTransition, duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale in animation
 */
export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  once = true,
  ...props
}: AnimatedProps) {
  const simplified = useSimplifiedAnimations();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={simplified ? simpleFadeIn : scaleIn}
      transition={simplified ? { ...mobileTransition, delay: delay * 0.5 } : { ...defaultTransition, duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger children animations - wrap around multiple FadeInUp etc.
 */
export function StaggerContainer({
  children,
  className,
  delay = 0,
  staggerDelay = 0.1,
  once = true,
  ...props
}: AnimatedProps & { staggerDelay?: number }) {
  const simplified = useSimplifiedAnimations();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={simplified ? simpleStaggerContainer : {
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger item - use inside StaggerContainer
 */
export function StaggerItem({
  children,
  className,
  ...props
}: Omit<AnimatedProps, "delay" | "duration" | "once">) {
  const simplified = useSimplifiedAnimations();

  return (
    <motion.div
      className={className}
      variants={simplified ? simpleFadeIn : fadeInUp}
      transition={simplified ? mobileTransition : defaultTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hover scale animation for interactive elements
 */
export function HoverScale({
  children,
  className,
  scale = 1.02,
  ...props
}: Omit<AnimatedProps, "delay" | "duration" | "once"> & { scale?: number }) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hover lift animation - adds shadow and lifts element
 */
export function HoverLift({
  children,
  className,
  ...props
}: Omit<AnimatedProps, "delay" | "duration" | "once">) {
  return (
    <motion.div
      className={cn("transition-shadow", className)}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parallax scroll effect
 */
export function Parallax({
  children,
  className,
  speed: _speed = 0.5,
  ...props
}: Omit<AnimatedProps, "delay" | "duration" | "once"> & { speed?: number }) {
  return (
    <motion.div
      className={className}
      style={{ y: 0 }}
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Floating animation - gentle up/down motion
 */
export function Float({
  children,
  className,
  distance = 10,
  duration = 3,
  ...props
}: Omit<AnimatedProps, "delay" | "duration" | "once"> & {
  distance?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-distance, distance, -distance],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pulse animation
 */
export function Pulse({
  children,
  className,
  scale = 1.05,
  duration = 2,
  ...props
}: Omit<AnimatedProps, "delay" | "duration" | "once"> & {
  scale?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, scale, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Number counter animation
 */
export function CountUp({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (hasAnimated) return;

    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setDisplayValue(Math.floor(eased * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, hasAnimated]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

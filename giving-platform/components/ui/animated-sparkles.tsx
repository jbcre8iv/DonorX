import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedSparklesProps {
  className?: string;
}

export function AnimatedSparkles({ className }: AnimatedSparklesProps) {
  return (
    <Sparkles className={cn("animate-pulse", className)} />
  );
}

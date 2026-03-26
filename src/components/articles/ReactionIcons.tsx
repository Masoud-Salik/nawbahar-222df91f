import { cn } from "@/lib/utils";

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  animated?: boolean;
}

/** Modern SVG reaction icons — lively, professional, with subtle animations */
export function ThumbsUpIcon({ size = 24, className, strokeWidth = 2, animated = false }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn(
        "transition-all duration-200",
        animated && "animate-pulse-subtle",
        className
      )}
    >
      <path d="M7 22V11l5-10 1.5.5a2.5 2.5 0 0 1 1.5 2.3V8h5.09a2 2 0 0 1 1.98 2.27l-1.27 7.63A2 2 0 0 1 18.83 20H7z" />
      <path d="M2 11v11h4V11H2z" />
      <circle cx="5" cy="20" r="1" fill="currentColor" className="animate-pulse" />
    </svg>
  );
}

export function HeartIcon({ size = 24, className, strokeWidth = 2, animated = false }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn(
        "transition-all duration-200",
        animated && "animate-heartbeat",
        className
      )}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
            fill="none" 
            opacity="0.3" 
            className={animated ? "animate-pulse" : ""}
      />
    </svg>
  );
}

export function LightbulbIcon({ size = 24, className, strokeWidth = 2, animated = false }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn(
        "transition-all duration-200",
        animated && "animate-glow",
        className
      )}
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <circle cx="12" cy="8" r="2" fill="currentColor" opacity="0.4" className={animated ? "animate-pulse" : ""} />
      <path d="m9 11 3 3 3-3" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

export function SmileIcon({ size = 24, className, strokeWidth = 2, animated = false }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn(
        "transition-all duration-200",
        animated && "animate-bounce-gentle",
        className
      )}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <path d="M8 8c.5-1 2-1 2.5 0M13.5 8c.5-1 2-1 2.5 0" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

export function FrownIcon({ size = 24, className, strokeWidth = 2, animated = false }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn(
        "transition-all duration-200",
        animated && "animate-sway",
        className
      )}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <path d="M8 16c.5 1 2 1 2.5 0M13.5 16c.5 1 2 1 2.5 0" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

export const REACTION_SVG_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  like: ThumbsUpIcon,
  love: HeartIcon,
  insightful: LightbulbIcon,
  laugh: SmileIcon,
  sad: FrownIcon,
};

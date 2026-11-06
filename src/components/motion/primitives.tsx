"use client";

/**
 * Small Motion-based primitives for the marketing site.
 * Every effect degrades to static content when the visitor prefers reduced motion.
 */

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return fine;
}

/** Pulls its child toward the cursor while hovered, springs back on leave. */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });
  const active = fine && !reduce;

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={active ? { x: sx, y: sy } : undefined}
      onMouseMove={(e) => {
        if (!active || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Infinite horizontal ticker. Content is rendered twice for a seamless loop. */
export function Marquee({
  children,
  duration = 40,
  className,
}: {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative flex overflow-hidden", className)}>
      <motion.div
        className="flex shrink-0 items-center"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/** A soft gold light that follows the cursor across the element. */
export function Spotlight({
  children,
  className,
  size = 420,
}: {
  children: React.ReactNode;
  className?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={cn("group/spot relative", className)}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), rgba(212,168,69,0.12), transparent 65%)`,
        }}
      />
    </div>
  );
}

/**
 * Reveals each line by sliding it up from behind a mask.
 * The in-view trigger sits on the (unclipped) wrapper: the lines themselves
 * start hidden behind overflow:hidden, so observing them directly never fires.
 */
export function MaskLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.12,
  inView = false,
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  /** Animate when scrolled into view instead of on mount. */
  inView?: boolean;
}) {
  const trigger: HTMLMotionProps<"span"> = inView
    ? { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-40px" } }
    : { initial: "hidden", animate: "show" };

  return (
    <motion.span
      className={cn("block", className)}
      {...trigger}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={cn("block will-change-transform", lineClassName)}
            variants={{
              hidden: { y: "110%" },
              show: { y: "0%", transition: { duration: 0.9, ease: EASE_OUT } },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Hairline that draws from left to right when it enters the viewport. */
export function DrawLine({ className }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      className={cn("h-px origin-left bg-[rgba(212,168,69,0.28)]", className)}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.2, ease: EASE_OUT }}
    />
  );
}

export { EASE_OUT };

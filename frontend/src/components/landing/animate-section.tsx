"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

interface AnimateSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Direction for the fade-up effect */
  direction?: "up" | "down" | "left" | "right" | "none";
}

const directionVariants = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: -40 },
  right: { x: 40 },
  none: { x: 0, y: 0 },
};

export function AnimateSection({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimateSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...directionVariants[direction],
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.7,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

interface AnimateStaggerProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay between each child (seconds) */
  staggerDelay?: number;
}

export function AnimateStagger({
  children,
  className,
  staggerDelay = 0.08,
}: AnimateStaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimateItem({
  children,
  className,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
}) {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        ...directionVariants[direction],
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

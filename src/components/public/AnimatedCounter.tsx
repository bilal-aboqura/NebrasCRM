"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const elementRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    setDisplayValue(0);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        const startedAt = performance.now();
        const duration = 1400;

        const update = (now: number) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          setDisplayValue(Math.round(value * easedProgress));

          if (progress < 1) animationFrameRef.current = requestAnimationFrame(update);
        };

        animationFrameRef.current = requestAnimationFrame(update);
        observer.disconnect();
      },
      { threshold: 0.55 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [value]);

  return (
    <strong ref={elementRef} aria-label={`أكثر من ${value} ${label}`} className="block text-4xl font-extrabold text-nebras-gold" dir="ltr">
      <span aria-hidden>+{displayValue}</span>
    </strong>
  );
}

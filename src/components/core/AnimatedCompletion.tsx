"use client";

import React, { useEffect, useState } from 'react';

interface AnimatedCompletionProps {
  show: boolean;
  onAnimationEnd: () => void;
  targetElement?: HTMLElement | null; // Optional target element to position sparkles around
}

const NUM_SPARKLES = 8;

export function AnimatedCompletion({ show, onAnimationEnd, targetElement }: AnimatedCompletionProps) {
  const [sparkles, setSparkles] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  useEffect(() => {
    if (show) {
      const newSparkles = Array.from({ length: NUM_SPARKLES }).map((_, i) => {
        let x = Math.random() * 100 - 50; // Random horizontal offset
        let y = Math.random() * 100 - 50; // Random vertical offset
        
        if (targetElement) {
          // If targetElement is provided, position sparkles relative to it
          const rect = targetElement.getBoundingClientRect();
          // Center of the target element plus some random offset
          x = rect.left + rect.width / 2 + (Math.random() * rect.width - rect.width / 2) * 0.8;
          y = rect.top + rect.height / 2 + (Math.random() * rect.height - rect.height / 2) * 0.8;
        } else {
          // Default to center of screen if no target
          x = window.innerWidth / 2 + x;
          y = window.innerHeight / 2 + y;
        }

        return {
          id: i,
          style: {
            left: `${x}px`,
            top: `${y}px`,
            animationDelay: `${Math.random() * 0.2}s`, // Stagger animations
          },
        };
      });
      setSparkles(newSparkles);

      const timer = setTimeout(() => {
        setSparkles([]);
        onAnimationEnd();
      }, 800); // Animation duration (0.6s) + buffer (0.2s)

      return () => clearTimeout(timer);
    }
  }, [show, onAnimationEnd, targetElement]);

  if (!show || sparkles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      {sparkles.map(sparkle => (
        <div key={sparkle.id} className="sparkle" style={sparkle.style} />
      ))}
    </div>
  );
}

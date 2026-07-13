"use client";

import { useEffect, useRef, useState } from "react";

// Entrada suave al entrar en viewport (IntersectionObserver, no scroll listener).
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  as?: any;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ ["--reveal-delay" as any]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

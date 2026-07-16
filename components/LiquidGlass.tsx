import type { CSSProperties, ReactNode } from "react";

/**
 * Efecto "liquid glass" (estilo Apple / dashersw/liquid-glass-js) reimplementado
 * de forma nativa para React + SSR: en vez de re-rasterizar la página con
 * html2canvas y WebGL, se usa la misma técnica subyacente —refracción real del
 * fondo con feTurbulence + feDisplacementMap sobre el backdrop, difuminado,
 * tinte translúcido y brillo especular en el borde—. Cero dependencias, sin
 * jank y consciente del tema (claro/oscuro).
 *
 * <LiquidGlassDefs/> inyecta los filtros SVG una sola vez (en el layout).
 * <LiquidGlass/> envuelve cualquier contenido con la superficie de cristal.
 */

export function LiquidGlassDefs() {
  return (
    <svg
      aria-hidden
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        {/* Refracción sutil (paneles, tarjetas) */}
        <filter id="lg-distort" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Refracción más marcada (botones, chips pequeños) */}
        <filter id="lg-distort-strong" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.018" numOctaves="2" seed="12" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

type LiquidGlassProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Refracción real del fondo con el filtro SVG (por defecto sí). */
  refract?: boolean;
  /** Refracción más intensa (para superficies pequeñas). */
  strong?: boolean;
  /** Barrido de luz especular animado al pasar el cursor. */
  sheen?: boolean;
};

export default function LiquidGlass({
  children,
  className = "",
  style,
  refract = true,
  strong = false,
  sheen = false
}: LiquidGlassProps) {
  const classes = [
    "liquid-glass",
    refract ? (strong ? "liquid-glass--refract-strong" : "liquid-glass--refract") : "",
    sheen ? "liquid-glass--sheen" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

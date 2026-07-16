"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Fondo animado del hero con shadergradient (ruucm/shadergradient) — malla WebGL
 * con degradado en movimiento muy lento. Se importa sólo en cliente (ssr:false)
 * para no penalizar el SSR ni el SEO: el contenido del hero se renderiza igual.
 * La paleta se afina a la marca (crema · arena · cacao) y respeta el tema y
 * `prefers-reduced-motion`. Bajo el canvas siempre hay un degradado CSS por si
 * WebGL no está disponible.
 */

const ShaderGradientCanvas = dynamic(
  () => import("@shadergradient/react").then((m) => m.ShaderGradientCanvas),
  { ssr: false }
);
const ShaderGradient = dynamic(
  () => import("@shadergradient/react").then((m) => m.ShaderGradient),
  { ssr: false }
);

// Paletas cálidas de "lujo silencioso". Ahora la base de la app es neutra
// (porcelana greige), así que el degradado puede tener más presencia y un
// stop de cognac más rico para que se lea sin ensuciar el hero.
const LIGHT = { c1: "#f3ede2", c2: "#e2c79c", c3: "#b07c46" };
const DARK = { c1: "#2a2320", c2: "#6b4e35", c3: "#c79a63" };

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

export default function HeroShaderBackdrop() {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const dark = useIsDark();

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const palette = dark ? DARK : LIGHT;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Degradado CSS de respaldo (siempre presente, bajo el canvas) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 100% at 78% 18%, ${palette.c2}66 0%, transparent 55%), radial-gradient(90% 90% at 12% 90%, ${palette.c3}44 0%, transparent 60%)`
        }}
      />
      {mounted && (
        <ShaderGradientCanvas
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          pixelDensity={1}
          fov={40}
        >
          <ShaderGradient
            control="props"
            type="waterPlane"
            animate={reduced ? "off" : "on"}
            uSpeed={0.16}
            uStrength={1.4}
            uDensity={1.3}
            uFrequency={5.5}
            color1={palette.c1}
            color2={palette.c2}
            color3={palette.c3}
            grain="on"
            cAzimuthAngle={180}
            cPolarAngle={115}
            cDistance={3.2}
            positionX={0}
            positionY={0.2}
            positionZ={0}
            rotationX={45}
            rotationY={0}
            rotationZ={-60}
            reflection={0.1}
            brightness={dark ? 0.9 : 1.25}
            envPreset="dawn"
          />
        </ShaderGradientCanvas>
      )}
    </div>
  );
}

"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK = "/placeholder-piece.svg";

/**
 * next/image con red de seguridad: si la URL viene vacía o el archivo no
 * carga (404, hotlink bloqueado…), muestra un placeholder limpio de la casa
 * en lugar del icono roto del navegador o el texto alt recortado.
 */
export default function SmartImage({ src, alt, ...rest }: ImageProps) {
  const [failed, setFailed] = useState(false);
  const empty = !src || (typeof src === "string" && !src.trim());
  const useFallback = failed || empty;
  return (
    <Image
      {...rest}
      src={useFallback ? FALLBACK : src}
      alt={useFallback ? "" : alt}
      onError={() => setFailed(true)}
    />
  );
}

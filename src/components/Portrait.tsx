"use client";

import Image from "next/image";
import { useState } from "react";

export function Portrait({ src, name, size, initials, background, color }: {
  src: string; name: string; size: number; initials: string; background: string; color: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-bold"
      style={{ width: size, height: size, background, color, fontSize: size * 0.36 }}>
      {failed ? initials : <Image src={src} alt={`Portrait of ${name}`} width={size} height={size}
        sizes={`${size}px`} className="h-full w-full object-cover object-top" onError={() => setFailed(true)} />}
    </span>
  );
}

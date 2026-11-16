import React from "react";

interface BrandLogoProps {
  className?: string;
  withBorder?: boolean;
}

/**
 * Komponen resmi Logo ANF yang seragam di seluruh aplikasi
 * Background: #27364B (Deep Slate Blue)
 * Text: White, Bold, tracking-wider
 * Ukuran standar: w-8 h-8 rounded
 */
export default function BrandLogo({ className = "", withBorder = false }: BrandLogoProps) {
  return (
    <div
      className={`w-8 h-8 rounded bg-[#27364B] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm select-none flex-shrink-0 ${
        withBorder ? "border border-white/20" : ""
      } ${className}`}
    >
      ANF
    </div>
  );
}

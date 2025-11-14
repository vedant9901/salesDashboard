// Compact format (Indian)
export function compactFormat(value: number) {
  const formatter = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    compactDisplay: "short",
  });

  return formatter.format(value);
}

// Standard Indian number format with 2 decimals
export function standardFormat(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


// --- Compact Indian style (Cr/L) with proper comma grouping ---
export function indianCompactFormat(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '';

  const absVal = Math.abs(value);

  // Crores
  if (absVal >= 1_00_00_000) {
    const num = value / 1_00_00_000;
    return (
      num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) + ' Cr'
    );
  }

  // Lakhs
  if (absVal >= 1_00_000) {
    const num = value / 1_00_000;
    return (
      num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) + ' L'
    );
  }

  // Thousands (no suffix, just Indian grouping)
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}


// --- Always Indian style with decimals ---
export function indianStandardFormat(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '';

  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

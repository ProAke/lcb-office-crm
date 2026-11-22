/** Pixel bounds cover the entire image without gaps, ordered left-to-right, top-to-bottom. */
export function richMenuBounds(layout: "strip" | "grid6", height: number, count: number) {
  if (!Number.isInteger(height) || height <= 0 || !Number.isInteger(count) || count < 1 || count > 6 || (layout === "grid6" && count !== 6)) {
    throw new Error("Invalid rich menu layout");
  }
  return Array.from({ length: count }, (_, i) => {
    const columns = layout === "grid6" ? 3 : count;
    const column = i % columns;
    const row = layout === "grid6" ? Math.floor(i / columns) : 0;
    const rows = layout === "grid6" ? 2 : 1;
    const x = Math.floor(column * 2500 / columns);
    const right = Math.floor((column + 1) * 2500 / columns);
    const y = Math.floor(row * height / rows);
    const bottom = Math.floor((row + 1) * height / rows);
    return { x, y, width: right - x, height: bottom - y };
  });
}

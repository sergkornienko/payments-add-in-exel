export const getExcelColumn = (start: string, offset: number): string => {
  const toNumber = (col: string): number => {
    let num = 0;
    for (const char of col.toUpperCase()) {
      num = num * 26 + (char.charCodeAt(0) - 64); // 'A' = 1
    }
    return num;
  };

  const toColumn = (num: number): string => {
    let col = "";
    while (num > 0) {
      num--; // Excel is 1-based
      col = String.fromCharCode((num % 26) + 65) + col;
      num = Math.floor(num / 26);
    }
    return col;
  };

  const startNumber = toNumber(start);
  return toColumn(startNumber + offset);
};
export const normalizeDay = (day: number) => (day < 10 ? `0${day}` : day);

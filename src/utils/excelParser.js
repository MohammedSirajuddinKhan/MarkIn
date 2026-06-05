import XLSX from "xlsx";

function normalizeHeader(header) {
  return header?.toString().trim().toLowerCase().replace(/\s+/g, "_") || "";
}

export function parseExcel(filePath, columnMap) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows.map((row) => {
    const normalizedRow = {};
    Object.keys(row).forEach((key) => {
      normalizedRow[normalizeHeader(key)] = row[key];
    });

    const mappedRow = {};
    Object.entries(columnMap).forEach(([targetKey, candidates]) => {
      const foundKey = candidates.find(
        (candidate) => normalizedRow[candidate] !== undefined
      );
      mappedRow[targetKey] = foundKey ? normalizedRow[foundKey] : "";
    });

    return mappedRow;
  });
}

import ExcelJS from "exceljs";

export async function combineWorkbooks(
  briefBuffer: Buffer,
  mediaplanBuffer: Buffer,
): Promise<Buffer> {
  const combined = new ExcelJS.Workbook();

  // Load Agency Brief
  const briefWb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await briefWb.xlsx.load(briefBuffer as any);
  const sourceSheet = briefWb.worksheets[0];
  if (sourceSheet) {
    const target = combined.addWorksheet("Agency Brief");
    copyWorksheet(sourceSheet, target);
  }

  // Load Mediaplan
  const mediaWb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await mediaWb.xlsx.load(mediaplanBuffer as any);
  const mediaSource = mediaWb.worksheets[0];
  if (mediaSource) {
    const target = combined.addWorksheet("Mediaplan");
    copyWorksheet(mediaSource, target);
  }

  const buffer = await combined.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function copyWorksheet(source: ExcelJS.Worksheet, target: ExcelJS.Worksheet) {
  // Copy column widths
  source.columns.forEach((col, i) => {
    if (col.width) {
      target.getColumn(i + 1).width = col.width;
    }
  });

  // Copy rows with values and styles
  source.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const targetRow = target.getRow(rowNumber);
    targetRow.height = row.height;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const targetCell = targetRow.getCell(colNumber);
      targetCell.value = cell.value;
      targetCell.style = cell.style;
    });
    targetRow.commit();
  });

  // Copy merged cells
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merges = (source.model as any).merges;
  if (merges) {
    for (const merge of merges) {
      target.mergeCells(merge);
    }
  }
}

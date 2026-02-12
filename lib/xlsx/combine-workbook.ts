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
  const briefSheet = combined.addWorksheet("Agency Brief");
  briefSheet.model = Object.assign({}, briefWb.worksheets[0].model, {
    mergeCells: briefWb.worksheets[0].model.merges,
  });
  briefSheet.name = "Agency Brief";

  // Load Mediaplan
  const mediaWb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await mediaWb.xlsx.load(mediaplanBuffer as any);
  const mediaSheet = combined.addWorksheet("Mediaplan");
  mediaSheet.model = Object.assign({}, mediaWb.worksheets[0].model, {
    mergeCells: mediaWb.worksheets[0].model.merges,
  });
  mediaSheet.name = "Mediaplan";

  const buffer = await combined.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

import path from "path";

export const TEMPLATE_DIR = path.join(process.cwd(), "docs", "ROI_Mediaplan");

export const TEMPLATE_FILES = {
  agency_brief: "ROIworks _ TEMPLATE_ Agency campaign brief.xlsx",
  ppc_traffic: "ROIworks _ TEMPLATE_ Mediaplan PPC only, Traffic only 2026.xlsx",
  ppc_reach: "ROIworks _ TEMPLATE_ Mediaplan PPC only, Reach only 2026.xlsx",
  ppc_mixed: "ROIworks _ TEMPLATE_ Mediaplan PPC only, Traffic & Reach 2026.xlsx",
  all_channels: "ROIworks _ TEMPLATE_ Mediaplan all channels.xlsx",
} as const;

export type TemplateName = keyof typeof TEMPLATE_FILES;

export function getTemplatePath(name: TemplateName): string {
  return path.join(TEMPLATE_DIR, TEMPLATE_FILES[name]);
}

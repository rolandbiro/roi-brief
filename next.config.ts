import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/approve": ["./docs/ROI_Mediaplan/**/*"],
    "/api/retry/*": ["./docs/ROI_Mediaplan/**/*"],
  },
};

export default nextConfig;

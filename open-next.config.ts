import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
  experimental: {
    disableIncrementalCache: true,
  },
});

export default config;

import { createEnv } from "@t3-oss/env-nextjs";

export const clientEnv = createEnv({
  client: {
    // Client-side environment variables if needed
  },
  runtimeEnv: {
    // Client runtime env
  },
});

import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z
      .string()
      .default("file:./database/bidfly.db"),
    NEXT_TELEMETRY_DISABLED: z.enum(["1", "0"]).default("1"),
    CHECKPOINT_DISABLE: z.enum(["1", "0"]).default("1"),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

import { z } from "zod";
import { usernameValidation } from "./commonRules.js";

export const forgotPassword = z.object({
    username: usernameValidation,
});

// export type RecoveryPasswordFields = z.infer<typeof recoveryPasswordSchema>;

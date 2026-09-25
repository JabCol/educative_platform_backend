import { z } from "zod";
import { usernameValidation } from "./commonRules";

export const forgotPassword = z.object({
    username: usernameValidation,
});

// export type RecoveryPasswordFields = z.infer<typeof recoveryPasswordSchema>;

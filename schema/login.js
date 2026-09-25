import { z } from "zod";
import { usernameValidation, passwordValidation } from "./commonRules";

export const loginSchema = z.object({
    username: usernameValidation,
    password: passwordValidation,
});

// export type LoginFields = z.infer<typeof loginSchema>;
import { z } from "zod";
import { usernameValidation, passwordValidation } from "./commonRules.js";

export const loginSchema = z.object({
    username: usernameValidation,
    password: passwordValidation,
});

// export type LoginFields = z.infer<typeof loginSchema>;
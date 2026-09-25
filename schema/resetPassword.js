import { z } from "zod";
import { passwordValidation } from "./commonRules";

export const resetPasswordSchema = z
    .object({
        password: passwordValidation,
        confirmPassword: z.string().min(1, { message: "You must confirm your password." }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

// export type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

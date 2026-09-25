import { z } from "zod";

export const usernameValidation = z
    .string()
    .min(1, { message: "Username is required." });

export const passwordValidation = z
    .string()
    .min(1, { message: "Password is required." })
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
    })
    .regex(/[0-9]/, {
        message: "Password must contain at least one number.",
    })
    .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character (e.g., @, #, $, %, *).",
    });
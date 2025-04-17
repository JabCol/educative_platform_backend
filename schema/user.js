import z from 'zod'

// User schema validation
const userSchema = z.object({
  firstName: z.string({
    invalid_type_error: 'First name must be a string',
    required_error: 'First name is required'
  }),
  lastName: z.string({
    invalid_type_error: 'Last name must be a string',
    required_error: 'Last name is required'
  }),
  username: z.string({
    invalid_type_error: 'Username must be a string',
    required_error: 'Username is required'
  }),
  email: z.string({
    invalid_type_error: 'Email must be a string',
    required_error: 'Email is required'
  }).email({ message: 'Email must be a valid email address' }),
  password: z.string({
    invalid_type_error: 'Password must be a string',
    required_error: 'Password is required'
  })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  passwordConfirmation: z.string({
    invalid_type_error: 'Password confirmation must be a string',
    required_error: 'Password confirmation is required'
  })
    .min(8, { message: 'Password confirmation must be at least 8 characters long' }),
  birthdate: z.string({
    invalid_type_error: 'Birthdate must be a string',
    required_error: 'Birthdate is required'
  }).refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, { message: 'Birthdate must be a valid date' }),
  phonenumber: z.number({
    invalid_type_error: 'Phone number must be a number'
  })
    .positive({ message: 'Phone number must be a positive number' })
    .min(1000000, { message: 'Phone number must be at least 7 digits long' })
    .max(9999999999, { message: 'Phone number must be at most 10 digits long' })
    .optional(),
  cellphoneNumber: z.number({
    invalid_type_error: 'Cellphone number must be a number'
  })
    .positive({ message: 'Cellphone number must be a positive number' })
    .min(10000000, { message: 'Cellphone number must be at least 8 digits long' })
    .max(9999999999, { message: 'Phone number must be at most 10 digits long' })
    .optional()
})

export function validateUser (user) {
  const schema = userSchema
    .superRefine(({ password, passwordConfirmation }, ctx) => {
      if (password !== passwordConfirmation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['passwordConfirmation'],
          message: 'Passwords do not match'
        })
      }
    })
  return schema.safeParse(user)
}

export function validatePartialUser (input) {
  return userSchema.partial().safeParse(input)
}

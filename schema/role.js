import z from 'zod'

// User schema validation
const roleSchema = z.object({
  id: z.string({
    invalid_type_error: 'ID must be a string',
    required_error: 'ID is required'
  }).uuid('Invalid UUID format'),
  name: z.enum(['student', 'teacher', 'admin']),
  roleIds: z.array(
    z.string().uuid('Invalid UUID format')
  ).min(1, 'At least one role ID is required').optional()
})

// Validate user data
export function validateRole (role) {
  return roleSchema.safeParse(role)
}

// Validate partial user data
export function validatePartialRole (input) {
  return roleSchema.partial().safeParse(input)
}

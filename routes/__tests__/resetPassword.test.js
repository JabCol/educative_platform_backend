import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { createAuthModel } from '../auth.js'

// 1. Create a "Mock" of our model
const mockUserModel = {
    updatePassword: vi.fn(),
}

// 2. Mini Express app
const app = express()
app.use(express.json())
app.use('/auth', createAuthModel({ userModel: mockUserModel }))

describe('POST /auth/reset-password/:token', () => {

    const validToken = 'my-secret-token-123'

    const validRequestData = {
        password: 'NewStrongPassword123!',
        confirmPassword: 'NewStrongPassword123!'
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('Should return 200 if password is updated successfully', async () => {
        // --- ARRANGE ---
        mockUserModel.updatePassword.mockResolvedValue(true) // Simulates success in DB

        // --- ACT ---
        const response = await request(app)
            .patch(`/auth/reset-password/${validToken}`)
            .send(validRequestData)

        // --- ASSERT ---
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ message: 'Password updated successfully' })

        expect(mockUserModel.updatePassword).toHaveBeenCalledTimes(1)

        // Verificamos que el argumento enviado al modelo contiene el "password" (el hash se genera en el controller)
        // Usamos expect.objectContaining porque el token se hashea antes de enviarse a la base de datos
        expect(mockUserModel.updatePassword).toHaveBeenCalledWith(
            expect.objectContaining({ password: validRequestData.password })
        )
    })

    it('Should return 400 if validation fails (passwords do not match)', async () => {
        // --- ARRANGE ---
        const invalidData = {
            password: 'NewStrongPassword123!',
            confirmPassword: 'DifferentPassword123!'
        }

        // --- ACT ---
        const response = await request(app)
            .patch(`/auth/reset-password/${validToken}`)
            .send(invalidData)

        // --- ASSERT ---
        expect(response.status).toBe(400)
        expect(response.body.error).toBeDefined()

        // La validación frena la ejecución, nunca llega a la DB
        expect(mockUserModel.updatePassword).toHaveBeenCalledTimes(0)
    })

    it('Should return 401 if token is invalid or expired', async () => {
        // --- ARRANGE ---
        // Simular que el modelo no encontró el token o ya expiró
        mockUserModel.updatePassword.mockResolvedValue(false)

        // --- ACT ---
        const response = await request(app)
            .patch(`/auth/reset-password/${validToken}`)
            .send(validRequestData)

        // --- ASSERT ---
        expect(response.status).toBe(401)
        expect(response.body).toEqual({ error: 'Invalid or expired token. Do the process again.' })

        expect(mockUserModel.updatePassword).toHaveBeenCalledTimes(1)
    })

    it('Should return 500 if the server crashes', async () => {
        // --- ARRANGE ---
        mockUserModel.updatePassword.mockRejectedValue(new Error('DB connection lost'))

        // --- ACT ---
        const response = await request(app)
            .patch(`/auth/reset-password/${validToken}`)
            .send(validRequestData)

        // --- ASSERT ---
        expect(response.status).toBe(500)
        expect(response.body).toEqual({ error: 'Could not reset password.' })

        expect(mockUserModel.updatePassword).toHaveBeenCalledTimes(1)
    })
})

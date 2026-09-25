import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { createAuthModel } from '../auth.js'
import { sendResetPasswordEmail } from '../../services/email.js'

// 1. Mock the email service function so it doesn't send real emails
vi.mock('../../services/email.js', () => ({
    sendResetPasswordEmail: vi.fn()
}))

// 2. Create a "Mock" of our model
const mockUserModel = {
    getUser: vi.fn(),
    saveResetToken: vi.fn(),
}

// 3. Mini Express app just for this test
const app = express()
app.use(express.json())
app.use('/auth', createAuthModel({ userModel: mockUserModel }))

describe('POST /auth/forgot-password', () => {

    const validRequestData = {
        username: 'testuser123'
    }

    const fakeUserFromDB = {
        id: 1,
        username: 'testuser123',
        email: 'test@example.com' // The email controller will use this
    }

    const standardSuccessMessage = 'If an account is associated with this username, password reset instructions will be sent.'

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('Should return 200 and send email if user exists', async () => {
        // --- ARRANGE ---
        mockUserModel.getUser.mockResolvedValue(fakeUserFromDB)
        mockUserModel.saveResetToken.mockResolvedValue(true)

        // Simulate that the email was sent successfully
        sendResetPasswordEmail.mockResolvedValue({ accepted: ['test@example.com'] })

        // --- ACT ---
        const response = await request(app)
            .post('/auth/forgot-password')
            .send(validRequestData)

        // --- ASSERT ---
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ message: standardSuccessMessage })

        expect(mockUserModel.getUser).toHaveBeenCalledTimes(1)
        expect(mockUserModel.saveResetToken).toHaveBeenCalledTimes(1)
        expect(sendResetPasswordEmail).toHaveBeenCalledTimes(1)
    })

    it('Should return 200 (for security) even if user does not exist', async () => {
        // --- ARRANGE ---
        mockUserModel.getUser.mockResolvedValue(false) // User not found in DB

        // --- ACT ---
        const response = await request(app)
            .post('/auth/forgot-password')
            .send(validRequestData)

        // --- ASSERT ---
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ message: standardSuccessMessage })

        expect(mockUserModel.getUser).toHaveBeenCalledTimes(1)
        // Verify that no attempt was made to save the token or send an email
        expect(mockUserModel.saveResetToken).toHaveBeenCalledTimes(0)
        expect(sendResetPasswordEmail).toHaveBeenCalledTimes(0)
    })

    it('Should return 400 if username is missing or invalid', async () => {
        // --- ARRANGE ---
        const invalidData = { username: '' }

        // --- ACT ---
        const response = await request(app)
            .post('/auth/forgot-password')
            .send(invalidData)

        // --- ASSERT ---
        expect(response.status).toBe(400)
        expect(response.body.error).toBeDefined()

        expect(mockUserModel.getUser).toHaveBeenCalledTimes(0)
        expect(sendResetPasswordEmail).toHaveBeenCalledTimes(0)
    })

    it('Should return 500 if saving the reset token fails', async () => {
        // --- ARRANGE ---
        mockUserModel.getUser.mockResolvedValue(fakeUserFromDB)
        mockUserModel.saveResetToken.mockResolvedValue(false) // Simulate save failure

        // --- ACT ---
        const response = await request(app)
            .post('/auth/forgot-password')
            .send(validRequestData)

        // --- ASSERT ---
        expect(response.status).toBe(500)
        expect(response.body).toEqual({ error: 'Error saving token' })

        expect(sendResetPasswordEmail).toHaveBeenCalledTimes(0)
    })

    it('Should return 500 if email service fails', async () => {
        // --- ARRANGE ---
        mockUserModel.getUser.mockResolvedValue(fakeUserFromDB)
        mockUserModel.saveResetToken.mockResolvedValue(true)

        // Simulate failure in the email service (returns object without 'accepted')
        sendResetPasswordEmail.mockResolvedValue(null)

        // --- ACT ---
        const response = await request(app)
            .post('/auth/forgot-password')
            .send(validRequestData)

        // --- ASSERT ---
        expect(response.status).toBe(500)
        expect(response.body).toEqual({ error: 'Failed to deliver email to destination.' })
    })
})

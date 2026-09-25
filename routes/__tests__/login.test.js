import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { createAuthModel } from '../auth.js'

// 1. Create a "Mock" of the User Model.
const mockUserModel = {
    getUser: vi.fn(),
    comparePassword: vi.fn(),
}

// 2. Configure a mini Express application just for this test
const app = express()
app.use(express.json()) // Required to parse req.body

// Mount the auth routes by injecting our fake model
app.use('/auth', createAuthModel({ userModel: mockUserModel }))

describe('POST /auth/login', () => {

    // --- REUSABLE TEST DATA ---
    const validLoginData = {
        username: 'testuser123',
        password: 'CorrectPassword123!'
    }

    const fakeUserFromDB = {
        id: 1,
        username: 'testuser123',
        roles: ['USER']
    }

    // Clean mocks before every test to avoid counters overlapping
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('Should return 200 and the token if credentials are correct', async () => {
        // --- ARRANGE ---
        mockUserModel.getUser.mockResolvedValue(fakeUserFromDB)
        mockUserModel.comparePassword.mockResolvedValue(true)

        // --- ACT ---
        const response = await request(app)
            .post('/auth/login')
            .send(validLoginData)

        // --- ASSERT ---
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            message: 'Logged In!!!',
            id: 1,
            roles: ['USER']
        })
        expect(response.headers['set-cookie']).toBeDefined()
        expect(response.headers['set-cookie'][0]).toContain('access_token=')

        expect(mockUserModel.getUser).toHaveBeenCalledTimes(1)
        expect(mockUserModel.comparePassword).toHaveBeenCalledTimes(1)
    })

    it('Should return 400 if credentials do not match the requirements', async () => {
        // --- ARRANGE ---
        const invalidLoginData = {
            username: '',
            password: 'CorrectPassword!'
        }

        // --- ACT ---
        const response = await request(app)
            .post('/auth/login')
            .send(invalidLoginData)

        // --- ASSERT ---
        expect(response.status).toBe(400)
        expect(response.body).toEqual({
            error: [
                {
                    code: "too_small",
                    exact: false,
                    inclusive: true,
                    message: "Username is required.",
                    minimum: 1,
                    path: ["username"],
                    type: "string"
                },
                {
                    code: "invalid_string",
                    message: "Password must contain at least one number.",
                    path: ["password"],
                    validation: "regex"
                }
            ]
        })
        expect(mockUserModel.getUser).toHaveBeenCalledTimes(0)
        expect(mockUserModel.comparePassword).toHaveBeenCalledTimes(0)
    })

    it('Should return 401 because of wrong username', async () => {
        // --- ARRANGE ---
        mockUserModel.getUser.mockResolvedValue(false)
        mockUserModel.comparePassword.mockResolvedValue(false)

        // --- ACT ---
        const response = await request(app)
            .post('/auth/login')
            .send(validLoginData)

        // --- ASSERT ---
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            error: 'Invalid credentials!!!'
        })
        expect(mockUserModel.getUser).toHaveBeenCalledTimes(1)
        expect(mockUserModel.comparePassword).toHaveBeenCalledTimes(0)
    })

    it('Should return 401 because of invalid password', async () => {
        // --- ARRANGE ---
        mockUserModel.getUser.mockResolvedValue(fakeUserFromDB)
        mockUserModel.comparePassword.mockResolvedValue(false)

        // --- ACT ---
        const response = await request(app)
            .post('/auth/login')
            .send(validLoginData)

        // --- ASSERT ---
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            error: 'Invalid credentials!!!'
        })
        expect(mockUserModel.getUser).toHaveBeenCalledTimes(1)
        expect(mockUserModel.comparePassword).toHaveBeenCalledTimes(1)
    })

    it('Should return 500 if the server crashes', async () => {
        // --- ARRANGE ---
        mockUserModel.getUser.mockRejectedValue(new Error('Database query failed at checking user existence'))
        mockUserModel.comparePassword.mockResolvedValue(false)

        // --- ACT ---
        const response = await request(app)
            .post('/auth/login')
            .send(validLoginData)

        // --- ASSERT ---
        expect(response.status).toBe(500)
        expect(response.body).toEqual({
            error: 'Could not complete login operation.'
        })
        expect(mockUserModel.getUser).toHaveBeenCalledTimes(1)
        expect(mockUserModel.comparePassword).toHaveBeenCalledTimes(0)
    })
})

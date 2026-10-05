import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { createAuthModel } from '../auth.js'
import { verifyToken } from '../../middleware/authentication.js'
import { SECRET_JWT_KEY } from '../../config.js'

const mockUserModel = {}

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(verifyToken)
app.use('/auth', createAuthModel({ userModel: mockUserModel }))

describe('GET /auth/me', () => {
  const validUserPayload = {
    id: 42,
    username: 'testuser',
    roles: [{ id: "1", name: 'admin' }],
    permissions: ['users:read', 'users:create']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('Should return 200 and user session data when a valid JWT cookie is provided', async () => {
    const validToken = jwt.sign(validUserPayload, SECRET_JWT_KEY, { expiresIn: '1h' })

    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', [`access_token=${validToken}`])

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: validUserPayload.id,
      roles: validUserPayload.roles,
      permissions: validUserPayload.permissions
    })
  })

  it('Should return 401 Unauthorized when no cookie/token is provided', async () => {
    const response = await request(app)
      .get('/auth/me')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: 'Unauthorized' })
  })

  it('Should return 401 Unauthorized when an invalid token is provided', async () => {
    const invalidToken = 'invalid.jwt.token'

    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', [`access_token=${invalidToken}`])

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: 'Unauthorized' })
  })

  it('Should return 401 Unauthorized when token is signed with a different secret', async () => {
    const forgedToken = jwt.sign(validUserPayload, 'wrong-secret-key', { expiresIn: '1h' })

    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', [`access_token=${forgedToken}`])

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: 'Unauthorized' })
  })

  it('Should return 401 Unauthorized when token is expired', async () => {
    const expiredToken = jwt.sign(validUserPayload, SECRET_JWT_KEY, { expiresIn: '-1s' })

    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', [`access_token=${expiredToken}`])

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: 'Unauthorized' })
  })
})

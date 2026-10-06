import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import { createAuthModel } from '../auth.js'

const mockUserModel = {}

const app = express()
app.use(cookieParser())
app.use('/auth', createAuthModel({ userModel: mockUserModel }))

describe('GET /auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should return 200 and success message when logging out', async () => {
    const response = await request(app)
      .get('/auth/logout')
      .set('Cookie', ['access_token=dummy-token'])

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Logged out successfully'
    })
  })

  it('Should clear the access_token cookie with matching Path and expiration', async () => {
    const response = await request(app)
      .get('/auth/logout')

    expect(response.status).toBe(200)
    const setCookie = response.headers['set-cookie']
    expect(setCookie).toBeDefined()

    const cookieString = setCookie[0]
    expect(cookieString).toContain('access_token=')
    expect(cookieString).toContain('Path=/')
    // Express clearCookie sets expiration in the past (1970) or empty value
    expect(
      cookieString.includes('Expires=Thu, 01 Jan 1970') ||
      cookieString.includes('Max-Age=0') ||
      cookieString.includes('access_token=;')
    ).toBe(true)
  })

  it('Should succeed even if no previous session cookie existed', async () => {
    const response = await request(app)
      .get('/auth/logout')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Logged out successfully'
    })
  })
})

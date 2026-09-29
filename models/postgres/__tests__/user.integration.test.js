import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import pool from '../connection.js'
import { UserModel } from '../user.js'
import crypto from 'node:crypto';

describe('UserModel Integration Tests (Transactional)', () => {

    let dynamicUser;

    // 1. "SAVE GAME" before every single test
    beforeEach(async () => {
        await pool.query('BEGIN');
        // Fetch a user dynamically to ensure tests work across different seeds
        const res = await pool.query("SELECT * FROM users WHERE username != 'test-user' LIMIT 1");
        if (res.rows.length > 0) {
            dynamicUser = res.rows[0];
        }
    });

    // 2. "LOAD GAME" after every single test, throwing away all changes
    afterEach(async () => {
        await pool.query('ROLLBACK');
    });

    // --- GET USER TESTS ---
    describe('getUser()', () => {
        it('should find a seeded user without breaking the database', async () => {
            const user = await UserModel.getUser({ username: dynamicUser.username });
            expect(user).not.toBe(false);
            expect(user.email).toBeDefined();
            expect(user.roles).toBeDefined();
            expect(user.password).not.toBeDefined();
        });

        it('should not find a seeded user', async () => {
            const user = await UserModel.getUser({ username: 'kaela.green' });
            expect(user).toBe(false);
        });
    });

    // --- GET BY ID TESTS ---
    describe('getById()', () => {
        it('should find a seeded user by its id', async () => {
            const user = await UserModel.getById({ id: dynamicUser.id });
            expect(user).not.toBe(false);
            expect(user.username).toEqual(dynamicUser.username);
        });

        it('should not find a seeded user by the given id', async () => {
            const user = await UserModel.getById({ id: '47f5c6dd-6dec-4a00-a003-44caf0e228c6' });
            expect(user).toBe(false);
        });

        it('should throw an error because of the given invalid id', async () => {
            // vowel u makes it invalid syntax for type uuid
            await expect(
                UserModel.getById({ id: '47f5c6dd-6duc-4a00-a003-44caf0e228c6' })
            ).rejects.toThrow('Database query failed at checking user existence');
        });
    });

    // --- GET ALL TESTS ---
    describe('getAll()', () => {
        it('should find 51 users', async () => {
            const users = await UserModel.getAll({ name: null, lastname: null, email: null, role: null });
            expect(users.length).toBe(51);
        });

        it('should return an array when searching by partial name', async () => {
            const users = await UserModel.getAll({ name: "a" }); // 'a' is common enough to find at least one user
            if (users !== false) {
                expect(Array.isArray(users)).toBe(true);
            }
        });

        it('should return an array when searching by partial lastname', async () => {
            const users = await UserModel.getAll({ lastname: "e" });
            if (users !== false) {
                expect(Array.isArray(users)).toBe(true);
            }
        });

        it('should find 5 users with the role teacher', async () => {
            const users = await UserModel.getAll({ role: "teacher" });
            expect(users.length).toBe(5);
        });

        it('should find the 2 users that share the hardcoded email same_email42@gmail.com', async () => {
            const users = await UserModel.getAll({ email: "same_email42@gmail.com" });
            expect(users.length).toBe(2);
        });

        it('should return false since there are no users who match the given lastname ZZZZZZ', async () => {
            const users = await UserModel.getAll({ lastname: "ZZZZZZ" });
            expect(users).toBe(false);
        });
    });

    // --- COMPARE PASSWORD TESTS ---
    describe('comparePassword()', () => {
        it('should compare the passwords and return true when the user\'s password matches', async () => {
            // Predictable password format based on seedDatabase.js logic
            const predictablePassword = `Edu_${dynamicUser.username}1!`;
            const isEqual = await UserModel.comparePassword({ id: dynamicUser.id, password: predictablePassword });
            expect(isEqual).toBe(true);
        });

        it('should compare the passwords and return false since the password does not match', async () => {
            const isEqual = await UserModel.comparePassword({ id: dynamicUser.id, password: "WrongPassword123!" });
            expect(isEqual).toBe(false);
        });

        it('should return false if the id or password is null', async () => {
            const isEqual = await UserModel.comparePassword({ id: null, password: null });
            expect(isEqual).toBe(false);
        });
    });

    // --- PASSWORD RESET FLOW TESTS ---
    describe('Password Reset Flow (saveResetToken & updatePassword)', () => {
        it('should save a new token and its expiration date and update the user password', async () => {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
            const tokenExpiration = new Date(Date.now() + 15 * 60 * 1000);

            const saveResetTokenResult = await UserModel.saveResetToken({ id: dynamicUser.id, hashedToken: hashedToken, tokenExpiration: tokenExpiration });
            expect(saveResetTokenResult).toBe(true);

            const updatePasswordResult = await UserModel.updatePassword({ hashedToken: hashedToken, password: "NuevaPassword123!" });
            expect(updatePasswordResult).toBe(true);
        });

        it('should save a new token but not update the user password with an incorrect token', async () => {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
            const tokenExpiration = new Date(Date.now() + 15 * 60 * 1000);

            const saveResetTokenResult = await UserModel.saveResetToken({ id: dynamicUser.id, hashedToken: hashedToken, tokenExpiration: tokenExpiration });
            expect(saveResetTokenResult).toBe(true);

            const updatePasswordResult = await UserModel.updatePassword({ hashedToken: hashedToken + "wrongOne", password: "NuevaPassword123!" });
            expect(updatePasswordResult).toBe(false);
        });

        it('should save a new token but not update the user password since the token is expired', async () => {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
            const tokenExpiration = new Date(Date.now());

            const saveResetTokenResult = await UserModel.saveResetToken({ id: dynamicUser.id, hashedToken: hashedToken, tokenExpiration: tokenExpiration });
            expect(saveResetTokenResult).toBe(true);

            const updatePasswordResult = await UserModel.updatePassword({ hashedToken: hashedToken, password: "NuevaPassword123!" });
            expect(updatePasswordResult).toBe(false);
        });

        it('should throw an error if saveResetToken is called with an invalid UUID', async () => {
            await expect(
                UserModel.saveResetToken({ id: "malformed-uuid", hashedToken: "abc", tokenExpiration: new Date() })
            ).rejects.toThrow('Database query failed at updating user');
        });
    });

    // --- CREATE TESTS ---
    describe('create()', () => {
        it('should successfully create a new user', async () => {
            const newUser = {
                firstName: "John",
                lastName: "Doe",
                username: "johndoe_test123",
                email: "johndoe_test123@example.com",
                password: "StrongPassword123!",
                birthdate: "1995-01-01",
                phoneNumber: "123456789",
                cellphoneNumber: "987654321"
            };
            const created = await UserModel.create(newUser);
            expect(created).toBeDefined();
            expect(created[0].username).toBe("johndoe_test123");
        });

        it('should return false if the username already exists', async () => {
            const duplicateUser = {
                firstName: "Copy",
                lastName: "Cat",
                username: "kaela.green14", // Already seeded username
                email: "copycat@example.com",
                password: "StrongPassword123!",
                birthdate: "1995-01-01",
                phoneNumber: "123456789",
                cellphoneNumber: "987654321"
            };
            const result = await UserModel.create(duplicateUser);
            expect(result).toBe(false);
        });

        it('should throw a database error if a required field is missing', async () => {
            const invalidUser = {
                // missing firstName which is usually NOT NULL
                lastName: "Doe",
                username: "johndoe_invalid",
                email: "johndoe_invalid@example.com",
                password: "StrongPassword123!",
                birthdate: "1995-01-01"
            };
            await expect(UserModel.create(invalidUser))
                .rejects.toThrow('Database query failed at creating user');
        });
    });

    // --- UPDATE TESTS ---
    describe('update()', () => {
        it('should successfully update a user', async () => {
            const updated = await UserModel.update({
                id: dynamicUser.id,
                input: { firstName: "UpdatedFirstName" }
            });
            expect(updated).toBeDefined();
            expect(updated.firstname).toBe("UpdatedFirstName"); // PostgreSQL returns lowercase column names generally
        });

        it('should return false if the user ID does not exist', async () => {
            const updated = await UserModel.update({
                id: "11111111-1111-4111-a111-111111111111", // Valid UUID format, but doesn't exist
                input: { firstName: "Ghost" }
            });
            expect(updated).toBe(false);
        });

        it('should throw an error if no valid fields are provided', async () => {
            await expect(UserModel.update({ id: dynamicUser.id, input: {} }))
                .rejects.toThrow('No valid fields to update');
        });
    });

    // --- SOFT DELETE TESTS ---
    describe('softDeleteUser()', () => {
        it('should successfully soft delete a user and return true', async () => {
            // Note: softDeleteUser takes the ID directly as an argument, not as an object property
            const result = await UserModel.softDeleteUser(dynamicUser.id);
            expect(result).toBe(true);
        });

        it('should return false if the user ID does not exist', async () => {
            const result = await UserModel.softDeleteUser("11111111-1111-4111-a111-111111111111");
            expect(result).toBe(false);
        });

        it('should throw a database error if the ID is malformed', async () => {
            await expect(UserModel.softDeleteUser("malformed-uuid"))
                .rejects.toThrow('Database query failed at deleting user');
        });
    });

});
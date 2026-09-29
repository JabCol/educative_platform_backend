import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import pool from '../connection.js'
import { RoleModel } from '../roles.js'

describe('RoleModel Integration Tests (Transactional)', () => {
    let validUserId;
    let validRoleIds = [];

    // 1. "SAVE GAME" before every single test
    beforeEach(async () => {
        await pool.query('BEGIN');
        
        // Fetch a valid user ID dynamically so we don't rely on hardcoded UUIDs
        const userRes = await pool.query('SELECT id FROM users LIMIT 1');
        if (userRes.rows.length > 0) {
            validUserId = userRes.rows[0].id;
        }

        // Fetch some valid role IDs dynamically
        const roleRes = await pool.query('SELECT id FROM roles LIMIT 2');
        validRoleIds = roleRes.rows.map(r => r.id);
    });

    // 2. "LOAD GAME" after every single test, throwing away all changes
    afterEach(async () => {
        await pool.query('ROLLBACK');
    });

    describe('getByUserId()', () => {
        it('should return an array of roles for a given user', async () => {
            const roles = await RoleModel.getByUserId({ userId: validUserId });
            expect(roles).toBeDefined();
            expect(Array.isArray(roles)).toBe(true);
        });

        it('should return an empty array for a user ID that does not exist', async () => {
            // A perfectly formatted UUID that does not exist in the database
            const roles = await RoleModel.getByUserId({ userId: '11111111-1111-4111-a111-111111111111' });
            expect(roles).toBeDefined();
            expect(Array.isArray(roles)).toBe(true);
            expect(roles.length).toBe(0);
        });

        it('should throw an error if the user ID is malformed', async () => {
            await expect(
                RoleModel.getByUserId({ userId: 'invalid-uuid-format' })
            ).rejects.toThrow('Database query failed at getting user roles');
        });
    });

    describe('update()', () => {
        it('should successfully update the roles for a user', async () => {
            // ACT: Update the user's roles
            const updatedRoles = await RoleModel.update({ 
                userId: validUserId, 
                roleIds: validRoleIds 
            });

            // ASSERT: The update method returns the new roles
            expect(updatedRoles).toBeDefined();
            expect(updatedRoles.length).toBe(validRoleIds.length);

            // Double check they were actually saved by fetching them from the DB
            const fetchedRoles = await RoleModel.getByUserId({ userId: validUserId });
            expect(fetchedRoles.length).toBe(validRoleIds.length);
        });

        it('should throw an error if one or more roleIds do not exist', async () => {
            const fakeRoleId = '11111111-1111-4111-a111-111111111111';
            const invalidRoleIds = [validRoleIds[0], fakeRoleId];

            await expect(
                RoleModel.update({ userId: validUserId, roleIds: invalidRoleIds })
            ).rejects.toThrow('Some roleIds do not exist');
        });

        it('should throw a database error if an empty array of roleIds is provided', async () => {
            // In the current RoleModel implementation, passing [] generates invalid SQL syntax
            // like: "INSERT INTO users_roles (userId, roleId) VALUES RETURNING ..."
            await expect(
                RoleModel.update({ userId: validUserId, roleIds: [] })
            ).rejects.toThrow('Database query failed at inserting user roles');
        });
    });
});

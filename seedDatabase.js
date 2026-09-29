import pool from './models/postgres/connection.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from './config.js';
import fs from 'fs/promises';
import path from 'path';

async function seedDatabase(userCount = 48) {
    console.log('🌱 Starting database seed...');

    try {
        // --- STEP 0: CLEAR EXISTING DATA ---
        console.log("0. Clearing existing data...");
        await pool.query('DELETE FROM users_roles');
        await pool.query('DELETE FROM users');
        await pool.query('DELETE FROM roles');

        // --- STEP 1: ENSURE ROLES EXIST ---
        console.log("1. Setting up roles...");
        await pool.query(`
            INSERT INTO roles (name) VALUES ('student'), ('teacher'), ('admin')
            ON CONFLICT DO NOTHING
        `);

        const rolesResult = await pool.query('SELECT id, name FROM roles');
        const roles = rolesResult.rows;

        if (roles.length === 0) {
            throw new Error("Roles table is empty and could not be seeded.");
        }

        console.log(`2. Creating ${userCount} users...`);

        const createdUserIds = [];
        const cheatSheet = []; // We will save the important passwords here to show you later

        // --- STEP 1.5: INSERT HARDCODED USERS ---
        console.log("1.5. Inserting specific hardcoded test users...");
        const hardcodedUsers = [
            {
                id: '784ca42a-3cb8-4b57-8425-ae89ca4b2213',
                firstname: 'login-user',
                lastname: 'login-ser',
                username: 'login-user', // Use this for LoginPage.spec.ts
                email: 'nicolvaleria0919@gmail.com',
                password: '$2b$10$nNopzgI3Fi1O8HpIrbiJt.wPj3WIm12RaxrRKb38WQERJAplVAW0a', // Edu_testUser1!
                birthdate: '1990-04-16',
                phonenumber: '6012345678',
                cellphonenumber: '3094158989'
            },
            {
                id: 'b6e9a66d-1144-4861-ba2c-297c17d8f4bc',
                firstname: 'Recovery',
                lastname: 'User',
                username: 'recovery-user', // Use this for RecoveryPage.spec.ts
                email: 'recovery@example.com',
                password: '$2b$10$nNopzgI3Fi1O8HpIrbiJt.wPj3WIm12RaxrRKb38WQERJAplVAW0a', // Edu_testUser1!
                birthdate: '1990-04-16',
                phonenumber: '6012345678',
                cellphonenumber: '3094158989'
            },
            {
                id: 'f1911961-4560-498c-8f42-4f3abde26226',
                firstname: 'Reset',
                lastname: 'User',
                username: 'reset-user', // Use this for ResetPassword.spec.ts
                email: 'reset@example.com',
                password: '$2b$10$nNopzgI3Fi1O8HpIrbiJt.wPj3WIm12RaxrRKb38WQERJAplVAW0a', // Edu_testUser1!
                birthdate: '1990-04-16',
                phonenumber: '6012345678',
                cellphonenumber: '3094158989',
                reset_password_token: '898f365afbd6bd0823770539bfc0e24e8068b1b42b85cce07f7e58049e396263',
                reset_password_token_expiration: 'infinity'
            }
        ];

        for (const user of hardcodedUsers) {
            const query = `
                INSERT INTO users (id, "firstname", "lastname", username, email, password, birthdate, "phonenumber", "cellphonenumber", reset_password_token, reset_password_token_expiration)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id) DO NOTHING
                RETURNING id
            `;
            const result = await pool.query(query, [
                user.id, user.firstname, user.lastname, user.username, user.email,
                user.password, user.birthdate, user.phonenumber, user.cellphonenumber,
                user.reset_password_token || null, user.reset_password_token_expiration || null
            ]);

            // Only add them to the lists if they were successfully inserted
            if (result.rows.length > 0) {
                createdUserIds.push(user.id);

                // For the cheat sheet, login-user is a teacher, the others are students
                let displayRole = 'STUDENT (Hardcoded)';
                if (user.id === '784ca42a-3cb8-4b57-8425-ae89ca4b2213') {
                    displayRole = 'TEACHER (Hardcoded)';
                }

                cheatSheet.push({ role: displayRole, username: user.username, email: user.email, password: 'Edu_testUser1!' });
            }
        }

        // --- STEP 2: CREATE RANDOM USERS ---
        console.log(`2. Creating ${userCount} random users...`);
        for (let i = 0; i < userCount; i++) {
            const id = faker.string.uuid();
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const username = faker.internet.username({ firstName, lastName }).toLowerCase() + i;
            // Force 2 specific users to share an email so we can test the getAll({email}) method
            const email = (i === 10 || i === 13) ? 'same_email42@gmail.com' : faker.internet.email({ firstName, lastName }).toLowerCase();
            const birthdate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' });

            const phoneNumber = faker.phone.number();
            const cellphoneNumber = faker.phone.number();

            // 🔥 NEW SOLUTION: Unique but predictable passwords!
            // Example: "Edu_johndoe01!" (Has Upper, Lower, Number, Special, Min 8)
            const rawPassword = `Edu_${username}1!`;
            const hashedPassword = await bcrypt.hash(rawPassword, Number(SALT_ROUNDS));

            // The very first random user will be our Admin. The next 4 will be Teachers.
            if (i === 0) {
                cheatSheet.push({ role: 'ADMIN', username: username, email: email, password: rawPassword });
            } else if (i > 0 && i <= 4) {
                cheatSheet.push({ role: 'TEACHER', username: username, email: email, password: rawPassword });
            }

            const userQuery = `
                INSERT INTO users (id, "firstname", "lastname", username, email, password, birthdate, "phonenumber", "cellphonenumber") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `;

            const result = await pool.query(userQuery, [
                id, firstName, lastName, username, email, hashedPassword, birthdate, phoneNumber, cellphoneNumber
            ]);
            createdUserIds.push(result.rows[0].id);
        }

        // --- STEP 3: ASSIGN ROLES ---
        console.log('3. Assigning roles to users...');

        // Find specific roles from the database result
        const adminRole = roles.find(r => r.name === 'admin');
        const teacherRole = roles.find(r => r.name === 'teacher');
        const studentRole = roles.find(r => r.name === 'student');

        for (let i = 0; i < createdUserIds.length; i++) {
            const userId = createdUserIds[i];
            let assignedRoleId;

            // Explicitly assign roles based on the exact UUIDs for the hardcoded users
            if (userId === '784ca42a-3cb8-4b57-8425-ae89ca4b2213') {
                assignedRoleId = teacherRole.id; // Test User -> Teacher
            } else if (userId === 'b6e9a66d-1144-4861-ba2c-297c17d8f4bc' || userId === 'f1911961-4560-498c-8f42-4f3abde26226') {
                assignedRoleId = studentRole.id; // E2E Users -> Students
            } else if (i === 3) {
                // The first random user (index 3 overall) becomes the Admin
                assignedRoleId = adminRole.id;
            } else if (i > 3 && i <= 7) {
                // The next 4 random users become teachers (keeps the total teachers at exactly 5)
                assignedRoleId = teacherRole.id;
            } else {
                // Everyone else is a student
                assignedRoleId = studentRole.id;
            }

            await pool.query(`
                INSERT INTO users_roles ("userid", "roleid") 
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [userId, assignedRoleId]);
        }

        console.log('\n✅ Seeding finished successfully!');

        console.log('\n--- 🔑 CREDENTIALS CHEAT SHEET ---');
        console.table(cheatSheet);
        console.log('----------------------------------\n');

        // --- STEP 4: SAVE CREDENTIALS TO TEXT FILE ---
        const envName = process.env.NODE_ENV === 'test' ? 'Test' : 'Dev';
        const fileName = `exampleCredentials${envName}.txt`;
        const dirPath = path.join(process.cwd(), 'data_examples');
        const filePath = path.join(dirPath, fileName);

        await fs.mkdir(dirPath, { recursive: true });

        let fileContent = `=== CREDENTIALS CHEAT SHEET (${envName}) ===\n`;
        fileContent += `Generated at: ${new Date().toLocaleString()}\n\n`;

        for (const cred of cheatSheet) {
            fileContent += `Role: ${cred.role}\n`;
            fileContent += `Username: ${cred.username}\n`;
            fileContent += `Email: ${cred.email}\n`;
            fileContent += `Password: ${cred.password}\n`;
            fileContent += `-------------------------\n`;
        }

        await fs.writeFile(filePath, fileContent, 'utf-8');
        console.log(`📝 Credentials automatically saved to: data_examples/${fileName}\n`);


    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await pool.end();
    }
}

seedDatabase();
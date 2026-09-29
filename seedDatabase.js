import pool from './models/postgres/connection.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from './config.js';

async function seedDatabase(userCount = 50) {
    console.log('🌱 Starting database seed...');

    try {
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
                firstname: 'Usuario',
                lastname: 'Prueba',
                username: 'test-user',
                email: 'nicolvaleria0919@gmail.com',
                password: '$2b$10$h4G89Xoo1.B3sSyTV/asEuqVjo7x.MzaPWth1DWDRQNv/jnwQinxG',
                birthdate: '1990-04-16',
                cellphonenumber: '3094158989',
                reset_password_token: '898f365afbd6bd0823770539bfc0e24e8068b1b42b85cce07f7e58049e396263',
                reset_password_token_expiration: 'infinity'
            }
        ];

        for (const user of hardcodedUsers) {
            const query = `
                INSERT INTO users (id, "firstname", "lastname", username, email, password, birthdate, "cellphonenumber", reset_password_token, reset_password_token_expiration)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
                RETURNING id
            `;
            const result = await pool.query(query, [
                user.id, user.firstname, user.lastname, user.username, user.email,
                user.password, user.birthdate, user.cellphonenumber,
                user.reset_password_token, user.reset_password_token_expiration
            ]);

            // Only add them to the lists if they were successfully inserted
            if (result.rows.length > 0) {
                createdUserIds.push(user.id);
                cheatSheet.push({ role: 'TEACHER (Hardcoded)', username: user.username, email: user.email, password: '(Your original password)' });
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
            } else if (i === 1) {
                // The first random user (index 1 overall) becomes the Admin
                assignedRoleId = adminRole.id;
            } else if (i > 1 && i <= 5) {
                // The next 4 random users become teachers
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

    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await pool.end();
    }
}

seedDatabase();
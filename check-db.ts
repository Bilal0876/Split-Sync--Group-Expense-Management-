import db from './server/config/db.ts';

async function checkUsers() {
    try {
        const result = await db.query('SELECT id, username, email FROM users');
        console.table(result.rows);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();

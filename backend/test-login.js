const db = require('./config/database');
const { comparePassword } = require('./utils/passwordHash');

async function testLogin() {
    console.log('Testing login logic...');
    try {
        const users = db.getAll('users.json');
        console.log('Total users found:', users.length);
        if (users.length === 0) {
            console.log('No users found in data/users.json');
            return;
        }

        const user = users[0];
        console.log('Attempting to test first user:', user.email);
        
        // Let's assume the user is 'citizen@example.com' and the password was 'password123'
        // We will try that.
        const testPassword = 'password123';
        const isValid = await comparePassword(testPassword, user.password);
        console.log(`Password "${testPassword}" is valid for ${user.email}:`, isValid);

        // Try 'admin123' just in case
        const adminPassword = 'admin123';
        const isAdminValid = await comparePassword(adminPassword, user.password);
        console.log(`Password "${adminPassword}" is valid for ${user.email}:`, isAdminValid);

    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

testLogin();

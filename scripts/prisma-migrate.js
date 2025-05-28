const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Prisma Migration Helper');
console.log('=========================');
console.log('');
console.log('This script will help you migrate your database schema using Prisma.');
console.log('');
console.log('Options:');
console.log('1. Create a new migration (development)');
console.log('2. Apply migrations to production database');
console.log('3. Reset database (WARNING: This will delete all data)');
console.log('4. Generate Prisma client');
console.log('5. Open Prisma Studio');
console.log('');

rl.question('Enter your choice (1-5): ', (choice) => {
  try {
    switch (choice) {
      case '1':
        console.log('\n📝 Creating a new migration...');
        rl.question('Enter a name for the migration: ', (name) => {
          console.log(`\nRunning: npx prisma migrate dev --name ${name}`);
          execSync(`npx prisma migrate dev --name ${name}`, { stdio: 'inherit' });
          console.log('\n✅ Migration created successfully!');
          rl.close();
        });
        break;
      
      case '2':
        console.log('\n🚢 Applying migrations to production database...');
        console.log('\nRunning: npx prisma migrate deploy');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('\n✅ Migrations applied successfully!');
        rl.close();
        break;
      
      case '3':
        console.log('\n⚠️  WARNING: This will delete all data in your database!');
        rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
          if (answer.toLowerCase() === 'yes') {
            console.log('\nRunning: npx prisma migrate reset --force');
            execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
            console.log('\n✅ Database reset successfully!');
          } else {
            console.log('\n❌ Database reset cancelled.');
          }
          rl.close();
        });
        break;
      
      case '4':
        console.log('\n🔧 Generating Prisma client...');
        console.log('\nRunning: npx prisma generate');
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('\n✅ Prisma client generated successfully!');
        rl.close();
        break;
      
      case '5':
        console.log('\n🔍 Opening Prisma Studio...');
        console.log('\nRunning: npx prisma studio');
        console.log('\nPress Ctrl+C to stop Prisma Studio when finished.');
        execSync('npx prisma studio', { stdio: 'inherit' });
        rl.close();
        break;
      
      default:
        console.log('\n❌ Invalid choice. Please run the script again and select a valid option.');
        rl.close();
    }
  } catch (error) {
    console.error('\n❌ An error occurred:', error.message);
    rl.close();
  }
}); 
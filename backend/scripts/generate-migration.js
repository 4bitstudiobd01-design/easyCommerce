const { execSync } = require('child_process');

/**
 * Helper script to generate TypeORM migrations with a name.
 * Usage: npm run migration:generate -- AddUserFields
 */

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const name = args.join('_');

if (!name) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Please provide a migration name!');
  console.log('Example: npm run migration:generate -- AddUserFields');
  process.exit(1);
}

const command = `npm run typeorm -- migration:generate src/database/migrations/${name} -d src/database/data-source.ts`;

try {
  console.log(`\x1b[36m%s\x1b[0m`, `Generating migration: src/database/migrations/${name}...`);
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}

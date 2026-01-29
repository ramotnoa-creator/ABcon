import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.VITE_NEON_DATABASE_URL);

const chapters = await sql`SELECT * FROM budget_chapters LIMIT 3`;

console.log('Budget chapters:', chapters.length);
if (chapters.length > 0) {
  console.log('Sample:', chapters[0]);
}

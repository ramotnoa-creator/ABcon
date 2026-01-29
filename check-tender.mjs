import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.VITE_NEON_DATABASE_URL);

const tenders = await sql`
  SELECT id, tender_name, estimate_id, created_at 
  FROM tenders 
  ORDER BY created_at DESC 
  LIMIT 3
`;

console.log('Recent tenders:');
tenders.forEach(t => console.log(`- ${t.id}: ${t.tender_name} (estimate: ${t.estimate_id})`));

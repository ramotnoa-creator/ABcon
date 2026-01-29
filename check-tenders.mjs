import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.VITE_NEON_DATABASE_URL);

const tenders = await sql`
  SELECT id, tender_name, estimate_id, created_at 
  FROM tenders 
  ORDER BY created_at DESC 
  LIMIT 3
`;

console.log('Recent tenders with estimate_id:');
tenders.forEach(t => {
  const estimateStatus = t.estimate_id ? `✓ ${t.estimate_id}` : '✗ NULL';
  console.log(`- ${t.tender_name}: ${estimateStatus}`);
});

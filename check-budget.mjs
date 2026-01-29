import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.VITE_NEON_DATABASE_URL);

const items = await sql`
  SELECT id, description, tender_id, supplier_name, total_with_vat, created_at 
  FROM budget_items 
  ORDER BY created_at DESC 
  LIMIT 5
`;

console.log('Recent budget items:', items.length);
items.forEach(item => {
  const tender = item.tender_id || 'none';
  console.log('- ' + item.description + ': tender=' + tender);
});

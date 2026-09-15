const { Client } = require('pg');
const { randomUUID } = require('crypto');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'bitcommerce'
});

async function run() {
  await client.connect();
  const prodId = 'bdae4afd-6a47-464c-aded-a01fad488038';
  const tenantId = 'efc4bcaf-784c-4994-8042-9b87b7622a6f';
  
  const imgs = [
    {
      url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
      alt: 'Insulated Stainless Steel Water Bottle Front View',
      isPrimary: true,
      sortOrder: 0
    },
    {
      url: 'https://images.unsplash.com/photo-1544003484-3cd181d17917?w=800&auto=format&fit=crop&q=80',
      alt: 'Insulated Water Bottle Lid Detail',
      isPrimary: false,
      sortOrder: 1
    },
    {
      url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&auto=format&fit=crop&q=80',
      alt: 'Insulated Bottle Outdoor Lifestyle',
      isPrimary: false,
      sortOrder: 2
    },
    {
      url: 'https://images.unsplash.com/photo-1570857502809-08184874388e?w=800&auto=format&fit=crop&q=80',
      alt: 'Insulated Bottle Texture and Coating',
      isPrimary: false,
      sortOrder: 3
    }
  ];

  for (const img of imgs) {
    await client.query(
      'INSERT INTO product_images ("id", "url", "altText", "isPrimary", "sortOrder", "productId", "tenantId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [randomUUID(), img.url, img.alt, img.isPrimary, img.sortOrder, prodId, tenantId]
    );
  }

  const check = await client.query('SELECT id, url, "isPrimary" FROM product_images WHERE "productId" = $1', [prodId]);
  console.log('SUCCESS: Inserted', check.rows.length, 'images!');
  await client.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

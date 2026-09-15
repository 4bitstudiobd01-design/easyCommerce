const { Client } = require('../backend/node_modules/pg');

async function fix() {
  const client = new Client({
    connectionString: "postgresql://postgres:123456@localhost:5433/easyComerz"
  });
  await client.connect();
  console.log("Connected to PostgreSQL!");

  try {
    // 1. Check current enum values
    const enumRes = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'products_homepagesections_enum'
    `);
    console.log("Current enum labels:", enumRes.rows.map(r => r.enumlabel));

    // 2. Check if HERO_FEATURED is in the enum
    const labels = enumRes.rows.map(r => r.enumlabel);
    if (!labels.includes('HERO_FEATURED')) {
      // Add HERO_FEATURED temporarily to the enum if missing so Postgres can cast/read it
      console.log("Adding HERO_FEATURED to enum...");
      await client.query(`ALTER TYPE "public"."products_homepagesections_enum" ADD VALUE IF NOT EXISTS 'HERO_FEATURED'`);
    }
    if (!labels.includes('HERO')) {
      console.log("Adding HERO to enum...");
      await client.query(`ALTER TYPE "public"."products_homepagesections_enum" ADD VALUE IF NOT EXISTS 'HERO'`);
    }
    if (!labels.includes('FEATURED')) {
      console.log("Adding FEATURED to enum...");
      await client.query(`ALTER TYPE "public"."products_homepagesections_enum" ADD VALUE IF NOT EXISTS 'FEATURED'`);
    }

    // 3. Check products with HERO_FEATURED
    const prodRes = await client.query(`
      SELECT id, name, "homepageSections"::text FROM products WHERE 'HERO_FEATURED' = ANY("homepageSections"::text[])
    `);
    console.log("Products with HERO_FEATURED:", prodRes.rows.length);

    // 4. Update products with HERO_FEATURED -> FEATURED
    await client.query(`
      UPDATE products 
      SET "homepageSections" = array_replace("homepageSections"::text[], 'HERO_FEATURED', 'FEATURED')::text[]::"public"."products_homepagesections_enum"[]
      WHERE 'HERO_FEATURED' = ANY("homepageSections"::text[])
    `);
    console.log("Updated products!");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fix();

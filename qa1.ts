import { AppDataSource } from './src/database/data-source';
import * as jwtLib from 'jsonwebtoken';
const SEC=process.env.JWT_SECRET||'easycommerce_jwt_secret_key_change_in_prod';
const API='http://localhost:5001/api/v1/catalog';
let H:any={}; const created:string[]=[];
let pass=0, fail=0;
const check=(name:string, ok:boolean, detail=''):void=>{ (ok?pass++:fail++); console.log(`  ${ok?'✓':'✗ FAIL'} ${name}${detail?' — '+detail:''}`); };
const g=async(p:string)=>{const r=await fetch(`${API}${p}`,{headers:H});return {s:r.status,j:(await r.json().catch(()=>({}))) as any};};
const post=async(p:string,b:any)=>{const r=await fetch(`${API}${p}`,{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify(b)});return {s:r.status,j:(await r.json().catch(()=>({}))) as any};};
const patch=async(p:string,b:any)=>{const r=await fetch(`${API}${p}`,{method:'PATCH',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify(b)});return {s:r.status,j:(await r.json().catch(()=>({}))) as any};};
const del=async(p:string)=>{const r=await fetch(`${API}${p}`,{method:'DELETE',headers:H});return {s:r.status,j:(await r.json().catch(()=>({}))) as any};};
const unwrap=(j:any)=>j?.data??j;

async function main(){
  await AppDataSource.initialize();
  const T='d7fbde2f-32c5-4ec6-a1d1-8eb09292b868';
  const st=(await AppDataSource.query(`SELECT id,"ownerId" FROM stores WHERE "tenantId"=$1 LIMIT 1`,[T]))[0];
  const u=(await AppDataSource.query(`SELECT id,email,role FROM users WHERE id=$1`,[st.ownerId]))[0];
  H={Authorization:`Bearer ${jwtLib.sign({sub:u.id,email:u.email,role:u.role},SEC,{expiresIn:'30m'})}`,'x-store-id':st.id};
  const SFX=Date.now().toString().slice(-6);

  console.log('\n=== 1. CREATE ===');
  const cat=(await g('/categories')).j; const catId=unwrap(cat)?.[0]?.id;
  const br=(await g('/brands')).j; const brId=unwrap(br)?.[0]?.id;
  const c1=await post('/products',{name:`QA Physical ${SFX}`,sku:`QA-P-${SFX}`,basePrice:1500,compareAtPrice:2000,costPrice:900,
    productType:'PHYSICAL',status:'DRAFT',categoryId:catId,brandId:brId,initialStock:25,lowStockThreshold:5,trackInventory:true,
    weight:1.2,weightUnit:'KG',barcode:`BC-${SFX}`,taxRate:15});
  const p1=unwrap(c1.j); if(p1?.id) created.push(p1.id);
  check('create PHYSICAL product', c1.s===201, `HTTP ${c1.s}`);
  check('  fields persisted', Number(p1?.basePrice)===1500 && p1?.sku===`QA-P-${SFX}`);
  check('  category+brand linked', !!p1?.categoryId && !!p1?.brandId);

  const c2=await post('/products',{name:`QA Digital ${SFX}`,sku:`QA-D-${SFX}`,basePrice:500,productType:'DIGITAL',status:'ACTIVE',
    digitalDeliveryType:'DOWNLOAD',digitalAssetUrl:'https://x.com/f.zip',trackInventory:false});
  const p2=unwrap(c2.j); if(p2?.id) created.push(p2.id);
  check('create DIGITAL product', c2.s===201, `HTTP ${c2.s}`);
  check('  publishedAt set (ACTIVE)', !!p2?.publishedAt);

  const c3=await post('/products',{name:`QA Service ${SFX}`,sku:`QA-S-${SFX}`,basePrice:3000,productType:'SERVICE',status:'ACTIVE',
    serviceDeliveryType:'ONSITE',serviceDuration:2,serviceDurationUnit:'HOURS',trackInventory:false});
  const p3=unwrap(c3.j); if(p3?.id) created.push(p3.id);
  check('create SERVICE product', c3.s===201, `HTTP ${c3.s}`);

  // duplicate SKU must be rejected
  const dup=await post('/products',{name:'dupe',sku:`QA-P-${SFX}`,basePrice:100});
  check('duplicate SKU rejected', dup.s===400, `HTTP ${dup.s}`);
  const noName=await post('/products',{sku:`QA-X-${SFX}`,basePrice:100});
  check('missing name rejected', noName.s===400, `HTTP ${noName.s}`);
  const negPrice=await post('/products',{name:'neg',basePrice:-50});
  check('negative price rejected', negPrice.s===400, `HTTP ${negPrice.s}`);

  console.log('\n=== 2. READ / DETAILS ===');
  const d1=await g(`/products/${p1.id}`); const dd=unwrap(d1.j);
  check('get product by id', d1.s===200);
  check('  stockInfo present', !!dd?.stockInfo, JSON.stringify(dd?.stockInfo?.onHand));
  check('  stock matches initialStock 25', dd?.stockInfo?.onHand===25);
  check('  relations loaded (category/brand)', !!dd?.category && !!dd?.brand);
  const bad=await g('/products/00000000-0000-0000-0000-000000000000');
  check('unknown id -> 404', bad.s===404, `HTTP ${bad.s}`);

  console.log('\n=== 3. UPDATE ===');
  const up=await patch(`/products/${p1.id}`,{name:`QA Renamed ${SFX}`,basePrice:1800});
  check('update name+price', up.s===200);
  const after=(await AppDataSource.query(`SELECT * FROM products WHERE id=$1`,[p1.id]))[0];
  check('  price updated to 1800', Number(after.basePrice)===1800);
  check('  untouched fields kept', after.sku===`QA-P-${SFX}` && Number(after.costPrice)===900 && Number(after.weight)===1.2);
  const pub=await patch(`/products/${p1.id}`,{status:'ACTIVE'});
  const afterPub=(await AppDataSource.query(`SELECT status,"isPublished","publishedAt" FROM products WHERE id=$1`,[p1.id]))[0];
  check('publish DRAFT->ACTIVE', pub.s===200 && afterPub.status==='ACTIVE' && afterPub.isPublished===true);
  check('  publishedAt stamped', !!afterPub.publishedAt);
  const firstPub=afterPub.publishedAt;
  await patch(`/products/${p1.id}`,{status:'DRAFT'});
  await patch(`/products/${p1.id}`,{status:'ACTIVE'});
  const rePub=(await AppDataSource.query(`SELECT "publishedAt" FROM products WHERE id=$1`,[p1.id]))[0];
  check('  publishedAt NOT overwritten on re-publish', new Date(rePub.publishedAt).getTime()===new Date(firstPub).getTime());
  const skuClash=await patch(`/products/${p1.id}`,{sku:`QA-D-${SFX}`});
  check('update to existing SKU rejected', skuClash.s===400, `HTTP ${skuClash.s}`);

  console.log(`\nRESULT SO FAR: ${pass} passed, ${fail} failed`);
  (global as any).__ids=created; (global as any).__sfx=SFX; (global as any).__H=H;
  await AppDataSource.destroy();
  console.log('IDS='+created.join(','));
}
main().catch((e:Error)=>{console.error('ERR',e.message.slice(0,300));process.exit(1);});

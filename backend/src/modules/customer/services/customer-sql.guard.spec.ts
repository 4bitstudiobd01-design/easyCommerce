import * as fs from 'fs';
import * as path from 'path';

/**
 * Static guard over the raw SQL embedded in the customer services.
 *
 * The unit specs in this folder mock `query`/`manager.query`, so a malformed SQL *string*
 * passes every one of them. That is exactly how `"customerId" ANY($2)` — missing the `=`
 * — shipped in the customer list, export and order-history paths and broke all three
 * endpoints at runtime while the suite stayed green.
 *
 * These assertions read the service sources and check the SQL text itself, so the class of
 * defect that mocking hides cannot reappear silently. They need no database and so run in CI.
 */
describe('Customer services — raw SQL guards', () => {
  const servicesDir = __dirname;

  const serviceFiles = fs
    .readdirSync(servicesDir)
    .filter((f) => f.endsWith('.service.ts'))
    .map((f) => ({ name: f, source: fs.readFileSync(path.join(servicesDir, f), 'utf8') }));

  it('finds service sources to analyse', () => {
    expect(serviceFiles.length).toBeGreaterThan(0);
  });

  it('never uses ANY(...) without a comparison operator', () => {
    // Valid:   col = ANY($1)   /   col <> ANY($1)
    // Invalid: col ANY($1)
    const offenders: string[] = [];

    for (const { name, source } of serviceFiles) {
      source.split('\n').forEach((line, idx) => {
        if (!line.includes('ANY(')) return;
        // Strip the operator forms that are legal, then see if any ANY( survives.
        const withoutValid = line.replace(/(=|!=|<>|<|>|<=|>=)\s*ANY\s*\(/g, '');
        if (withoutValid.includes('ANY(')) {
          offenders.push(`${name}:${idx + 1} -> ${line.trim()}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it('never casts monetary columns to float', () => {
    // ::float is lossy for Postgres numeric money columns; ::numeric preserves precision.
    const offenders: string[] = [];

    for (const { name, source } of serviceFiles) {
      source.split('\n').forEach((line, idx) => {
        if (/::float/.test(line) && /grandTotal|totalSpent|revenue|amount/i.test(line)) {
          offenders.push(`${name}:${idx + 1} -> ${line.trim()}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it('keeps every raw query tenant-scoped', () => {
    // Any raw SELECT against a tenant-owned table must filter on tenantId. orders/customers
    // are the tables these read-models touch; order_items is reached via an orderId list
    // that was itself tenant-scoped, so it is exempt.
    const offenders: string[] = [];

    for (const { name, source } of serviceFiles) {
      const queries = source.match(/`\s*SELECT[\s\S]*?`/g) || [];
      for (const q of queries) {
        const touchesTenantTable = /FROM\s+(orders|customers)\b/i.test(q);
        if (!touchesTenantTable) continue;
        if (!/"tenantId"\s*=\s*\$/.test(q)) {
          offenders.push(`${name} -> ${q.slice(0, 120).replace(/\s+/g, ' ')}...`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('parameterises raw queries instead of interpolating values', () => {
    // Template-literal interpolation inside a SQL string is an injection vector.
    const offenders: string[] = [];

    for (const { name, source } of serviceFiles) {
      const queries = source.match(/`\s*(SELECT|INSERT|UPDATE|DELETE)[\s\S]*?`/g) || [];
      for (const q of queries) {
        if (/\$\{/.test(q)) {
          offenders.push(`${name} -> ${q.slice(0, 120).replace(/\s+/g, ' ')}...`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

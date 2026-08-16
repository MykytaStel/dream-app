import fs from 'fs';
import path from 'path';
import { PRODUCT_EVENTS } from '../src/services/observability/events';

/**
 * The database is the other half of the taxonomy, and nothing else checks it.
 *
 * `analytics_events` constrains `event` to a fixed list. If the client sends a
 * name the constraint does not know, Postgres rejects the whole INSERT — not
 * the offending row, the batch of fifty it travelled in. The client treats a
 * rejected batch as retryable, so a single unknown name stalls delivery until
 * the queue overflows past it.
 *
 * Reading the migration rather than duplicating the list here is the point: a
 * copy would drift in exactly the way this exists to prevent.
 */
const MIGRATION_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '20260813_000006_analytics_events.sql',
);

function readMigrationEventNames(): string[] {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  const match = /check \(event in \(([\s\S]*?)\)\)/.exec(sql);

  if (!match) {
    throw new Error('event allowlist constraint not found in the migration');
  }

  return [...match[1].matchAll(/'([^']+)'/g)].map(entry => entry[1]);
}

describe('analytics schema contract', () => {
  it('accepts exactly the events the client can emit', () => {
    expect(readMigrationEventNames().sort()).toEqual(
      [...Object.values(PRODUCT_EVENTS)].sort(),
    );
  });

  it('lists each event once', () => {
    const names = readMigrationEventNames();

    expect(names.length).toBe(new Set(names).size);
  });

  it('keeps the table write-only: no select, update or delete policy', () => {
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
    const policyActions = [...sql.matchAll(/^for (\w+)$/gm)].map(m => m[1]);

    expect(policyActions).toEqual(['insert', 'insert']);
  });

  it('sets the row id from the client, so a retry cannot duplicate a row', () => {
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

    // A server-side default would mint a new id per attempt, and delivery is
    // at-least-once by design.
    expect(sql).not.toMatch(/id uuid primary key default/);
    expect(sql).toMatch(/id uuid primary key,/);
  });
});

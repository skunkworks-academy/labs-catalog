#!/usr/bin/env node
/**
 * Validates data/catalog.json against the catalogue taxonomy and required fields.
 * Zero runtime dependencies so it runs anywhere Node 18+ is available.
 *
 * Checks performed:
 *   1. Both data files exist and parse as JSON of the expected shape.
 *   2. Every entry has all required fields with the correct primitive types.
 *   3. Entry ids are unique and well-formed.
 *   4. Every job role / complexity / industry / specialization referenced by an
 *      entry exists in data/taxonomy.json (referential integrity).
 *
 * Exit code is non-zero when any check fails, so CI can gate on it.
 */
import { readFileSync } from 'node:fs';

const errors = [];
const warnings = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
  } catch (err) {
    errors.push(`Could not read/parse ${path}: ${err.message}`);
    return null;
  }
}

const taxonomy = readJson('data/taxonomy.json');
const catalog = readJson('data/catalog.json');

if (errors.length) { report(); process.exit(1); }

if (!Array.isArray(catalog)) errors.push('data/catalog.json must be a JSON array.');

const ids = (key) => new Set((taxonomy?.[key] ?? []).map((item) => item.id));
const roleIds = ids('jobRoles');
const levelIds = ids('complexityLevels');
const industryIds = ids('industries');
const specIds = ids('specializations');

const required = ['id', 'title', 'summary', 'jobRoles', 'complexity', 'durationMinutes', 'industries', 'specializations', 'status'];
const allowedStatus = new Set(['draft', 'review', 'published', 'retired']);
const seenIds = new Set();

for (const [index, entry] of (Array.isArray(catalog) ? catalog : []).entries()) {
  const where = `catalog[${index}]${entry?.id ? ` (${entry.id})` : ''}`;
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`${where}: entry must be an object.`);
    continue;
  }
  for (const field of required) {
    if (entry[field] === undefined) errors.push(`${where}: missing required field "${field}".`);
  }
  if (typeof entry.id === 'string') {
    if (!/^[A-Z]{3}-[0-9A-Z]+$/.test(entry.id)) errors.push(`${where}: id "${entry.id}" should look like "LNX-101".`);
    if (seenIds.has(entry.id)) errors.push(`${where}: duplicate id "${entry.id}".`);
    seenIds.add(entry.id);
  }
  if (entry.durationMinutes !== undefined && (!Number.isInteger(entry.durationMinutes) || entry.durationMinutes < 5)) {
    errors.push(`${where}: durationMinutes must be an integer of at least 5.`);
  }
  if (entry.status !== undefined && !allowedStatus.has(entry.status)) {
    errors.push(`${where}: status "${entry.status}" is not one of ${[...allowedStatus].join(', ')}.`);
  }
  checkRefs(where, 'jobRoles', entry.jobRoles, roleIds);
  checkRef(where, 'complexity', entry.complexity, levelIds);
  checkRefs(where, 'industries', entry.industries, industryIds);
  checkRefs(where, 'specializations', entry.specializations, specIds);
}

function checkRefs(where, field, value, valid) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length === 0) { errors.push(`${where}: "${field}" must be a non-empty array.`); return; }
  for (const ref of value) if (!valid.has(ref)) errors.push(`${where}: unknown ${field} reference "${ref}".`);
}
function checkRef(where, field, value, valid) {
  if (value === undefined) return;
  if (!valid.has(value)) errors.push(`${where}: unknown ${field} reference "${value}".`);
}

// Warn on taxonomy entries that no catalogue item uses yet (coverage hint, not an error).
const used = { jobRoles: new Set(), specializations: new Set() };
for (const entry of Array.isArray(catalog) ? catalog : []) {
  (entry?.jobRoles ?? []).forEach((r) => used.jobRoles.add(r));
  (entry?.specializations ?? []).forEach((s) => used.specializations.add(s));
}
for (const role of roleIds) if (!used.jobRoles.has(role)) warnings.push(`No published/draft entries reference job role "${role}".`);
for (const spec of specIds) if (!used.specializations.has(spec)) warnings.push(`No entries reference specialization "${spec}".`);

report();
process.exit(errors.length ? 1 : 0);

function report() {
  for (const w of warnings) console.warn(`warn  ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`error ${e}`);
    console.error(`\nCatalogue validation failed with ${errors.length} error(s).`);
  } else {
    const n = Array.isArray(catalog) ? catalog.length : 0;
    console.log(`Validated ${n} catalogue entries against ${roleIds.size} roles and ${specIds.size} specializations.`);
  }
}

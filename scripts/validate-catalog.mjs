import { readFileSync } from 'node:fs';
const labs = JSON.parse(readFileSync('data/labs.json', 'utf8'));
if (!Array.isArray(labs)) { console.error('data/labs.json must be an array.'); process.exit(1); }
console.log('Validated ' + labs.length + ' lab records.');

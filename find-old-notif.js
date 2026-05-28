import { readFileSync } from 'fs';
const content = readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
const results = [];
lines.forEach((l, i) => {
  const trimmed = l.trim();
  if (trimmed.includes('sub:') || trimmed.includes('unread:')) {
    results.push({ line: i + 1, text: trimmed });
  }
});
console.log(JSON.stringify(results, null, 2));

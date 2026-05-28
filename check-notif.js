import { readFileSync } from 'fs';
const content = readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Find all notification blocks
let inNotifications = false;
let depth = 0;
let startLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('notifications:') && line.includes('[')) {
    inNotifications = true;
    depth = 1;
    startLine = i + 1;
    console.log(`\n=== Notification block starting at line ${startLine} ===`);
  } else if (inNotifications) {
    if (line.includes('[')) depth++;
    if (line.includes(']')) depth--;
    console.log(`${i + 1}: ${line}`);
    if (depth <= 0) {
      inNotifications = false;
    }
  }
}

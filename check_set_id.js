import fs from 'fs';

const files = [
  'src/App.tsx',
  'src/pages/Submit.tsx',
  'src/pages/Leaderboard.tsx',
  'src/components/Navbar.tsx',
  'src/context/Web3Context.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    console.log(`=== Matches in ${file} ===`);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('setParserRequestId')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
}

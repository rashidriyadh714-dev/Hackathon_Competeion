const fs = require('fs');
const files = [
  'artifacts/actionlayer-mobile/app/(tabs)/index.tsx',
  'artifacts/actionlayer-mobile/app/(tabs)/agents.tsx',
  'artifacts/actionlayer-mobile/app/(tabs)/capture.tsx',
  'artifacts/actionlayer-mobile/app/(tabs)/profile.tsx',
  'artifacts/actionlayer-mobile/app/agent/[id].tsx',
  'artifacts/actionlayer-mobile/app/review/[id].tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Add import BlurView if not exists
  if (!content.includes("import { BlurView }")) {
    content = content.replace("import { View", "import { View\n}\nimport { BlurView } from 'expo-blur';\n//");
  }
  
  // This is too complex for regex.
}

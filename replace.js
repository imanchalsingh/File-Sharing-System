const fs = require('fs');
const files = [
  'client/src/components/Share/SharePage.tsx',
  'client/src/components/Home/Webhooks.tsx',
  'client/src/components/Home/ShareModal.tsx',
  'client/src/components/Home/ShareManager.tsx',
  'client/src/components/Home/MyFiles.tsx',
  'client/src/components/Home/Settings.tsx',
  'client/src/components/Home/Favorites.tsx',
  'client/src/components/Authentication/Login.tsx',
  'client/src/components/Authentication/Register.tsx',
  'client/src/components/SharedFileAccess.tsx'
];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import\s+\{\s*toast\s*\}\s+from\s+["']react-toastify["'];/g, 'import { notify as toast } from "@/services/toastService";');
    fs.writeFileSync(file, content);
  } catch(err) {
    console.error("Failed on " + file);
  }
}
console.log('Replaced successfully');

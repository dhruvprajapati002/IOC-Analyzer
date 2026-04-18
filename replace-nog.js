const fs = require('fs');
const path = require('path');
function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
}
const files = walkSync('src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('@design-pattern/NoGraphData')) {
    content = content.replace(/import.*?['"]@design-pattern\/NoGraphData['"];?/g, 'import { NoGraphData } from "@/components/NoGraphData";');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
  }
});

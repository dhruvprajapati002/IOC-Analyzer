const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = [];

// Manually read all files to circumvent glob
function walkStrings(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkStrings(fullPath);
        } else {
            if (fullPath.match(/\.(ts|tsx|js|jsx)$/)) {
                files.push(fullPath);
            }
        }
    }
}
walkStrings('src');
walkStrings('design-wrapper-component');

const appColorsMap = {
  background: 'var(--background)',
  surface: 'var(--surface)',
  surfaceHover: 'var(--surface-hover)',
  border: 'var(--border)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  primary: 'var(--primary)',
  success: 'var(--success)',
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--info)',
  accentPurple: 'var(--accent-purple)',
  chartBlue: 'var(--chart-blue)',
  chartTeal: 'var(--chart-teal)',
  chartPurple: 'var(--chart-purple)',
};

const sidebarColorsMap = {
  background: 'var(--sidebar-background)',
  surface: 'var(--sidebar-surface)',
  activeBg: 'var(--sidebar-active-bg)',
  textPrimary: 'var(--sidebar-text-primary)',
  textSecondary: 'var(--sidebar-text-secondary)',
  border: 'var(--sidebar-border)',
  primary: 'var(--sidebar-primary)',
  danger: 'var(--sidebar-danger)',
  dangerBg: 'var(--sidebar-danger-bg)',
};

for (const file of files) {
  if (file.endsWith('colors.ts') || file.endsWith('colors.js')) continue;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  let needsImport = false;

  for (const [key, cssVar] of Object.entries(appColorsMap)) {
    const rx1 = new RegExp('\"' + cssVar + '\"', 'g');
    const rx2 = new RegExp('\'' + cssVar + '\'', 'g');
    const rx3 = new RegExp('\' + cssVar + '\', 'g');
    if (rx1.test(content) || rx2.test(content) || rx3.test(content)) {
      content = content.replace(rx1, 'APP_COLORS.' + key);
      content = content.replace(rx2, 'APP_COLORS.' + key);
      content = content.replace(rx3, 'APP_COLORS.' + key);
      changed = true;
      needsImport = true;
    }
  }

  for (const [key, cssVar] of Object.entries(sidebarColorsMap)) {
    const rx1 = new RegExp('\"' + cssVar + '\"', 'g');
    const rx2 = new RegExp('\'' + cssVar + '\'', 'g');
    const rx3 = new RegExp('\' + cssVar + '\', 'g');
    if (rx1.test(content) || rx2.test(content) || rx3.test(content)) {
      content = content.replace(rx1, 'APP_COLORS.' + key); // using APP_COLORS
      content = content.replace(rx2, 'APP_COLORS.' + key);
      content = content.replace(rx3, 'APP_COLORS.' + key);
      changed = true;
      needsImport = true;
    }
  }

  // Handle remaining cssVars that weren't quoted but inside objects, although they shouldn't exist 
  // Let's replace sidebarColors.\* with APP_COLORS.\*
  if (/sidebarColors\./.test(content) || /DEFAULT_COLORS\./.test(content)) {
      content = content.replace(/sidebarColors\./g, 'APP_COLORS.');
      content = content.replace(/DEFAULT_COLORS\./g, 'APP_COLORS.');
      changed = true;
      needsImport = true;
  }

  if (needsImport && !content.includes('import { APP_COLORS }')) {
      content = \"import { APP_COLORS } from '@/lib/colors';\\n\" + content;
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
}
console.log('Reverted to APP_COLORS');

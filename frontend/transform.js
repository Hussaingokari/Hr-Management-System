const fs = require('fs');
const path = require('path');

const dirsToProcess = [
  path.join('d:', 'Hr-Management-System', 'frontend', 'src', 'app', 'admin'),
  path.join('d:', 'Hr-Management-System', 'frontend', 'src', 'app', 'employee')
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Dark Mode backgrounds -> var(--card-bg)
      const bgColorMap = {
        "'#1e293b'": "'var(--card-bg)'",
        "'#1E293B'": "'var(--card-bg)'",
        "'white'": "'var(--card-bg)'",
        "'#ffffff'": "'var(--card-bg)'",
        "'#F8FAFC'": "'var(--bg-primary)'",
        "'#f8fafc'": "'var(--bg-primary)'",
        "'#0B1120'": "'var(--bg-primary)'",
        "'#0b1120'": "'var(--bg-primary)'",
        "'#020617'": "'var(--bg-secondary)'",
        "'#020617'": "'var(--bg-secondary)'",
      };

      for (const [key, value] of Object.entries(bgColorMap)) {
        if (content.includes(key)) {
          const safeKey = key.replace(/'/g, "\\'");
          const regex1 = new RegExp(`background:\\s*${safeKey}`, 'g');
          if (regex1.test(content)) {
            content = content.replace(regex1, `background: ${value}`);
            modified = true;
          }
          const regex2 = new RegExp(`backgroundColor:\\s*${safeKey}`, 'g');
          if (regex2.test(content)) {
            content = content.replace(regex2, `backgroundColor: ${value}`);
            modified = true;
          }
        }
      }

      // Text colors -> var(--text-primary) or var(--text-secondary)
      const textColorMap = {
        "'#F8FAFC'": "'var(--text-primary)'",
        "'#f8fafc'": "'var(--text-primary)'",
        "'#1e293b'": "'var(--text-primary)'",
        "'#1E293B'": "'var(--text-primary)'",
        "'#64748B'": "'var(--text-secondary)'",
        "'#64748b'": "'var(--text-secondary)'",
        "'#475569'": "'var(--text-secondary)'",
        "'#94a3b8'": "'var(--text-muted)'",
        "'#94A3B8'": "'var(--text-muted)'",
      };

      for (const [key, value] of Object.entries(textColorMap)) {
        if (content.includes(key)) {
          const safeKey = key.replace(/'/g, "\\'");
          const regex = new RegExp(`color:\\s*${safeKey}`, 'g');
          if (regex.test(content)) {
            content = content.replace(regex, `color: ${value}`);
            modified = true;
          }
        }
      }

      // Border colors & dividers -> var(--card-border)
      const borderColorMap = {
        "'#e2e8f0'": "'var(--card-border)'",
        "'#334155'": "'var(--card-border)'",
        "'1px solid #e2e8f0'": "'1px solid var(--card-border)'",
        "'1px solid #334155'": "'1px solid var(--card-border)'",
        "'rgba(255,255,255,0.08)'": "'var(--card-border)'",
        "'rgba(255, 255, 255, 0.08)'": "'var(--card-border)'"
      };

      for (const [key, value] of Object.entries(borderColorMap)) {
        if (content.includes(key)) {
          let safeKey = key.split('(').join('\\(').split(')').join('\\)').replace(/'/g, "\\'");
          const regex = new RegExp(`border:\\s*${safeKey}|borderBottom:\\s*${safeKey}|borderTop:\\s*${safeKey}|background:\\s*${safeKey}`, 'g');
          if (regex.test(content)) {
            content = content.replace(regex, (match) => {
               if(match.startsWith('border:')) return `border: ${value}`;
               if(match.startsWith('borderBottom:')) return `borderBottom: ${value}`;
               if(match.startsWith('borderTop:')) return `borderTop: ${value}`;
               if(match.startsWith('background:')) return `background: ${value}`;
               return match;
            });
            modified = true;
          }
          
          const regex2 = new RegExp(`borderColor:\\s*${safeKey}`, 'g');
          if (regex2.test(content)) {
            content = content.replace(regex2, `borderColor: ${value}`);
            modified = true;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of dirsToProcess) {
  processDirectory(dir);
}

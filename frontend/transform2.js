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
      let originalContent = content;

      // BACKGROUNDS & BORDERS mapping
      const bgMap = {
        '#0B1120': 'var(--bg-primary)',
        '#020617': 'var(--bg-secondary)',
        '#1E293B': 'var(--card-bg)',
        '#0F172A': 'var(--card-bg)',
        '#FFFFFF': 'var(--card-bg)',
        '#F8FAFC': 'var(--bg-primary)',
        'white': 'var(--card-bg)'
      };

      const borderMap = {
        '#EEF0F5': 'var(--card-border)',
        '#E5E7EB': 'var(--card-border)',
        '#E2E8F0': 'var(--card-border)',
        '#F1F5F9': 'var(--card-border)',
        '#334155': 'var(--card-border)',
        '#374151': 'var(--card-border)'
      };

      const textMap = {
        '#1E293B': 'var(--text-primary)',
        '#F8FAFC': 'var(--text-primary)',
        '#475569': 'var(--text-secondary)',
        '#64748B': 'var(--text-secondary)',
        '#9CA3AF': 'var(--text-muted)',
        '#94A3B8': 'var(--text-muted)',
        '#CBD5E1': 'var(--text-muted)'
      };

      // Helper to do case-insensitive hex replacement for a specific CSS property
      function replaceProp(prop, map) {
        for (const [hex, variable] of Object.entries(map)) {
          // regex to match: property: 'hex' OR property: hex OR property: "#hex"
          // We need to match it regardless of quotes.
          // Example: background: '#1E293B' or background: #1E293B or backgroundColor: "#1e293b"
          // Prop can be background, backgroundColor, border, etc.
          
          // Regex breakdown:
          // prop + \s*:\s* + optional quote + hex + optional quote
          const escapedHex = hex === 'white' ? 'white' : hex;
          
          // Using a replacer function to avoid replacing partial strings inside larger strings.
          // But actually, CSS hex codes are usually distinct.
          
          // Create regex for the prop and hex
          // e.g. /(background(?:Color)?\s*:\s*['"]?)(#1e293b)(['"]?)/gi
          let regexStr;
          if (prop === 'background') {
            regexStr = `(background(?:Color)?\\s*:\\s*['"]?)(${escapedHex})(['"]?)`;
          } else if (prop === 'border') {
            regexStr = `(border(?:Bottom|Top|Left|Right|Color)?\\s*:\\s*[^;,'"]*?['"]?)(${escapedHex})(['"]?)`;
          } else if (prop === 'color') {
            // also text-fill-color
            regexStr = `((?:color|-webkit-text-fill-color)\\s*:\\s*['"]?)(${escapedHex})(['"]?)`;
          }
          
          const regex = new RegExp(regexStr, 'gi');
          content = content.replace(regex, `$1${variable}$3`);
        }
      }

      replaceProp('background', bgMap);
      replaceProp('border', borderMap);
      // Wait, some borders might use the bg map colors (like 1px solid #1E293B) and backgrounds might use border colors.
      // Let's just run them against the combined maps for borders and backgrounds!
      
      const layoutColors = { ...bgMap, ...borderMap };
      replaceProp('background', layoutColors);
      replaceProp('border', layoutColors);
      
      replaceProp('color', textMap);

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of dirsToProcess) {
  processDirectory(dir);
}

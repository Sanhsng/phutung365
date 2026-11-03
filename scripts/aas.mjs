import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const agentsSkillsDir = path.join(rootDir, '.agents', 'skills');
const catalogPath = path.join(rootDir, '.agents', 'CATALOG.md');

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function listInstalled() {
  if (!fs.existsSync(agentsSkillsDir)) {
    console.log('Chưa có skill nào được cài đặt trong .agents/skills.');
    return;
  }
  const entries = fs.readdirSync(agentsSkillsDir, { withFileTypes: true });
  const skills = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  console.log(`\n=== ĐÃ CÀI ĐẶT (${skills.length} skills trong .agents/skills) ===\n`);
  for (const s of skills) {
    const skillMd = path.join(agentsSkillsDir, s, 'SKILL.md');
    let desc = '';
    if (fs.existsSync(skillMd)) {
      const content = fs.readFileSync(skillMd, 'utf8');
      const descMatch = content.match(/description:\s*["']?([^"'\n]+)/i);
      if (descMatch) desc = descMatch[1].trim();
    }
    console.log(`- ${s.padEnd(32)} : ${desc}`);
  }
  console.log('\n');
}

async function searchCatalog(query) {
  if (!query) {
    console.log('Vui lòng nhập từ khóa tìm kiếm: node scripts/aas.mjs search <từ khóa>');
    return;
  }
  if (!fs.existsSync(catalogPath)) {
    console.log('Không tìm thấy file CATALOG.md tại .agents/CATALOG.md');
    return;
  }
  const content = fs.readFileSync(catalogPath, 'utf8');
  const lines = content.split('\n');
  const regex = new RegExp(query, 'i');
  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('|') && regex.test(line)) {
      matches.push(line.trim());
    }
  }

  console.log(`\n=== KẾT QUẢ TÌM KIẾM CHO "${query}" (${matches.length} kết quả) ===\n`);
  for (const m of matches.slice(0, 30)) {
    console.log(m);
  }
  if (matches.length > 30) {
    console.log(`\n... và còn ${matches.length - 30} kết quả khác. Vui lòng thu hẹp từ khóa.`);
  }
  console.log('\nĐể cài thêm skill, dùng lệnh: node scripts/aas.mjs add <tên-skill>\n');
}

async function addSkill(skillName) {
  if (!skillName) {
    console.log('Vui lòng chỉ định tên skill: node scripts/aas.mjs add <tên-skill>');
    return;
  }
  const targetDir = path.join(agentsSkillsDir, skillName);
  if (fs.existsSync(targetDir)) {
    console.log(`Skill "${skillName}" đã tồn tại trong .agents/skills/${skillName}`);
    return;
  }

  console.log(`Đang tải skill "${skillName}" từ Agentic Awesome Skills repository...`);
  const rawUrl = `https://raw.githubusercontent.com/sickn33/agentic-awesome-skills/main/skills/${encodeURIComponent(skillName)}/SKILL.md`;

  try {
    const res = await fetch(rawUrl);
    if (!res.ok) {
      throw new Error(`Không tìm thấy skill trên GitHub (HTTP ${res.status}). Hãy kiểm tra lại tên skill.`);
    }
    const content = await res.text();
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'SKILL.md'), content, 'utf8');
    console.log(`Đã cài đặt thành công skill "${skillName}" vào .agents/skills/${skillName}/SKILL.md!`);
  } catch (err) {
    console.error(`Lỗi khi cài đặt skill: ${err.message}`);
  }
}

switch (command) {
  case 'list':
  case 'ls':
    listInstalled();
    break;
  case 'search':
  case 'find':
    searchCatalog(args[1]);
    break;
  case 'add':
  case 'install':
    addSkill(args[1]);
    break;
  default:
    console.log(`
Agentic Awesome Skills CLI (dành cho project webapp phụ tùng)

Cách dùng:
  node scripts/aas.mjs list             Liệt kê các skill đã cài đặt
  node scripts/aas.mjs search <query>   Tìm kiếm trong thư viện 2,884+ skills
  node scripts/aas.mjs add <skill-name> Cài đặt thêm skill mới vào .agents/skills/
`);
    break;
}

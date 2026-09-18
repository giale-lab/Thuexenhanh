const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('{activeTab === "landing"'));
const end = lines.findIndex(l => l.includes('{showLocationPopup'));
console.log(lines.slice(start, end).join('\n'));

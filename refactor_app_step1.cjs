
const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
const mainStart = code.indexOf('<main');
const mainEnd = code.indexOf('</main>');
console.log(code.substring(mainStart, mainEnd + 7));

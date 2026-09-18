const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add Routes, Route, useParams, Navigate imports
if (!code.includes('Routes, Route')) {
  code = code.replace(
    /import \{ useMemo, useState, useEffect, useRef \} from "react";/,
    `import { useMemo, useState, useEffect, useRef } from "react";\nimport { Routes, Route, useParams, Navigate } from "react-router-dom";`
  );
}

// 2. We need a wrapper for AddCarForm to read ID from URL. Let's insert it before `function App()`
const wrapperCode = `
const EditCarRoute = ({ cars, currentUser, onSave, onCancel }) => {
  const { id } = useParams();
  const editingCar = id ? cars.find(c => c.id === id) : null;
  return <AddCarForm editingCar={editingCar} currentUser={currentUser} onSave={onSave} onCancel={onCancel} />;
};
`;
if (!code.includes('const EditCarRoute')) {
  code = code.replace('function App() {', wrapperCode + '\nfunction App() {');
}

// 3. Remove activeTab logic and editingId logic
// They are around lines 100-130
// I will just comment them out so they don't cause errors, or just let them be (they are harmless if unused).
// Actually, activeTab is used in the footer and tabs! We need to keep activeTab for highlighting!
// BUT we should update activeTab to check for /sua-xe/:id

code = code.replace(
  `if (location.pathname === '/dang-xe') return 'add';`,
  `if (location.pathname === '/dang-xe' || location.pathname.startsWith('/sua-xe/')) return 'add';`
);

// 4. Replace the main conditional rendering with <Routes>
// We'll find the start of the landing page block and the end of the admin block

const startTag = `{activeTab === "landing" && (`;
const endTag = `        <ErrorBoundary>\r\n          <AdminDashboard`; // Wait, this might be tricky.

// Let's use a more robust replacement by replacing the entire `main` content.
// `App.jsx` has `<main style={{ flex: 1, position: 'relative' }}>` or something similar?
// Let's print the `<main>` tag to see.

fs.writeFileSync('refactor_app_step1.cjs', `
const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
const mainStart = code.indexOf('<main');
const mainEnd = code.indexOf('</main>');
console.log(code.substring(mainStart, mainEnd + 7));
`);

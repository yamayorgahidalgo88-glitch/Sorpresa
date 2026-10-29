// Añade manifest e iconos a dist/index.html para poder instalar la web como app.
const fs = require('fs');
const f = 'dist/index.html';
let h = fs.readFileSync(f, 'utf8');
const tags = '<link rel="manifest" href="/manifest.json"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#3486F0"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Calendario Docente">';
if (!h.includes('manifest.json')) h = h.replace('</head>', tags + '</head>');
fs.writeFileSync(f, h);

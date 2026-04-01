const b = require('bcryptjs');
b.hash('Visiacap2026#', 10).then(h => { console.log(h); process.exit(0); });

// Laptop mode: run the game on a booth laptop; iPads and screens connect over Wi-Fi.
// (On Vercel the same app runs from api/index.js instead.)
const express = require('express');
const path = require('path');
const { app, store, loadWorld, buildWorkbook, deviceLinks, lanIps, setOnDbSaved } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const XLSX_FILE = path.join(process.env.DATA_DIR || path.join(__dirname, 'data'), 'Roadshow Results.xlsx');

// Keep an up-to-date Excel copy on the laptop after every result.
let excelTimer = null;
function writeExcel(W) {
    clearTimeout(excelTimer);
    excelTimer = setTimeout(async () => {
        try {
            await (await buildWorkbook(W)).xlsx.writeFile(XLSX_FILE);
        } catch (err) {
            console.warn(`Could not update "${path.basename(XLSX_FILE)}" (${err.code || err.message}). Close it in Excel; it refreshes on the next result.`);
        }
    }, 800);
}
if (store.kind === 'file') setOnDbSaved(writeExcel);

const server = express();
server.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
server.use(app);

server.listen(PORT, '0.0.0.0', async () => {
    const W = await loadWorld();
    const host = lanIps()[0] || 'localhost';
    const line = '─'.repeat(66);
    console.log(`\n${line}\n  Compliance Roadshow Games is running (${store.kind === 'redis' ? 'Redis' : 'local files'})\n${line}`);
    for (const l of deviceLinks(W, `http://${host}:${PORT}`)) console.log(`  ${l.label.padEnd(20)} ${l.url}`);
    console.log(`  ${'Admin panel'.padEnd(20)} http://${host}:${PORT}/admin.html   (PIN ${W.config.settings.adminPin})`);
    if (store.kind === 'file') console.log(`  ${'Excel file (auto)'.padEnd(20)} ${XLSX_FILE}`);
    console.log(`${line}\n`);
    if (store.kind === 'file') writeExcel(W);
});

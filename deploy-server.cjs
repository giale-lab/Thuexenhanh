const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 9999;
const DIR = __dirname;
let clients = [];

function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  clients = clients.filter(r => { try { r.write(msg); return true; } catch { return false; } });
}

function runCmd(cmd) {
  return new Promise(resolve => {
    broadcast({ type: 'log', text: `$ ${cmd}`, color: 'dim' });
    const p = spawn('cmd', ['/c', cmd], { cwd: DIR, shell: true });
    p.stdout.on('data', d => d.toString().split('\n').forEach(l => l.trim() && broadcast({ type: 'log', text: l })));
    p.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && broadcast({ type: 'log', text: l, color: 'err' })));
    p.on('close', code => resolve(code));
  });
}

async function pipeline(action, steps) {
  broadcast({ type: 'start', action, steps: steps.map(s => ({ id: s.id, label: s.label })) });
  for (const s of steps) {
    broadcast({ type: 'step', id: s.id, state: 'running' });
    broadcast({ type: 'log', text: `\n── ${s.label}`, color: 'yellow' });
    const t = Date.now();
    const code = await s.run();
    const elapsed = ((Date.now() - t) / 1000).toFixed(1);
    if (code !== 0) {
      broadcast({ type: 'step', id: s.id, state: 'fail', elapsed });
      broadcast({ type: 'done', code: 1 });
      return false;
    }
    broadcast({ type: 'step', id: s.id, state: 'ok', elapsed });
  }
  broadcast({ type: 'done', code: 0 });
  return true;
}

function getGitInfo(cb) {
  exec('git log -5 --pretty=format:"%h|%s|%ar" && echo ---BRANCH--- && git branch --show-current && echo ---CHANGED--- && git status --short', { cwd: DIR }, (e, out) => {
    const [logs, rest] = out.split('---BRANCH---');
    const [branchRaw, changedRaw] = (rest || '').split('---CHANGED---');
    cb({
      branch: (branchRaw || '').trim(),
      changed: (changedRaw || '').trim().split('\n').filter(l => l.trim()).length,
      logs: (logs || '').trim().split('\n').filter(l => l).map(l => {
        const [h, m, t] = l.split('|'); return { h: (h||'').trim(), m: (m||'').trim(), t: (t||'').trim() };
      })
    });
  });
}

const HTML = fs.readFileSync(path.join(DIR, 'deploy-ui.html'), 'utf8');

http.createServer((req, res) => {
  const ok = { 'Access-Control-Allow-Origin': '*' };

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(HTML);

  } else if (req.url === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', ...ok });
    clients.push(res);
    req.on('close', () => { clients = clients.filter(c => c !== res); });

  } else if (req.url === '/git-info') {
    getGitInfo(d => { res.writeHead(200, { 'Content-Type': 'application/json', ...ok }); res.end(JSON.stringify(d)); });

  } else if (req.url === '/action/test') {
    res.writeHead(200, ok); res.end('ok');
    // Just open a new CMD window with npm run dev — simple and reliable
    exec(`start cmd /k "cd /d "${DIR}" && npm run dev"`);
    broadcast({ type: 'log', text: '⚡ Đã mở cửa sổ Test. Xem trình duyệt tại http://localhost:5173', color: 'ok' });

  } else if (req.url === '/action/dev') {
    const body = [];
    req.on('data', c => body.push(c));
    req.on('end', async () => {
      const { msg } = JSON.parse(Buffer.concat(body).toString() || '{}');
      res.writeHead(200, ok); res.end('ok');
      const commitMsg = (msg || '').trim() || 'Cap nhat tinh nang';
      await pipeline('dev', [
        { id: 'build',  label: 'Build & kiểm tra lỗi',         run: () => runCmd('npm run build') },
        { id: 'commit', label: 'Lưu thay đổi (git commit)',     run: () => runCmd(`git add . && git commit -m "${commitMsg}"`) },
        { id: 'push',   label: 'Đẩy lên nhánh Dev',            run: () => runCmd('git push origin dev') },
      ]);
    });

  } else if (req.url === '/action/main') {
    req.on('data', () => {});
    req.on('end', async () => {
      res.writeHead(200, ok); res.end('ok');
      await pipeline('main', [
        { id: 'build', label: 'Build & kiểm tra lỗi lần cuối', run: () => runCmd('npm run build') },
        { id: 'merge', label: 'Gộp Dev → Main (git merge)',     run: () => runCmd('git checkout main && git merge dev') },
        { id: 'push',  label: 'Đẩy lên Main — bản chính thức', run: () => runCmd('git push origin main && git checkout dev') },
      ]);
    });

  } else { res.writeHead(404); res.end(); }

}).listen(PORT, () => {
  console.log(`Deploy UI: http://localhost:${PORT}`);
  exec(`start http://localhost:${PORT}`);
});

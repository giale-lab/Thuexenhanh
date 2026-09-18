const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 9999;
const DIR = __dirname;
let clients = [];

function broadcast(data) {
  if (data.text) data.text = stripAnsi(data.text);
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  clients = clients.filter(r => { try { r.write(msg); return true; } catch { return false; } });
}

function stripAnsi(str) {
  return str.replace(/\x1B(?:\[[0-?]*[ -/]*[@-~])/g, '');
}

function runCmd(cmd) {
  return new Promise(resolve => {
    broadcast({ type: 'log', text: `$ ${cmd}`, color: 'dim' });
    const p = spawn('cmd', ['/c', cmd], { cwd: DIR, shell: true });
    p.stdout.on('data', d => d.toString().split('\n').forEach(l => l.trim() && broadcast({ type: 'log', text: l })));
    p.stderr.on('data', d => d.toString().split('\n').forEach(l => {
      const txt = l.trim();
      if (!txt) return;
      if (txt.includes('LF will be replaced by CRLF') || txt.includes('warning: in the working copy')) return;
      if (txt.startsWith('To https://github.com') || txt.match(/^[a-f0-9]+\.\.[a-f0-9]+/)) {
        broadcast({ type: 'log', text: txt, color: 'dim' });
      } else {
        broadcast({ type: 'log', text: txt, color: 'err' });
      }
    }));
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

function getProjectStats() {
  const stats = { totalFiles: 0, totalLines: 0, reactModules: 0, cssFiles: 0, jsFiles: 0, moduleNames: [] };
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (['node_modules', 'dist', 'dist-offline', '.git', '.firebase'].includes(f)) continue;
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        stats.totalFiles++;
        if (f.endsWith('.jsx')) { stats.reactModules++; stats.moduleNames.push(f); }
        else if (f.endsWith('.css')) stats.cssFiles++;
        else if (f.endsWith('.js') || f.endsWith('.cjs')) stats.jsFiles++;
        
        if (f.match(/\.(js|jsx|css|html|json|md)$/)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          stats.totalLines += content.split('\n').length;
        }
      }
    }
  }
  try { walk(DIR); } catch(e){}
  return stats;
}

function getGitInfo(cb) {
  exec('git log -5 --pretty=format:"%h|%s|%ar" && echo ---BRANCH--- && git branch --show-current && echo ---CHANGED--- && git status --short && echo ---STAT--- && git diff HEAD --shortstat && echo ---NUMSTAT--- && git diff HEAD --numstat', { cwd: DIR }, (e, out) => {
    const parts = out.split('---BRANCH---');
    const logsRaw = parts[0];
    const rest = parts[1] || '';
    const [branchRaw, changedRest] = rest.split('---CHANGED---');
    const [changedRaw, statRest] = (changedRest || '').split('---STAT---');
    const [statRaw, numstatRaw] = (statRest || '').split('---NUMSTAT---');
    
    const changedLines = (changedRaw || '').trim().split('\n').filter(l => l.trim());
    const changesList = changedLines.map(l => {
      const type = l.substring(0, 2).trim();
      const file = l.substring(2).trim();
      return { type, file };
    });

    const numstats = {};
    (numstatRaw || '').trim().split('\n').forEach(l => {
      const parts = l.trim().split(/\s+/);
      if (parts.length >= 3) {
        numstats[parts[2]] = { ins: parts[0], del: parts[1] };
      }
    });

    const pStats = getProjectStats();
    
    const updatedModulesDetailed = changesList
      .filter(f => f.file.endsWith('.jsx') || f.file.endsWith('.js') || f.file.endsWith('.css'))
      .map(f => {
        const ns = numstats[f.file] || { ins: '0', del: '0' };
        return {
          name: path.basename(f.file),
          path: f.file,
          type: f.type,
          ins: ns.ins,
          del: ns.del
        };
      });

    cb({
      branch: (branchRaw || '').trim(),
      changedCount: changedLines.length,
      changesList: changesList,
      stat: (statRaw || '').trim() || 'No line changes',
      pStats,
      updatedModulesDetailed,
      logs: (logsRaw || '').trim().split('\n').filter(l => l).map(l => {
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
    (async () => {
      await pipeline('test', [
        { 
          id: 'check', 
          label: 'Linting modules & syntax', 
          run: () => new Promise(resolve => {
            const p = spawn('cmd', ['/c', 'npm run build'], { cwd: DIR, shell: true });
            let errText = '';
            p.stdout.on('data', d => d.toString().split('\n').forEach(l => l.trim() && broadcast({ type: 'log', text: l })));
            p.stderr.on('data', d => {
              const str = d.toString();
              errText += str;
              str.split('\n').forEach(l => l.trim() && broadcast({ type: 'log', text: l, color: 'err' }));
            });
            p.on('close', code => {
              if (code !== 0) {
                broadcast({ type: 'log', text: '\n⚠️ CODE ERRORS DETECTED! Please copy the following and send it to me (AI) for a fix:', color: 'err' });
                const prompt = `I encountered errors during build check, please help me fix it. Error details:\n\`\`\`\n${errText.trim().substring(0, 1500)}\n\`\`\``;
                broadcast({ type: 'log', text: prompt, color: 'yellow' });
              } else {
                broadcast({ type: 'log', text: '\n✅ Code is clean, no module or syntax errors detected!', color: 'ok' });
              }
              resolve(code);
            });
          })
        }
      ]);
    })();

  } else if (req.url === '/action/dev') {
    const body = [];
    req.on('data', c => body.push(c));
    req.on('end', async () => {
      const { msg } = JSON.parse(Buffer.concat(body).toString() || '{}');
      res.writeHead(200, ok); res.end('ok');
      const commitMsg = (msg || '').trim() || 'Update features';
      await pipeline('dev', [
        { id: 'build',  label: 'Build & check errors',         run: () => runCmd('npm run build') },
        { id: 'commit', label: 'Save changes (git commit)',     run: () => runCmd(`git add . && git commit -m "${commitMsg}"`) },
        { id: 'push',   label: 'Push to Dev branch',            run: () => runCmd('git push origin dev') },
      ]);
    });

  } else if (req.url === '/action/main') {
    req.on('data', () => {});
    req.on('end', async () => {
      res.writeHead(200, ok); res.end('ok');
      await pipeline('main', [
        { id: 'build', label: 'Final build & check errors', run: () => runCmd('npm run build') },
        { id: 'merge', label: 'Merge Dev → Main',     run: () => runCmd('git checkout main && git merge dev') },
        { id: 'push',  label: 'Push to Main (Production)', run: () => runCmd('git push origin main && git checkout dev') },
      ]);
    });

  } else { res.writeHead(404); res.end(); }

}).listen(PORT, () => {
  console.log(`Deploy UI: http://localhost:${PORT}`);
  exec(`start http://localhost:${PORT}`);
});

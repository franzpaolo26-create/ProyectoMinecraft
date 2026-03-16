import { exec } from 'child_process';
import { promisify } from 'util';
import express from 'express';
import { query } from './db.js';

const execAsync = promisify(exec);
const router = express.Router();

const RCON_HOST = '127.0.0.1';
const RCON_PORT = '25575';
const RCON_PASS = 'skywars-rcon-2026';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

async function rcon(command) {
  const escaped = command.replace(/"/g, '\\"');
  const { stdout, stderr } = await execAsync(
    `mcrcon -H ${RCON_HOST} -P ${RCON_PORT} -p ${RCON_PASS} "${escaped}"`
  );
  return stdout.trim() || stderr.trim() || 'OK';
}

async function isMinecraftRunning() {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const list = JSON.parse(stdout);
    const mc = list.find(p => p.name === 'minecraft');
    return mc && mc.pm2_env.status === 'online';
  } catch {
    return false;
  }
}

router.use(requireAdmin);

router.get('/server/status', async (req, res) => {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const list = JSON.parse(stdout);
    const mc = list.find(p => p.name === 'minecraft');
    if (!mc) return res.json({ online: false, status: 'not_found' });
    res.json({
      online: mc.pm2_env.status === 'online',
      status: mc.pm2_env.status,
      uptime: mc.pm2_env.pm_uptime,
      restarts: mc.pm2_env.restart_time,
    });
  } catch (e) {
    res.json({ online: false, status: 'error', error: e.message });
  }
});

router.post('/server/start', async (req, res) => {
  try {
    const running = await isMinecraftRunning();
    if (running) return res.json({ message: 'El servidor ya está encendido.' });
    await execAsync('pm2 start minecraft');
    res.json({ message: 'Servidor Minecraft iniciado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/server/stop', async (req, res) => {
  try {
    await rcon('stop');
    res.json({ message: 'Servidor Minecraft detenido.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/server/command', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'command requerido' });
  try {
    const result = await rcon(command);
    res.json({ message: result || 'Comando ejecutado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/server/give', async (req, res) => {
  const { player, item, amount = 1 } = req.body;
  if (!player || !item) return res.status(400).json({ error: 'player e item requeridos' });
  try {
    const result = await rcon(`give ${player} ${item} ${amount}`);
    res.json({ message: result || `Dado ${amount}x ${item} a ${player}.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/server/spawn', async (req, res) => {
  const { player, mob, amount = 1 } = req.body;
  if (!player || !mob) return res.status(400).json({ error: 'player y mob requeridos' });
  try {
    for (let i = 0; i < Math.min(parseInt(amount), 20); i++) {
      await rcon(`execute at ${player} run summon ${mob} ~ ~ ~`);
    }
    res.json({ message: `Spawneado ${amount}x ${mob} en ${player}.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/server/ban', async (req, res) => {
  const { player, reason = 'Baneado por el administrador' } = req.body;
  if (!player) return res.status(400).json({ error: 'player requerido' });
  try {
    const result = await rcon(`ban ${player} ${reason}`);
    res.json({ message: result || `${player} baneado.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const result = await query(`
      SELECT player_name, wins, kills, deaths,
        ROUND(CASE WHEN deaths = 0 THEN kills ELSE kills::numeric / deaths END, 2) AS kd
      FROM player_stats
      ORDER BY wins DESC, kills DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

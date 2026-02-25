package com.skywars.statsaddon;

import bash.reactioner.SkyWarsPlugin;
import bash.reactioner.game.Game;
import bash.reactioner.model.SwPlayer;
import org.bukkit.Bukkit;
import org.bukkit.command.*;
import org.bukkit.entity.Player;
import org.bukkit.event.*;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.*;
import java.io.OutputStream;
import java.net.*;
import java.nio.charset.StandardCharsets;

public class SkyWarsStatsAddon extends JavaPlugin implements Listener {

    private String backendUrl;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        backendUrl = getConfig().getString("backend-url", "http://localhost:3000");
        Bukkit.getPluginManager().registerEvents(this, this);
        Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::sendHeartbeat, 0L, 100L);
        getLogger().info("SkyWarsStatsAddon habilitado → " + backendUrl);
    }

    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player victim = event.getEntity();
        Game game = SkyWarsPlugin.getInstance().getGamesManager().getGameByPlayer(victim);
        if (game == null) return;

        JSONArray items = new JSONArray();
        for (ItemStack item : event.getDrops()) {
            if (item == null) continue;
            JSONObject o = new JSONObject();
            o.put("item", item.getType().name());
            o.put("quantity", item.getAmount());
            items.put(o);
        }
        SwPlayer stats = SkyWarsPlugin.getInstance().getPlayersManager().getStats(victim.getName());
        JSONObject p = new JSONObject();
        p.put("player_uuid", victim.getUniqueId().toString());
        p.put("player_name", victim.getName());
        p.put("killer",      victim.getKiller() != null ? victim.getKiller().getName() : "void");
        p.put("items_lost",  items);
        p.put("game_name",   game.getName());
        p.put("total_kills", stats.getKills());
        p.put("total_deaths",stats.getDeaths());
        p.put("total_wins",  stats.getWins());
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> post("/api/mc/death", p));
    }

    private void sendHeartbeat() {
        JSONArray players = new JSONArray();
        for (Player p : Bukkit.getOnlinePlayers()) {
            JSONObject o = new JSONObject();
            o.put("name", p.getName());
            Game g = SkyWarsPlugin.getInstance().getGamesManager().getGameByPlayer(p);
            o.put("arena", g != null ? g.getName() : "lobby");
            players.put(o);
        }
        JSONObject payload = new JSONObject();
        payload.put("players", players);
        payload.put("arenas",  new JSONArray()); // TODO tarea P-02
        post("/api/mc/heartbeat", payload);
    }

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        if (!sender.hasPermission("skywars.admin")) { sender.sendMessage("§cSin permiso."); return true; }
        switch (cmd.getName().toLowerCase()) {
            case "swareset" -> { SkyWarsPlugin.getInstance().getGamesManager().resetAllArenas(); sender.sendMessage("§a[SW] Arenas reseteadas."); }
            case "swastart" -> sender.sendMessage("§a[SW] TODO tarea P-01");
            case "swastop"  -> sender.sendMessage("§e[SW] TODO tarea P-01");
        }
        return true;
    }

    private void post(String endpoint, JSONObject payload) {
        try {
            HttpURLConnection con = (HttpURLConnection) new URL(backendUrl + endpoint).openConnection();
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Type", "application/json");
            con.setConnectTimeout(3000); con.setReadTimeout(3000); con.setDoOutput(true);
            try (OutputStream os = con.getOutputStream()) { os.write(payload.toString().getBytes(StandardCharsets.UTF_8)); }
            con.getResponseCode();
        } catch (Exception e) { getLogger().warning("Error POST " + endpoint + ": " + e.getMessage()); }
    }
}

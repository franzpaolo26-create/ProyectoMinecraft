package es.servicelmbarcelona.skywars.game;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.entity.Player;

import java.util.*;

public class GameManager {

    private final SkyWarsPlugin plugin;
    private boolean gameRunning = false;
    private final Map<String, Integer> killCount = new HashMap<>();
    private final Set<String> alivePlayers = new HashSet<>();
    private String arenaName;

    public GameManager(SkyWarsPlugin plugin) {
        this.plugin = plugin;
    }

    public boolean isGameRunning() { return gameRunning; }

    public void startGame(String arena) {
        if (gameRunning) return;
        arenaName = arena;
        gameRunning = true;
        killCount.clear();
        alivePlayers.clear();

        for (Player p : Bukkit.getOnlinePlayers()) {
            alivePlayers.add(p.getName());
            killCount.put(p.getName(), 0);
        }

        broadcast(ChatColor.GREEN + "▶ Partida iniciada en " + ChatColor.YELLOW + arena + ChatColor.GREEN + "! Jugadores: " + alivePlayers.size());
        plugin.getLogger().info("[Game] Partida iniciada en " + arena + " con " + alivePlayers.size() + " jugadores.");
    }

    public void registerKill(String killer) {
        if (!gameRunning || killer == null) return;
        killCount.merge(killer, 1, Integer::sum);
    }

    public void registerDeath(String player) {
        if (!gameRunning) return;
        alivePlayers.remove(player);
        broadcast(ChatColor.RED + "☠ " + player + " ha sido eliminado. Quedan: " + ChatColor.YELLOW + alivePlayers.size());

        int minPlayers = plugin.getConfig().getInt("game.min-players", 2);
        boolean autoEnd = plugin.getConfig().getBoolean("game.auto-end-on-last-player", true);

        if (autoEnd && alivePlayers.size() == 1) {
            String winner = alivePlayers.iterator().next();
            endGame(winner);
        } else if (autoEnd && alivePlayers.isEmpty()) {
            endGame(null);
        }
    }

    public void endGame(String winner) {
        if (!gameRunning) return;
        gameRunning = false;

        List<Map<String, Object>> topKillers = getTopKillers();

        if (winner != null) {
            broadcast(ChatColor.GOLD + "🏆 ¡" + winner + " ha ganado la partida en " + arenaName + "!");
        } else {
            broadcast(ChatColor.GRAY + "La partida ha terminado sin ganador.");
        }

        plugin.getBackendClient().sendMatchEnd(arenaName, winner, topKillers);
        plugin.getLogger().info("[Game] Partida terminada. Ganador: " + winner);

        killCount.clear();
        alivePlayers.clear();
    }

    public void forceEndGame() {
        if (!gameRunning) return;
        gameRunning = false;
        plugin.getBackendClient().sendMatchEnd(
            arenaName != null ? arenaName : "unknown",
            null,
            getTopKillers()
        );
        killCount.clear();
        alivePlayers.clear();
    }

    private List<Map<String, Object>> getTopKillers() {
        List<Map.Entry<String, Integer>> sorted = new ArrayList<>(killCount.entrySet());
        sorted.sort((a, b) -> b.getValue() - a.getValue());

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < Math.min(5, sorted.size()); i++) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("player", sorted.get(i).getKey());
            entry.put("kills", sorted.get(i).getValue());
            result.add(entry);
        }
        return result;
    }

    public Set<String> getAlivePlayers() { return Collections.unmodifiableSet(alivePlayers); }
    public Map<String, Integer> getKillCount() { return Collections.unmodifiableMap(killCount); }
    public String getArenaName() { return arenaName; }

    private void broadcast(String msg) {
        Bukkit.broadcastMessage(ChatColor.DARK_AQUA + "[SkyWars] " + msg);
    }
}

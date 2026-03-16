package es.servicelmbarcelona.skywars.listeners;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

public class PlayerListener implements Listener {

    private final SkyWarsPlugin plugin;
    private static final String LOBBY_WORLD = "lobby";
    private static final double LOBBY_X = 34.0;
    private static final double LOBBY_Y = -40.0;
    private static final double LOBBY_Z = 26.0;

    public PlayerListener(SkyWarsPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        Player p = event.getPlayer();
        event.setJoinMessage(ChatColor.DARK_AQUA + "[SkyWars] " + ChatColor.GREEN + p.getName() + " se ha unido.");
        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            World lobbyWorld = Bukkit.getWorld(LOBBY_WORLD);
            plugin.getLogger().info("[DEBUG] lobbyWorld=" + lobbyWorld + " player=" + p.getName() + " online=" + p.isOnline());
            if (lobbyWorld != null && p.isOnline()) {
                if (p.getName().equalsIgnoreCase("Franzpaolo26") || p.isOp()) {
                    p.setGameMode(GameMode.SPECTATOR);
                } else {
                    p.setGameMode(GameMode.SURVIVAL);
                    p.teleport(new Location(lobbyWorld, LOBBY_X + 0.5, LOBBY_Y, LOBBY_Z + 0.5));
                    p.sendMessage(ChatColor.AQUA + "[SkyWars] Bienvenido al lobby!");
                }
            }
        }, 20L);
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        Player p = event.getPlayer();
        event.setQuitMessage(ChatColor.DARK_AQUA + "[SkyWars] " + ChatColor.RED + p.getName() + " ha salido.");
        if (plugin.getGameManager().isGameRunning()) {
            plugin.getGameManager().registerDeath(p.getName());
        }
    }
}

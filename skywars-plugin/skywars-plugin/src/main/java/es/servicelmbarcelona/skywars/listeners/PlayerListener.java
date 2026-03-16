package es.servicelmbarcelona.skywars.listeners;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import org.bukkit.ChatColor;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

public class PlayerListener implements Listener {

    private final SkyWarsPlugin plugin;

    public PlayerListener(SkyWarsPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        Player p = event.getPlayer();
        event.setJoinMessage(ChatColor.DARK_AQUA + "[SkyWars] " + ChatColor.GREEN + p.getName() + " se ha unido.");

        if (plugin.getGameManager().isGameRunning()) {
            p.sendMessage(ChatColor.YELLOW + "[SkyWars] Hay una partida en curso en " + plugin.getGameManager().getArenaName() + ".");
            p.sendMessage(ChatColor.YELLOW + "Jugadores vivos: " + plugin.getGameManager().getAlivePlayers().size());
        }
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        Player p = event.getPlayer();
        event.setQuitMessage(ChatColor.DARK_AQUA + "[SkyWars] " + ChatColor.RED + p.getName() + " ha salido.");

        // Si hay partida y el jugador estaba vivo, contarlo como muerte
        if (plugin.getGameManager().isGameRunning()) {
            plugin.getGameManager().registerDeath(p.getName());
        }
    }
}

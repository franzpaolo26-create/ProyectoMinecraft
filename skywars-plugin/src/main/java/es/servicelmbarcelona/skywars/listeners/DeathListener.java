package es.servicelmbarcelona.skywars.listeners;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import es.servicelmbarcelona.skywars.game.GameManager;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;

public class DeathListener implements Listener {

    private final SkyWarsPlugin plugin;

    public DeathListener(SkyWarsPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player dead   = event.getEntity();
        Player killer = dead.getKiller();

        String killerName = killer != null ? killer.getName() : null;
        String arenaName  = plugin.getConfig().getString("game.arena-name", "arena_principal");

        GameManager gm = plugin.getGameManager();

        // Siempre enviamos la muerte al backend (aunque no haya partida activa)
        plugin.getBackendClient().sendDeath(
            dead.getUniqueId().toString(),
            dead.getName(),
            killerName,
            gm.isGameRunning() ? gm.getArenaName() : arenaName
        );

        // Si hay partida activa, actualizamos el estado del juego
        if (gm.isGameRunning()) {
            if (killerName != null) {
                gm.registerKill(killerName);
            }
            gm.registerDeath(dead.getName());
        }
    }
}

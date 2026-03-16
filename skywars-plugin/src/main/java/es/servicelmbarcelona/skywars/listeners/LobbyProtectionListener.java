package es.servicelmbarcelona.skywars.listeners;

import org.bukkit.GameMode;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.FoodLevelChangeEvent;
import org.bukkit.event.player.PlayerDropItemEvent;

public class LobbyProtectionListener implements Listener {

    private static final String LOBBY_WORLD = "lobby";

    // Verificamos si el jugador está en el lobby y NO está en creativo
    private boolean isProtected(Player player) {
        return player.getWorld().getName().equalsIgnoreCase(LOBBY_WORLD) 
               && player.getGameMode() != GameMode.CREATIVE;
    }

    @EventHandler
    public void onBlockBreak(BlockBreakEvent event) {
        if (isProtected(event.getPlayer())) event.setCancelled(true);
    }

    @EventHandler
    public void onBlockPlace(BlockPlaceEvent event) {
        if (isProtected(event.getPlayer())) event.setCancelled(true);
    }

    @EventHandler
    public void onEntityDamage(EntityDamageEvent event) {
        if (event.getEntity() instanceof Player) {
            Player player = (Player) event.getEntity();
            if (player.getWorld().getName().equalsIgnoreCase(LOBBY_WORLD)) {
                event.setCancelled(true); // Nadie recibe daño en el lobby
            }
        }
    }

    @EventHandler
    public void onFoodLevelChange(FoodLevelChangeEvent event) {
        if (event.getEntity().getWorld().getName().equalsIgnoreCase(LOBBY_WORLD)) {
            event.setCancelled(true); // Nadie pierde hambre en el lobby
        }
    }

    @EventHandler
    public void onDropItem(PlayerDropItemEvent event) {
        if (isProtected(event.getPlayer())) {
            event.setCancelled(true); // Evitar que tiren basura en el lobby
        }
    }
}

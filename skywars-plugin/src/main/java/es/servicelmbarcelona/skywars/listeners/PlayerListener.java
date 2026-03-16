package es.servicelmbarcelona.skywars.listeners;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import es.servicelmbarcelona.skywars.game.GameManager;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.player.PlayerDropItemEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.SkullMeta;

import java.util.Arrays;

public class PlayerListener implements Listener {

    private final SkyWarsPlugin plugin;

    public PlayerListener(SkyWarsPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player p = event.getPlayer();
        if (!plugin.getGameManager().isGameRunning()) {
            plugin.getGameManager().giveLobbyItems(p);
        }
    }

    @EventHandler
    public void onPlayerInteract(PlayerInteractEvent event) {
        Player p = event.getPlayer();
        if (event.getAction() == Action.RIGHT_CLICK_AIR || event.getAction() == Action.RIGHT_CLICK_BLOCK) {
            ItemStack item = event.getItem();
            if (item == null || !item.hasItemMeta()) return;

            String name = item.getItemMeta().getDisplayName();

            if (name.contains("Menú de SkyWars") && item.getType() == Material.NETHER_STAR) {
                openKitMenu(p);
            }
            if (name.contains("Jugadores Vivos") && item.getType() == Material.COMPASS) {
                openSpectatorMenu(p);
            }
        }
    }

    @EventHandler
    public void onInventoryClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player)) return;
        Player p = (Player) event.getWhoClicked();
        
        ItemStack clicked = event.getCurrentItem();
        if (clicked != null && clicked.hasItemMeta()) {
            String name = clicked.getItemMeta().getDisplayName();
            if (name.contains("Menú de SkyWars") || name.contains("Jugadores Vivos")) {
                event.setCancelled(true);
            }
        }

        String title = event.getView().getTitle();
        if (title.equals(ChatColor.DARK_GRAY + "Selecciona tu Kit")) {
            event.setCancelled(true); 
            if (clicked == null) return;

            if (clicked.getType() == Material.OAK_PLANKS) {
                plugin.getGameManager().setPlayerKit(p.getName(), "constructor");
                p.sendMessage(ChatColor.GREEN + "✔ Has seleccionado el Kit Constructor.");
                p.closeInventory();
                p.playSound(p.getLocation(), org.bukkit.Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 1.0f, 1.0f);
            } else if (clicked.getType() == Material.BOW) {
                plugin.getGameManager().setPlayerKit(p.getName(), "arquero");
                p.sendMessage(ChatColor.GREEN + "✔ Has seleccionado el Kit Arquero.");
                p.closeInventory();
                p.playSound(p.getLocation(), org.bukkit.Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 1.0f, 1.0f);
            } else if (clicked.getType() == Material.IRON_CHESTPLATE) {
                plugin.getGameManager().setPlayerKit(p.getName(), "tanque");
                p.sendMessage(ChatColor.GREEN + "✔ Has seleccionado el Kit Tanque.");
                p.closeInventory();
                p.playSound(p.getLocation(), org.bukkit.Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 1.0f, 1.0f);
            }
        } else if (title.equals(ChatColor.DARK_GRAY + "Teletransporte")) {
            event.setCancelled(true);
            if (clicked != null && clicked.getType() == Material.PLAYER_HEAD) {
                SkullMeta meta = (SkullMeta) clicked.getItemMeta();
                if (meta != null && meta.getOwningPlayer() != null) {
                    Player target = meta.getOwningPlayer().getPlayer();
                    if (target != null && target.isOnline()) {
                        p.teleport(target);
                        p.sendMessage(ChatColor.GREEN + "» Viendo a " + target.getName());
                    }
                }
            }
        }
    }

    @EventHandler
    public void onItemDrop(PlayerDropItemEvent event) {
        ItemStack item = event.getItemDrop().getItemStack();
        if (item.hasItemMeta()) {
            String name = item.getItemMeta().getDisplayName();
            if (name.contains("Menú de SkyWars") || name.contains("Jugadores Vivos")) {
                event.setCancelled(true);
            }
        }
    }

    private void openKitMenu(Player p) {
        Inventory inv = Bukkit.createInventory(null, 27, ChatColor.DARK_GRAY + "Selecciona tu Kit");
        
        // Kit Constructor
        ItemStack constructor = new ItemStack(Material.OAK_PLANKS);
        ItemMeta meta1 = constructor.getItemMeta();
        meta1.setDisplayName(ChatColor.YELLOW + "" + ChatColor.BOLD + "Kit Constructor");
        meta1.setLore(Arrays.asList(ChatColor.GRAY + "Empieza con 64 bloques", ChatColor.GRAY + "y un pico de piedra."));
        constructor.setItemMeta(meta1);
        
        // Kit Arquero
        ItemStack arquero = new ItemStack(Material.BOW);
        ItemMeta meta2 = arquero.getItemMeta();
        meta2.setDisplayName(ChatColor.AQUA + "" + ChatColor.BOLD + "Kit Arquero");
        meta2.setLore(Arrays.asList(ChatColor.GRAY + "Empieza con un arco", ChatColor.GRAY + "y 10 flechas."));
        arquero.setItemMeta(meta2);

        // Kit Tanque
        ItemStack tanque = new ItemStack(Material.IRON_CHESTPLATE);
        ItemMeta meta3 = tanque.getItemMeta();
        meta3.setDisplayName(ChatColor.RED + "" + ChatColor.BOLD + "Kit Tanque");
        meta3.setLore(Arrays.asList(ChatColor.GRAY + "Empieza con una pechera", ChatColor.GRAY + "de hierro equipada."));
        tanque.setItemMeta(meta3);

        inv.setItem(11, constructor);
        inv.setItem(13, arquero);
        inv.setItem(15, tanque);
        
        p.openInventory(inv);
    }

    private void openSpectatorMenu(Player p) {
        Inventory inv = Bukkit.createInventory(null, 54, ChatColor.DARK_GRAY + "Teletransporte");
        GameManager gm = plugin.getGameManager();
        for (String aliveName : gm.getAlivePlayers()) {
            Player alivePlayer = Bukkit.getPlayerExact(aliveName);
            if (alivePlayer != null) {
                ItemStack head = new ItemStack(Material.PLAYER_HEAD);
                SkullMeta meta = (SkullMeta) head.getItemMeta();
                meta.setOwningPlayer(alivePlayer);
                meta.setDisplayName(ChatColor.GREEN + aliveName);
                head.setItemMeta(meta);
                inv.addItem(head);
            }
        }
        p.openInventory(inv);
    }
}

package es.servicelmbarcelona.skywars.game;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import org.bukkit.*;
import org.bukkit.block.BlockState;
import org.bukkit.block.Chest;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.Firework;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.FireworkMeta;
import org.bukkit.scheduler.BukkitRunnable;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.*;

public class GameManager {

    private final SkyWarsPlugin plugin;
    private boolean gameRunning = false;
    private final Map<String, Integer> killCount = new HashMap<>();
    private final Set<String> alivePlayers = new HashSet<>();
    private String arenaName;

    private static final String ADMIN_NAME = "Franzpaolo26";
    private static final String LOBBY_WORLD = "lobby";
    private static final String SW_WORLD = "skywars";

    private static final double[][] ISLANDS = {
        {72.5,  -20.0, 26.5},
        {118.5, -20.0, 72.5},
        {72.5,  -20.0, 118.5},
        {26.5,  -20.0, 72.5},
    };

    private static final double ADMIN_X = 72.0;
    private static final double ADMIN_Y = 48.0;
    private static final double ADMIN_Z = 72.0;
    
    private static final Material[] CHEST_ITEMS = {
        Material.IRON_SWORD, Material.STONE_SWORD, Material.BOW, Material.ARROW,
        Material.DIAMOND, Material.IRON_INGOT, Material.GOLDEN_APPLE, Material.APPLE,
        Material.OAK_PLANKS, Material.COBBLESTONE, Material.SNOWBALL, Material.ENDER_PEARL,
        Material.IRON_CHESTPLATE, Material.IRON_HELMET, Material.IRON_LEGGINGS, Material.IRON_BOOTS,
        Material.COOKED_BEEF, Material.WATER_BUCKET, Material.LAVA_BUCKET
    };

    public GameManager(SkyWarsPlugin plugin) {
        this.plugin = plugin;
    }

    public boolean isGameRunning() { return gameRunning; }
    public String getArenaName() { return arenaName != null ? arenaName : "Arena_Principal"; }
    public Set<String> getAlivePlayers() { return alivePlayers; }
    public Map<String, Integer> getKillCount() { return killCount; }

    public void startGame(String arena) {
        if (gameRunning) return;

        World swWorld = Bukkit.getWorld(SW_WORLD);
        if (swWorld == null) {
            Bukkit.broadcastMessage(ChatColor.RED + "[SkyWars] Error Crítico: Mundo '" + SW_WORLD + "' no encontrado.");
            return;
        }

        this.gameRunning = true;
        this.arenaName = (arena != null) ? arena : "skywars";
        this.killCount.clear();
        this.alivePlayers.clear();

        randomizeChests(swWorld);

        List<Player> participants = new ArrayList<>();
        for (Player p : Bukkit.getOnlinePlayers()) {
            if (!p.getName().equalsIgnoreCase(ADMIN_NAME)) {
                participants.add(p);
            }
        }

        int islandIdx = 0;
        for (Player p : participants) {
            if (islandIdx < ISLANDS.length) {
                double[] coords = ISLANDS[islandIdx++];
                Location spawnLoc = new Location(swWorld, coords[0], coords[1], coords[2]);
                
                p.getInventory().clear();
                p.setGameMode(GameMode.SURVIVAL);
                p.setHealth(20.0);
                p.setFoodLevel(20);
                p.teleport(spawnLoc);
                
                alivePlayers.add(p.getName());
                killCount.put(p.getName(), 0);
                p.sendMessage(ChatColor.GREEN + "✔ ¡Partida Iniciada! Buena suerte.");
            }
        }

        Player admin = Bukkit.getPlayerExact(ADMIN_NAME);
        if (admin != null) {
            admin.teleport(new Location(swWorld, ADMIN_X, ADMIN_Y, ADMIN_Z));
            admin.setGameMode(GameMode.SPECTATOR);
        }

        Bukkit.broadcastMessage(ChatColor.DARK_AQUA + "[SkyWars] Arena '" + arenaName + "' activada.");
    }

    public void registerKill(String killer) {
        if (!gameRunning || killer == null) return;
        killCount.merge(killer, 1, Integer::sum);
    }

    public void registerDeath(String playerName) {
        if (!gameRunning) return;
        
        alivePlayers.remove(playerName);
        Player p = Bukkit.getPlayerExact(playerName);
        
        if (p != null) {
            p.setGameMode(GameMode.SPECTATOR);
            p.sendMessage(ChatColor.RED + "☠ Has sido eliminado de la competencia.");
            plugin.getBackendClient().sendDeath(p.getUniqueId().toString(), p.getName(), null, getArenaName());
        }

        Bukkit.broadcastMessage(ChatColor.YELLOW + "» " + playerName + " ha caído. Quedan " + alivePlayers.size() + " jugadores.");

        if (alivePlayers.size() <= 1) {
            String winner = alivePlayers.isEmpty() ? null : alivePlayers.iterator().next();
            new BukkitRunnable() {
                @Override public void run() { endGame(winner); }
            }.runTaskLater(plugin, 60L);
        }
    }

    public void endGame(String winner) {
        if (!gameRunning) return;
        gameRunning = false;

        if (winner != null) {
            Bukkit.broadcastMessage(ChatColor.GOLD + "★ ¡" + winner + " es el campeón de la partida! ★");
            Player winnerP = Bukkit.getPlayerExact(winner);
            if (winnerP != null) spawnFireworks(winnerP.getLocation(), 10);
        }

        plugin.getBackendClient().sendMatchEnd(getArenaName(), winner, getTopKillers());

        new BukkitRunnable() {
            @Override
            public void run() {
                teleportAllToLobby();
                new BukkitRunnable() {
                    @Override
                    public void run() {
                        World sw = Bukkit.getWorld(SW_WORLD);
                        if (sw != null) Bukkit.unloadWorld(sw, false);
                        resetSkyWarsWorld();
                        new BukkitRunnable() {
                            @Override
                            public void run() {
                                Bukkit.createWorld(new WorldCreator(SW_WORLD));
                                Bukkit.broadcastMessage(ChatColor.AQUA + "[SkyWars] Mapa regenerado para la siguiente partida.");
                            }
                        }.runTaskLater(plugin, 60L);
                    }
                }.runTaskLater(plugin, 40L);
            }
        }.runTaskLater(plugin, 160L); // 8 segundos después del fin
    }

    public void forceEndGame() { endGame(null); }

    // --- LÓGICA DE REGENERACIÓN DE CARPETAS ---
    private void resetSkyWarsWorld() {
        File swDir = new File("/root/minecraft/skywars");
        File tmplDir = new File("/root/minecraft/skywars_template");
        
        if (!tmplDir.exists()) {
            plugin.getLogger().warning("[Game] No existe skywars_template!");
            return;
        }
        
        deleteDir(swDir);
        try {
            copyDir(tmplDir, swDir);
            new File(swDir, "session.lock").delete();
            plugin.getLogger().info("[Game] Mapa skywars restaurado desde plantilla.");
        } catch (IOException e) {
            plugin.getLogger().severe("[Game] Error restaurando mapa: " + e.getMessage());
        }
    }

    private void deleteDir(File dir) {
        if (!dir.exists()) return;
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isDirectory()) deleteDir(f);
                else f.delete();
            }
        }
        dir.delete();
    }

    private void copyDir(File src, File dst) throws IOException {
        if (src.isDirectory()) {
            if (!dst.exists()) dst.mkdirs();
            String[] files = src.list();
            if (files != null) {
                for (String f : files) copyDir(new File(src, f), new File(dst, f));
            }
        } else {
            Files.copy(src.toPath(), dst.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private void teleportAllToLobby() {
        World lobby = Bukkit.getWorld(LOBBY_WORLD);
        if (lobby == null) return;
        Location spawn = new Location(lobby, 34.5, -40.0, 26.5);
        for (Player p : Bukkit.getOnlinePlayers()) {
            p.setGameMode(GameMode.ADVENTURE);
            p.getInventory().clear();
            p.teleport(spawn);
        }
    }

    private void randomizeChests(World world) {
        Random rand = new Random();
        int cX = (int) (ADMIN_X / 16);
        int cZ = (int) (ADMIN_Z / 16);
        for (int x = cX - 8; x <= cX + 8; x++) {
            for (int z = cZ - 8; z <= cZ + 8; z++) {
                world.getChunkAt(x, z).load(true);
            }
        }

        for (org.bukkit.Chunk chunk : world.getLoadedChunks()) {
            for (BlockState state : chunk.getTileEntities()) {
                if (state instanceof Chest) {
                    Inventory inv = ((Chest) state).getInventory();
                    inv.clear();
                    
                    int count = rand.nextInt(5) + 5; 
                    for (int i = 0; i < count; i++) {
                        Material mat = CHEST_ITEMS[rand.nextInt(CHEST_ITEMS.length)];
                        int amount = 1;
                        if (mat == Material.OAK_PLANKS || mat == Material.COBBLESTONE) amount = 32;
                        if (mat == Material.ARROW || mat == Material.SNOWBALL) amount = 12;
                        
                        inv.setItem(rand.nextInt(inv.getSize()), new ItemStack(mat, amount));
                    }
                }
            }
        }
    }

    private void spawnFireworks(Location loc, int amount) {
        new BukkitRunnable() {
            int i = 0;
            @Override public void run() {
                if (i++ >= amount) { this.cancel(); return; }
                Firework fw = (Firework) loc.getWorld().spawnEntity(loc, EntityType.FIREWORK_ROCKET);
                FireworkMeta meta = fw.getFireworkMeta();
                meta.addEffect(FireworkEffect.builder().withColor(Color.GREEN, Color.WHITE).with(FireworkEffect.Type.BALL_LARGE).build());
                meta.setPower(1);
                fw.setFireworkMeta(meta);
            }
        }.runTaskTimer(plugin, 0L, 15L);
    }

    private List<Map<String, Object>> getTopKillers() {
        List<Map<String, Object>> top = new ArrayList<>();
        killCount.entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .limit(5)
            .forEach(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("player", e.getKey());
                m.put("kills", e.getValue());
                top.add(m);
            });
        return top;
    }
}

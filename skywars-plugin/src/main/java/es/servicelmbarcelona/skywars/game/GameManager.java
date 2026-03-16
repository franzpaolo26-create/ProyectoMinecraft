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
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.scoreboard.*;

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
    private final List<Location> activeCages = new ArrayList<>();
    private final Map<String, String> playerKits = new HashMap<>();
    
    // NUEVO: Tarea del temporizador de partida
    private BukkitTask matchTask;
    
    private String arenaName;

    private static final String ADMIN_NAME = "Franzpaolo26";
    private static final String LOBBY_WORLD = "lobby";
    private static final String SW_WORLD = "skywars";

    private static final double[][] ISLANDS = {
        {72.5, -14.0, 20.5}, {19.5, -14.0, 72.5}, {72.5, -11.0, 126.5}, {125.0, -12.0, 73.5}
    };

    private static final double ADMIN_X = 72.0;
    private static final double ADMIN_Y = 48.0;
    private static final double ADMIN_Z = 72.0;
    
    private static final Material[] ISLAND_LOOT = { Material.IRON_SWORD, Material.STONE_SWORD, Material.BOW, Material.ARROW, Material.IRON_INGOT, Material.APPLE, Material.OAK_PLANKS, Material.COBBLESTONE, Material.SNOWBALL, Material.IRON_CHESTPLATE, Material.LEATHER_HELMET, Material.IRON_BOOTS, Material.COOKED_BEEF };
    private static final Material[] CENTER_LOOT = { Material.DIAMOND_SWORD, Material.DIAMOND_CHESTPLATE, Material.DIAMOND_LEGGINGS, Material.ENDER_PEARL, Material.GOLDEN_APPLE, Material.DIAMOND, Material.BOW, Material.ARROW, Material.LAVA_BUCKET, Material.WATER_BUCKET, Material.OBSIDIAN };

    public GameManager(SkyWarsPlugin plugin) { this.plugin = plugin; }

    public boolean isGameRunning() { return gameRunning; }
    public String getArenaName() { return arenaName != null ? arenaName : "Arena_Principal"; }
    public Set<String> getAlivePlayers() { return alivePlayers; }
    public Map<String, Integer> getKillCount() { return killCount; }

    public void setPlayerKit(String playerName, String kitName) { playerKits.put(playerName, kitName); }

    public void giveLobbyItems(Player p) {
        p.getInventory().clear();
        ItemStack star = new ItemStack(Material.NETHER_STAR);
        org.bukkit.inventory.meta.ItemMeta meta = star.getItemMeta();
        meta.setDisplayName(ChatColor.GREEN + "" + ChatColor.BOLD + "Menú de SkyWars");
        star.setItemMeta(meta);
        p.getInventory().setItem(4, star);
    }

    public void giveSpectatorItems(Player p) {
        p.getInventory().clear();
        ItemStack compass = new ItemStack(Material.COMPASS);
        org.bukkit.inventory.meta.ItemMeta meta = compass.getItemMeta();
        meta.setDisplayName(ChatColor.YELLOW + "" + ChatColor.BOLD + "Jugadores Vivos");
        compass.setItemMeta(meta);
        p.getInventory().setItem(0, compass);
    }

    public void startGame(String arena) {
        if (gameRunning) return;
        World swWorld = Bukkit.getWorld(SW_WORLD);
        if (swWorld == null) return;

        this.gameRunning = true;
        this.arenaName = (arena != null) ? arena : "skywars";
        this.killCount.clear();
        this.alivePlayers.clear();
        this.activeCages.clear();

        // Configurar el borde inicial del mundo
        WorldBorder border = swWorld.getWorldBorder();
        border.setCenter(ADMIN_X, ADMIN_Z);
        border.setSize(250); // Cubre todas las islas
        border.setDamageAmount(2.0);

        randomizeChests(swWorld);

        List<Player> participants = new ArrayList<>();
        for (Player p : Bukkit.getOnlinePlayers()) {
            if (!p.getName().equalsIgnoreCase(ADMIN_NAME)) participants.add(p);
        }

        int islandIdx = 0;
        for (Player p : participants) {
            if (islandIdx < ISLANDS.length) {
                double[] coords = ISLANDS[islandIdx++];
                Location cageBase = new Location(swWorld, Math.floor(coords[0]), coords[1] + 15, Math.floor(coords[2]));
                activeCages.add(cageBase);
                createCage(cageBase);
                Location spawnLoc = cageBase.clone().add(0.5, 1, 0.5);
                
                p.getInventory().clear();
                p.setGameMode(GameMode.SURVIVAL);
                p.setHealth(20.0);
                p.setFoodLevel(20);
                p.teleport(spawnLoc);
                p.addPotionEffect(new PotionEffect(PotionEffectType.RESISTANCE, 200, 10, false, false));
                
                String kit = playerKits.getOrDefault(p.getName(), "ninguno");
                if (kit.equals("constructor")) { p.getInventory().addItem(new ItemStack(Material.STONE_PICKAXE)); p.getInventory().addItem(new ItemStack(Material.OAK_PLANKS, 64)); }
                else if (kit.equals("arquero")) { p.getInventory().addItem(new ItemStack(Material.BOW)); p.getInventory().addItem(new ItemStack(Material.ARROW, 10)); }
                else if (kit.equals("tanque")) { p.getInventory().setChestplate(new ItemStack(Material.IRON_CHESTPLATE)); }
                
                alivePlayers.add(p.getName());
                killCount.put(p.getName(), 0);
            }
        }

        Player admin = Bukkit.getPlayerExact(ADMIN_NAME);
        if (admin != null) {
            admin.teleport(new Location(swWorld, ADMIN_X, ADMIN_Y, ADMIN_Z));
            admin.setGameMode(GameMode.SPECTATOR);
        }

        Bukkit.broadcastMessage(ChatColor.DARK_AQUA + "[SkyWars] Arena preparándose...");
        updateScoreboard();

        new BukkitRunnable() {
            int count = 5;
            @Override
            public void run() {
                if (count > 0) {
                    for (String pName : alivePlayers) {
                        Player p = Bukkit.getPlayerExact(pName);
                        if (p != null) { p.sendTitle(ChatColor.YELLOW + String.valueOf(count), ChatColor.GRAY + "Prepárate...", 0, 25, 0); p.playSound(p.getLocation(), Sound.BLOCK_NOTE_BLOCK_PLING, 1.0f, 1.0f); }
                    }
                    count--;
                } else {
                    for (Location loc : activeCages) removeCage(loc);
                    activeCages.clear();
                    for (String pName : alivePlayers) {
                        Player p = Bukkit.getPlayerExact(pName);
                        if (p != null) { p.sendTitle(ChatColor.GREEN + "¡A LUCHAR!", "", 0, 40, 10); p.playSound(p.getLocation(), Sound.ENTITY_ENDER_DRAGON_GROWL, 0.5f, 1.0f); }
                    }
                    Bukkit.broadcastMessage(ChatColor.GREEN + "✔ ¡La partida ha comenzado!");
                    startMatchTimer(swWorld); // Iniciar los eventos de tiempo
                    this.cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    // NUEVO: Sistema de eventos por tiempo
    private void startMatchTimer(World world) {
        matchTask = new BukkitRunnable() {
            int seconds = 0;
            @Override
            public void run() {
                if (!gameRunning) { this.cancel(); return; }
                seconds++;
                
                if (seconds == 180) { // Minuto 3: Refill
                    Bukkit.broadcastMessage(ChatColor.YELLOW + "⚠ " + ChatColor.BOLD + "¡LOS COFRES HAN SIDO RELLENADOS!");
                    randomizeChests(world);
                    for (Player p : Bukkit.getOnlinePlayers()) p.playSound(p.getLocation(), Sound.BLOCK_CHEST_OPEN, 1.0f, 1.0f);
                } 
                else if (seconds == 300) { // Minuto 5: Muerte Súbita
                    Bukkit.broadcastMessage(ChatColor.RED + "☠ " + ChatColor.BOLD + "¡MUERTE SÚBITA! El borde se reduce al centro.");
                    world.getWorldBorder().setSize(30, 60); // Se encoge a 30 bloques en 60 segundos
                    for (Player p : Bukkit.getOnlinePlayers()) p.playSound(p.getLocation(), Sound.ENTITY_WITHER_DEATH, 0.5f, 1.0f);
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    private void createCage(Location base) {
        for (int x = -1; x <= 1; x++) for (int y = 0; y <= 3; y++) for (int z = -1; z <= 1; z++) {
            if (x == 0 && z == 0 && y > 0 && y < 3) continue;
            base.clone().add(x, y, z).getBlock().setType(Material.GLASS);
        }
    }

    private void removeCage(Location base) {
        for (int x = -1; x <= 1; x++) for (int y = 0; y <= 3; y++) for (int z = -1; z <= 1; z++) base.clone().add(x, y, z).getBlock().setType(Material.AIR);
    }

    public void registerKill(String killer) {
        if (!gameRunning || killer == null) return;
        killCount.merge(killer, 1, Integer::sum);
        updateScoreboard();
    }

    public void registerDeath(String playerName) {
        if (!gameRunning) return;
        alivePlayers.remove(playerName);
        updateScoreboard();

        Player p = Bukkit.getPlayerExact(playerName);
        if (p != null) {
            p.setGameMode(GameMode.SPECTATOR);
            p.sendMessage(ChatColor.RED + "☠ Has sido eliminado.");
            giveSpectatorItems(p);
            plugin.getBackendClient().sendDeath(p.getUniqueId().toString(), p.getName(), null, getArenaName());
        }

        Bukkit.broadcastMessage(ChatColor.YELLOW + "» " + playerName + " ha caído. Quedan " + alivePlayers.size() + " jugadores.");

        if (alivePlayers.size() <= 1) {
            String winner = alivePlayers.isEmpty() ? null : alivePlayers.iterator().next();
            new BukkitRunnable() { @Override public void run() { endGame(winner); } }.runTaskLater(plugin, 60L);
        }
    }

    public void endGame(String winner) {
        if (!gameRunning) return;
        gameRunning = false;
        
        if (matchTask != null) matchTask.cancel(); // Apagar reloj
        playerKits.clear();

        if (winner != null) {
            Bukkit.broadcastMessage(ChatColor.GOLD + "★ ¡" + winner + " es el campeón! ★");
            Player winnerP = Bukkit.getPlayerExact(winner);
            if (winnerP != null) spawnFireworks(winnerP.getLocation(), 10);
        }

        plugin.getBackendClient().sendMatchEnd(getArenaName(), winner, getTopKillers());

        new BukkitRunnable() {
            @Override public void run() {
                teleportAllToLobby();
                new BukkitRunnable() {
                    @Override public void run() {
                        World sw = Bukkit.getWorld(SW_WORLD);
                        if (sw != null) {
                            sw.getWorldBorder().setSize(250); // Resetear borde para la sig partida
                            Bukkit.unloadWorld(sw, false);
                        }
                        resetSkyWarsWorld();
                        new BukkitRunnable() {
                            @Override public void run() { Bukkit.createWorld(new WorldCreator(SW_WORLD)); Bukkit.broadcastMessage(ChatColor.AQUA + "[SkyWars] Mapa regenerado."); }
                        }.runTaskLater(plugin, 60L);
                    }
                }.runTaskLater(plugin, 40L);
            }
        }.runTaskLater(plugin, 160L);
    }

    public void forceEndGame() { endGame(null); }

    private void updateScoreboard() {
        ScoreboardManager manager = Bukkit.getScoreboardManager();
        if (manager == null) return;
        Scoreboard board = manager.getNewScoreboard();
        Objective obj = board.registerNewObjective("swboard", "dummy", ChatColor.AQUA + "" + ChatColor.BOLD + " SKYWARS ");
        obj.setDisplaySlot(DisplaySlot.SIDEBAR);

        int scorePos = 15; 
        for (String pName : killCount.keySet()) {
            int kills = killCount.get(pName);
            String prefix = alivePlayers.contains(pName) ? ChatColor.GREEN + "✔ " : ChatColor.RED + "☠ ";
            String entry = prefix + pName + ChatColor.GRAY + " [K:" + kills + "]";
            if (entry.length() > 40) entry = entry.substring(0, 40); 
            obj.getScore(entry).setScore(scorePos--);
        }
        for (Player p : Bukkit.getOnlinePlayers()) if (p.getWorld().getName().equals(SW_WORLD)) p.setScoreboard(board);
    }

    private void clearScoreboards() {
        ScoreboardManager manager = Bukkit.getScoreboardManager();
        if (manager == null) return;
        for (Player p : Bukkit.getOnlinePlayers()) p.setScoreboard(manager.getMainScoreboard());
    }

    private void resetSkyWarsWorld() {
        File swDir = new File("/root/minecraft/skywars");
        File tmplDir = new File("/root/minecraft/skywars_template");
        if (!tmplDir.exists()) return;
        deleteDir(swDir);
        try { copyDir(tmplDir, swDir); new File(swDir, "session.lock").delete(); } catch (IOException ignored) {}
    }

    private void deleteDir(File dir) {
        if (!dir.exists()) return;
        File[] files = dir.listFiles();
        if (files != null) for (File f : files) { if (f.isDirectory()) deleteDir(f); else f.delete(); }
        dir.delete();
    }

    private void copyDir(File src, File dst) throws IOException {
        if (src.isDirectory()) {
            if (!dst.exists()) dst.mkdirs();
            String[] files = src.list();
            if (files != null) for (String f : files) copyDir(new File(src, f), new File(dst, f));
        } else Files.copy(src.toPath(), dst.toPath(), StandardCopyOption.REPLACE_EXISTING);
    }

    private void teleportAllToLobby() {
        clearScoreboards(); 
        World lobby = Bukkit.getWorld(LOBBY_WORLD);
        if (lobby == null) return;
        Location spawn = new Location(lobby, 34.5, -40.0, 26.5);
        for (Player p : Bukkit.getOnlinePlayers()) {
            p.setGameMode(GameMode.ADVENTURE);
            giveLobbyItems(p);
            p.teleport(spawn);
        }
    }

    private void randomizeChests(World world) {
        Random rand = new Random();
        int cX = (int) (ADMIN_X / 16); int cZ = (int) (ADMIN_Z / 16);
        for (int x = cX - 8; x <= cX + 8; x++) for (int z = cZ - 8; z <= cZ + 8; z++) world.getChunkAt(x, z).load(true);

        for (org.bukkit.Chunk chunk : world.getLoadedChunks()) {
            for (BlockState state : chunk.getTileEntities()) {
                if (state instanceof Chest) {
                    Inventory inv = ((Chest) state).getInventory();
                    inv.clear();
                    boolean isCenter = state.getLocation().distance(new Location(world, ADMIN_X, state.getLocation().getY(), ADMIN_Z)) < 25.0;
                    Material[] pool = isCenter ? CENTER_LOOT : ISLAND_LOOT;
                    
                    int count = rand.nextInt(5) + 4; 
                    for (int i = 0; i < count; i++) {
                        Material mat = pool[rand.nextInt(pool.length)];
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
        killCount.forEach((k, v) -> { Map<String, Object> m = new HashMap<>(); m.put("player", k); m.put("kills", v); top.add(m); });
        return top;
    }
}

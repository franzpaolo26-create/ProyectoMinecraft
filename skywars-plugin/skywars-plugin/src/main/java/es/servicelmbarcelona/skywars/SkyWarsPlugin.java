package es.servicelmbarcelona.skywars;

import es.servicelmbarcelona.skywars.api.BackendClient;
import es.servicelmbarcelona.skywars.commands.SwCommand;
import es.servicelmbarcelona.skywars.game.GameManager;
import es.servicelmbarcelona.skywars.listeners.DeathListener;
import es.servicelmbarcelona.skywars.listeners.PlayerListener;
import org.bukkit.plugin.java.JavaPlugin;

public class SkyWarsPlugin extends JavaPlugin {

    private static SkyWarsPlugin instance;
    private BackendClient backendClient;
    private GameManager gameManager;

    @Override
    public void onEnable() {
        instance = this;

        saveDefaultConfig();

        String backendUrl = getConfig().getString("backend.url", "https://api.servicelmbarcelona.es");
        String pluginKey  = getConfig().getString("backend.plugin-key", "");
        int timeout       = getConfig().getInt("backend.timeout-seconds", 5);

        backendClient = new BackendClient(backendUrl, pluginKey, timeout);
        gameManager   = new GameManager(this);

        getServer().getPluginManager().registerEvents(new DeathListener(this), this);
        getServer().getPluginManager().registerEvents(new PlayerListener(this), this);

        SwCommand swCmd = new SwCommand(this);
        getCommand("sw").setExecutor(swCmd);
        getCommand("sw").setTabCompleter(swCmd);

        getLogger().info("------------------------------");
        getLogger().info("  SkyWars Plugin v2.0 ON");
        getLogger().info("  Backend: " + backendUrl);
        getLogger().info("------------------------------");
    }

    @Override
    public void onDisable() {
        if (gameManager != null && gameManager.isGameRunning()) {
            gameManager.forceEndGame();
        }
        getLogger().info("SkyWars Plugin desactivado.");
    }

    public static SkyWarsPlugin getInstance() { return instance; }
    public BackendClient getBackendClient()    { return backendClient; }
    public GameManager getGameManager()        { return gameManager; }
}

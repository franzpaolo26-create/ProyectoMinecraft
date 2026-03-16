package es.servicelmbarcelona.skywars;

import es.servicelmbarcelona.skywars.api.BackendClient;
import es.servicelmbarcelona.skywars.commands.SkyWarsCommand;
import es.servicelmbarcelona.skywars.game.GameManager;
import es.servicelmbarcelona.skywars.listeners.PlayerListener;
import org.bukkit.plugin.java.JavaPlugin;

public class SkyWarsPlugin extends JavaPlugin {

    private static SkyWarsPlugin instance;
    private BackendClient backendClient;
    private GameManager gameManager;

    // Restauramos el método que necesita tu BackendClient
    public static SkyWarsPlugin getInstance() {
        return instance;
    }

    @Override
    public void onEnable() {
        instance = this;
        saveDefaultConfig();
        
        // Alimentamos al BackendClient con los 3 datos que exige (String, String, int)
        String apiUrl = getConfig().getString("api.url", "http://localhost");
        String apiKey = getConfig().getString("api.key", "secret");
        int apiPort = getConfig().getInt("api.port", 3000);
        
        this.backendClient = new BackendClient(apiUrl, apiKey, apiPort);
        this.gameManager = new GameManager(this);
        
        getCommand("sw").setExecutor(new SkyWarsCommand(this));
        
        // Registramos el nuevo sistema de Menús e Ítems
        getServer().getPluginManager().registerEvents(new PlayerListener(this), this);

        getLogger().info("SkyWarsPlugin Fase 1 (Menús) cargado con éxito.");
    }

    @Override
    public void onDisable() {
        // Al apagarse el servidor, la conexión muere sola, no necesitamos forzar un disconnect()
        getLogger().info("SkyWarsPlugin desactivado.");
    }

    public BackendClient getBackendClient() { return backendClient; }
    public GameManager getGameManager() { return gameManager; }
}

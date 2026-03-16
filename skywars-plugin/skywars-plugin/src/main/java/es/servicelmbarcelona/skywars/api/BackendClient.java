package es.servicelmbarcelona.skywars.api;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import org.bukkit.scheduler.BukkitRunnable;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class BackendClient {

    private final String baseUrl;
    private final String pluginKey;
    private final int timeoutMs;
    private final Logger log;

    public BackendClient(String baseUrl, String pluginKey, int timeoutSeconds) {
        this.baseUrl    = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.pluginKey  = pluginKey;
        this.timeoutMs  = timeoutSeconds * 1000;
        this.log        = SkyWarsPlugin.getInstance().getLogger();
    }

    /** Sends JSON async (off main thread) */
    public void postAsync(String path, String json) {
        new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    post(path, json);
                } catch (Exception e) {
                    log.warning("[Backend] Error POST " + path + ": " + e.getMessage());
                }
            }
        }.runTaskAsynchronously(SkyWarsPlugin.getInstance());
    }

    private void post(String path, String json) throws Exception {
        URL url = new URL(baseUrl + path);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("X-Plugin-Key", pluginKey);
        conn.setConnectTimeout(timeoutMs);
        conn.setReadTimeout(timeoutMs);
        conn.setDoOutput(true);

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        conn.setRequestProperty("Content-Length", String.valueOf(bytes.length));

        try (OutputStream os = conn.getOutputStream()) {
            os.write(bytes);
        }

        int code = conn.getResponseCode();
        if (code < 200 || code >= 300) {
            log.warning("[Backend] POST " + path + " responded " + code);
        } else {
            log.info("[Backend] POST " + path + " OK (" + code + ")");
        }
        conn.disconnect();
    }

    // ── Helpers para construir JSON sin dependencias ──

    public void sendDeath(String uuid, String playerName, String killer, String arenaName) {
        String killerJson = killer != null ? "\"" + escape(killer) + "\"" : "null";
        String json = "{"
            + "\"player_uuid\":\"" + escape(uuid) + "\","
            + "\"player_name\":\"" + escape(playerName) + "\","
            + "\"killer\":" + killerJson + ","
            + "\"arena_name\":\"" + escape(arenaName) + "\","
            + "\"items_lost\":{}"
            + "}";
        postAsync("/api/ingest/death", json);
    }

    public void sendMatchEnd(String arenaName, String winnerName, List<Map<String, Object>> topKillers) {
        StringBuilder killersJson = new StringBuilder("[");
        for (int i = 0; i < topKillers.size(); i++) {
            Map<String, Object> k = topKillers.get(i);
            killersJson.append("{")
                .append("\"player\":\"").append(escape((String) k.get("player"))).append("\",")
                .append("\"kills\":").append(k.get("kills"))
                .append("}");
            if (i < topKillers.size() - 1) killersJson.append(",");
        }
        killersJson.append("]");

        String winnerJson = winnerName != null ? "\"" + escape(winnerName) + "\"" : "null";
        String json = "{"
            + "\"arena_name\":\"" + escape(arenaName) + "\","
            + "\"winner_name\":" + winnerJson + ","
            + "\"top_killers\":" + killersJson
            + "}";
        postAsync("/api/ingest/match-end", json);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

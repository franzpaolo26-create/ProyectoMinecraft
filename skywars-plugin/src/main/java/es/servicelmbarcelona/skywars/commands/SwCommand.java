package es.servicelmbarcelona.skywars.commands;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import es.servicelmbarcelona.skywars.game.GameManager;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;

import java.util.Arrays;
import java.util.List;

public class SwCommand implements CommandExecutor, TabCompleter {

    private final SkyWarsPlugin plugin;

    public SwCommand(SkyWarsPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("skywars.admin")) {
            sender.sendMessage(ChatColor.RED + "No tienes permiso.");
            return true;
        }

        if (args.length == 0) {
            sendHelp(sender);
            return true;
        }

        GameManager gm = plugin.getGameManager();

        switch (args[0].toLowerCase()) {
            case "start" -> {
                if (gm.isGameRunning()) {
                    sender.sendMessage(ChatColor.RED + "[SW] Ya hay una partida en curso.");
                    return true;
                }
                String arena = args.length > 1 ? args[1] : plugin.getConfig().getString("game.arena-name", "arena_principal");
                gm.startGame(arena);
                sender.sendMessage(ChatColor.GREEN + "[SW] Partida iniciada en " + arena + ".");
            }
            case "end" -> {
                if (!gm.isGameRunning()) {
                    sender.sendMessage(ChatColor.RED + "[SW] No hay ninguna partida en curso.");
                    return true;
                }
                String winner = args.length > 1 ? args[1] : null;
                gm.endGame(winner);
                sender.sendMessage(ChatColor.GREEN + "[SW] Partida terminada." + (winner != null ? " Ganador: " + winner : ""));
            }
            case "status" -> {
                if (gm.isGameRunning()) {
                    sender.sendMessage(ChatColor.GREEN + "[SW] Partida activa en: " + gm.getArenaName());
                    sender.sendMessage(ChatColor.YELLOW + "Vivos: " + gm.getAlivePlayers());
                    sender.sendMessage(ChatColor.YELLOW + "Kills: " + gm.getKillCount());
                } else {
                    sender.sendMessage(ChatColor.GRAY + "[SW] No hay partida activa.");
                }
            }
            case "reload" -> {
                plugin.reloadConfig();
                sender.sendMessage(ChatColor.GREEN + "[SW] Config recargada.");
            }
            default -> sendHelp(sender);
        }
        return true;
    }

    private void sendHelp(CommandSender sender) {
        sender.sendMessage(ChatColor.DARK_AQUA + "=== SkyWars Commands ===");
        sender.sendMessage(ChatColor.YELLOW + "/sw start [arena]" + ChatColor.WHITE + " - Inicia una partida");
        sender.sendMessage(ChatColor.YELLOW + "/sw end [ganador]" + ChatColor.WHITE + " - Termina la partida");
        sender.sendMessage(ChatColor.YELLOW + "/sw status" + ChatColor.WHITE + " - Estado actual");
        sender.sendMessage(ChatColor.YELLOW + "/sw reload" + ChatColor.WHITE + " - Recarga la config");
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String label, String[] args) {
        if (args.length == 1) return Arrays.asList("start", "end", "status", "reload");
        return List.of();
    }
}

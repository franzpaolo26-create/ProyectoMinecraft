package es.servicelmbarcelona.skywars.commands;

import es.servicelmbarcelona.skywars.SkyWarsPlugin;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;

public class SkyWarsCommand implements CommandExecutor {

    private final SkyWarsPlugin plugin;

    public SkyWarsCommand(SkyWarsPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        // Solo tú (o la consola web) pueden usar esto
        if (!sender.isOp() && !sender.getName().equalsIgnoreCase("Franzpaolo26")) {
            sender.sendMessage(ChatColor.RED + "No tienes permisos para usar este comando.");
            return true;
        }

        if (args.length == 0) {
            sender.sendMessage(ChatColor.RED + "Uso correcto: /sw <start|stop>");
            return true;
        }

        if (args[0].equalsIgnoreCase("start")) {
            if (plugin.getGameManager().isGameRunning()) {
                sender.sendMessage(ChatColor.RED + "¡La partida ya está en curso!");
            } else {
                sender.sendMessage(ChatColor.GREEN + "Forzando inicio de la partida...");
                plugin.getGameManager().startGame("skywars");
            }
            return true;
        }

        if (args[0].equalsIgnoreCase("stop")) {
            if (!plugin.getGameManager().isGameRunning()) {
                sender.sendMessage(ChatColor.RED + "No hay ninguna partida activa.");
            } else {
                sender.sendMessage(ChatColor.YELLOW + "Forzando fin de la partida...");
                plugin.getGameManager().forceEndGame();
            }
            return true;
        }

        sender.sendMessage(ChatColor.RED + "Comando desconocido. Usa: /sw <start|stop>");
        return true;
    }
}

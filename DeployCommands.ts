import { REST, Routes } from "discord.js";
import CommandManager from "./singletons/CommandManager.js";
import LoadEnv from "./singletons/LoadEnv.js";

await CommandManager.LoadCommands();

const Rest: REST = new REST({ version: "10" }).setToken(LoadEnv.DISCORD_TOKEN);

await Rest.put(
    Routes.applicationCommands(
        LoadEnv.CLIENT_ID
    ),
    {
        body: [...CommandManager.Values()].map(Command => Command.Command.toJSON())
    }
);
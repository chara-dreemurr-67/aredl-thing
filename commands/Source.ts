import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, type SlashCommandOptionsOnlyBuilder } from "discord.js";
import Command from "../types/Command.js";

const C: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("source")
    .setDescription("Prints the link to the GitHub repository of this bot.")
;

export default Command.New(C)
(async (Interaction: ChatInputCommandInteraction): Promise<void> => {
    await Interaction.reply({
        content: "https://github.com/chara-dreemurr-67/aredl-thing",
        allowedMentions: { repliedUser: false },
        flags: MessageFlags.Ephemeral
    });
});
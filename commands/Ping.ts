import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, type SlashCommandOptionsOnlyBuilder } from "discord.js";
import Command from "../types/Command.js";

const C: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if the bot is alive or not.")
;

export default Command.New(C)
(async (Interaction: ChatInputCommandInteraction): Promise<void> => {
    await Interaction.reply({
        content: "It is alive!",
        allowedMentions: { repliedUser: false },
        flags: MessageFlags.Ephemeral
    });
});
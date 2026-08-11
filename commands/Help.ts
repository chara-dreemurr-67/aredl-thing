import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import ConstructButtonRow, { ButtonType } from "../helpers/ConstructNavigationButtonRow.js";
import CommandManager from "../singletons/CommandManager.js";
import Paginate from "../helpers/Paginate.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import EmbedActionInteractionManager from "../singletons/EmbedActionInteractionManager.js";
import CreateNavigationButtonHandler from "../helpers/CreateNavigationButtonHandler.js";
import Command, { InteractionTypes } from "../types/Command.js";

interface InteractionMeta {
    CurrentPage: number;
    MaxPage: number;
    InteractionIDs: Record<ButtonType, string>;
}

const C: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get a list of commands.")
;

export default Command.New(C)
(async (Interaction: ChatInputCommandInteraction): Promise<void> => {
    await Interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const UserID: string = Interaction.user.id;
    const Commands: Command[] = [...CommandManager.Values()];
    const MaxPage: number = GetMaxPage(Commands, 25);

    if(MaxPage > 1) {
        const CommandPage: Command[] = Paginate(Commands, 1, 25);
        const CommandName: string = Interaction.commandName;
        const InteractionMeta: InteractionMeta = {
            CurrentPage: 1,
            MaxPage,
            InteractionIDs: {
                [ButtonType.BackwardToStart]: "",
                [ButtonType.Backward]: "",
                [ButtonType.Forward]: "",
                [ButtonType.ForwardToEnd]: ""
            }
        };
        const MetaID: string = EmbedActionInteractionManager.AddMeta(InteractionMeta);
        
        const InteractionIDs: Record<ButtonType, string> = {
            [ButtonType.BackwardToStart]: EmbedActionInteractionManager.AddInteraction(
                UserID,
                CommandName,
                ButtonType.BackwardToStart,
                MetaID
            ),
            [ButtonType.Backward]: EmbedActionInteractionManager.AddInteraction(
                UserID,
                CommandName,
                ButtonType.Backward,
                MetaID
            ),
            [ButtonType.Forward]: EmbedActionInteractionManager.AddInteraction(
                UserID,
                CommandName,
                ButtonType.Forward,
                MetaID
            ),
            [ButtonType.ForwardToEnd]: EmbedActionInteractionManager.AddInteraction(
                UserID,
                CommandName,
                ButtonType.ForwardToEnd,
                MetaID
            )
        };

        InteractionMeta.InteractionIDs = InteractionIDs;

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setColor(0x00ffff)
            .setTitle("Help command.")
            .setDescription(`Page 1 / ${MaxPage}`)
            .addFields(
                ...CommandPage.map(Command => ({
                    name: `/${Command.Command.name} ${
                        Command.Command.options.map(
                            Option => `[${Option.toJSON().name}${Option.toJSON().required ? "*" : ""}]`
                        ).join(" ")
                    }`.trim(),
                    value: `${Command.Command.description}`,
                    inline: true 
                }))
            )
            .setFooter({ 
                text: "* = required options, (Administrator Command) = commands only the bot administrators can run, (Cancelable) = long running commands that can be cancel with /cancel."
            })
        ;
        
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            1, MaxPage, InteractionIDs,
        );

        await Interaction.editReply({
            embeds: [Embed],
            components: [ButtonRow],
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    const Embed: EmbedBuilder = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle("Help command.")
        .addFields(
            ...Commands.map(Command => ({
                name: `/${Command.Command.name} ${
                    Command.Command.options.map(
                        Option => `[${Option.toJSON().name}${Option.toJSON().required ? "*" : ""}]`
                    ).join(" ")
                }`.trim(),
                value: `${Command.Command.description}`,
                inline: true 
            }))
        )
        .setFooter({ 
            text: "* = required options, (Administrator Command) = commands only the bot administrators can run, (Cancelable) = long running commands that can be cancel with /cancel."
        })
    ;
    await Interaction.editReply({
        embeds: [Embed],
        allowedMentions: { repliedUser: false }
    });
})
.AddMultipleInteractionHandlers(InteractionTypes.Button)
(CreateNavigationButtonHandler()
(async (Interaction: ButtonInteraction, Type: ButtonType): Promise<void> => {
    const InteractionMeta: InteractionMeta | undefined = EmbedActionInteractionManager.GetInteractionMeta<InteractionMeta>(
        Interaction.user.id, 
        Interaction.customId
    );
    
    if(!InteractionMeta)
        return;
    
    await Interaction.deferUpdate();

    const Commands: Command[] = [...CommandManager.Values()];
    const MaxPage: number = GetMaxPage(Commands, 20);

    InteractionMeta.CurrentPage = {
        [ButtonType.BackwardToStart]: 1,
        [ButtonType.Backward]: InteractionMeta.CurrentPage - 1,
        [ButtonType.Forward]: InteractionMeta.CurrentPage + 1,
        [ButtonType.ForwardToEnd]: MaxPage
    }[Type];

    const CommandPage: Command[] = Paginate(Commands, InteractionMeta.CurrentPage, 25);
    
    const Embed: EmbedBuilder = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle("Help command.")
        .setDescription(`Page ${InteractionMeta.CurrentPage} / ${MaxPage}`)
        .addFields(
            ...CommandPage.map(Command => ({
                name: `/${Command.Command.name} ${
                    Command.Command.options.map(
                        Option => `[${Option.toJSON().name}${Option.toJSON().required ? "*" : ""}]`
                    ).join(" ")
                }`.trim(),
                value: `${Command.Command.description}`,
                inline: true 
            }))
        )
        .setFooter({ 
            text: "* = required options, (Administrator Command) = commands only the bot administrators can run, (Cancelable) = long running commands that can be cancel with /cancel."
        })
    ;
    
    const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
        1, InteractionMeta.MaxPage, InteractionMeta.InteractionIDs,
    );

    await Interaction.update({
        embeds: [Embed],
        components: [ButtonRow],
        allowedMentions: { repliedUser: false }
    });
}));
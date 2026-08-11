import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import type { Level } from "../singletons/Database.js";
import Command, { InteractionTypes } from "../types/Command.js";
import ConstructNavigationButtonRow, { ButtonType } from "../helpers/ConstructNavigationButtonRow.js";
import Database from "../singletons/Database.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import EmbedActionInteractionManager from "../singletons/EmbedActionInteractionManager.js";
import Paginate from "../helpers/Paginate.js";
import CreateNavigationButtonHandler from "../helpers/CreateNavigationButtonHandler.js";

function LevelPageBuilder(SearchResult: Level, IncludeBackButton: true, BackButtonID: string): {
    Embed: EmbedBuilder;
    BackButtonRow: ActionRowBuilder<ButtonBuilder>;
};
function LevelPageBuilder(SearchResult: Level, IncludeBackButton: false): EmbedBuilder;
function LevelPageBuilder(
    Level: Level,
    IncludeBackButton: boolean = true,
    BackButtonID?: string
): { Embed: EmbedBuilder; BackButtonRow: ActionRowBuilder<ButtonBuilder>; } | EmbedBuilder {
    let CreatorMeta: { name: string; value: string; inline?: boolean }[] = [
        {
            name: "Publisher",
            value: Database.Manager.GetUser(Level.Publisher!)?.GlobalName ?? "-",
            inline: true
        },
        {
            name: `Verifier${Level.Verifiers!.length > 1 ? "s" : ""}`,
            value: Level.Verifiers!.map(V => Database.Manager.GetUser(V)?.GlobalName ?? "-").join(", "),
            inline: true
        },
        {
            name: `Creator${Level.Creators!.length > 1 ? "s" : ""}`,
            value: Level.Creators!.map(C => Database.Manager.GetUser(C)?.GlobalName ?? "-").join(", ")
        }
    ];

    if(!Level.Creators!.length) {
        CreatorMeta = [
            {
                name: "Publisher & Creator",
                value: Database.Manager.GetUser(Level.Publisher!)?.GlobalName ?? "-",
                inline: true
            },
            {
                name: `Verifier${Level.Verifiers!.length > 1 ? "s" : ""}`,
                value: Level.Verifiers!.map(V => Database.Manager.GetUser(V)?.GlobalName ?? "-").join(", "),
                inline: true
            },
        ];
    }

    const Embed: EmbedBuilder = new EmbedBuilder()
        .setTitle(`#${Level.Position} - ${Level.Name}`)
        .setDescription(Level.Description ?? "No description provided.")
        .addFields(
            {
                name: "Tags",
                value: Level.Tags?.join(", ") ?? "-"
            },
            {
                name: "Level ID",
                value: Number(Level.LevelID).toString(),
                inline: true
            },
            {
                name: "List Points",
                value: Level.Points.toString(),
                inline: true
            },
            {
                name: "EDEL Enjoyment",
                value: `${Level.EDELEnjoyment ?? "-"}`,
                inline: true
            },
            {
                name: "Song",
                value: `${Level.Song ?? "NONG"}`,
                inline: true
            },
            {
                name: "NLW Tier",
                value: Level.NLWTier ?? "-",
                inline: true
            },
            {
                name: "GDDL Tier",
                value: `${Level.GDDLTier ?? "-"}`,
                inline: true
            },
            ...CreatorMeta
        )
    ;

    if(IncludeBackButton) {
        const BackButton: ButtonBuilder = new ButtonBuilder()
            .setCustomId(BackButtonID!)
            .setLabel("Back")
            .setStyle(ButtonStyle.Secondary)
        ;
        const BackButtonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(BackButton)
        ;

        return {
            Embed,
            BackButtonRow
        };
    }
    return Embed;
}

function LevelBrowserBuilder(SearchResult: Record<string, Level>): EmbedBuilder;
function LevelBrowserBuilder(SearchResult: Record<string, Level>, CurrentPage: number, MaxPage: number): EmbedBuilder;
function LevelBrowserBuilder(SearchResult: Record<string, Level>, CurrentPage?: number, MaxPage?: number): EmbedBuilder {
    const Embed: EmbedBuilder = new EmbedBuilder()
        .addFields(
            ...Object.values(SearchResult).map(Level => ({
                name: `#${Level.Position}`,
                value: Level.Name,
                inline: true
            }))
        )
    ;

    if(CurrentPage && MaxPage && MaxPage > 1)
        Embed.setTitle(`Page ${CurrentPage} / ${MaxPage}`);

    return Embed;
}

const LevelPickerBuilder = (SearchResult: Record<string, Level>, LevelPickerID: string): ActionRowBuilder<StringSelectMenuBuilder> => {
    const LevelPicker: StringSelectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId(LevelPickerID)
        .addOptions(
            ...Object.entries(SearchResult).map(([ID, Level]) => ({
                label: Level.Name,
                value: ID
            }))
        )
        .setMinValues(1)
        .setMaxValues(1)
    ;
    return new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(LevelPicker)
    ;
};


const C: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("search")
    .setDescription("Get a list of levels from a query.")
    .addStringOption(Option =>
        Option
            .setName("name")
            .setDescription("Level to find. Leave empty for the entire list.")
            .setRequired(false)
    )
    .addIntegerOption(Option =>
        Option
            .setName("max_placement")
            .setDescription("Maximum placement index to return.")
            .setRequired(false)
    )
    .addIntegerOption(Option =>
        Option
            .setName("min_placement")
            .setDescription("Minimum placement index to return.")
            .setRequired(false)
    )
    .addBooleanOption(Option =>
        Option
            .setName("two_players")
            .setDescription("Whether to return 2p levels only or exclude 2p levels. Leave empty for both.")
            .setRequired(false)
    )
;

interface LevelBrowserInteractionMeta {
    LevelPickerID: string;
    SearchResult: string[];
    CurrentPage?: number;
    NavigationButtonsIDs?: Record<ButtonType, string>;
}

export default Command.New(C)
(async (Interaction: ChatInputCommandInteraction): Promise<void> => {
    const Name: string | null = Interaction.options.getString("name", false);
    const MaxPlacement: number | null = Interaction.options.getInteger("max_placement", false);
    const MinPlacement: number | null = Interaction.options.getInteger("min_placement", false);
    const TwoPlayers: boolean | null = Interaction.options.getBoolean("two_players", false);

    await Interaction.deferReply();

    const SearchResult: Record<string, Level> = await Database.Manager.Search({ Name, MaxPlacement, MinPlacement, TwoPlayers });    
    const Levels: string[] = Object.keys(SearchResult);

    if(!Levels.length) {
        await Interaction.editReply({
            content: "No levels found.",
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    if(Levels.length === 1) {
        await Interaction.editReply({
            embeds: [LevelPageBuilder(SearchResult[Levels[0]], false)],
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    const MaxPage: number = GetMaxPage(Levels, 20);

    const Owner: string = Interaction.user.id;
    const InteractionMeta: LevelBrowserInteractionMeta = {
        LevelPickerID: "",
        SearchResult: Levels
    };
    const MetaID: string = EmbedActionInteractionManager.AddMeta(InteractionMeta);
    const LevelPickerID: string = EmbedActionInteractionManager.AddInteraction(
        Owner, "search", "LevelPickerSelect", MetaID
    );
    InteractionMeta.LevelPickerID = LevelPickerID;
    
    if(MaxPage <= 1) {
        const Embed: EmbedBuilder = LevelBrowserBuilder(SearchResult);
        const LevelPickerRow: ActionRowBuilder<StringSelectMenuBuilder> = LevelPickerBuilder(SearchResult, LevelPickerID);

        await Interaction.editReply({
            embeds: [Embed],
            components: [LevelPickerRow],
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    InteractionMeta.CurrentPage = 1;
    
    const NavigationButtonsIDs: Record<ButtonType, string> = {
        [ButtonType.BackwardToStart]: EmbedActionInteractionManager.AddInteraction(
            Owner, "search", ButtonType.BackwardToStart, MetaID
        ),
        [ButtonType.Backward]: EmbedActionInteractionManager.AddInteraction(
            Owner, "search", ButtonType.Backward, MetaID
        ),
        [ButtonType.Forward]: EmbedActionInteractionManager.AddInteraction(
            Owner, "search", ButtonType.Forward, MetaID
        ),
        [ButtonType.ForwardToEnd]: EmbedActionInteractionManager.AddInteraction(
            Owner, "search", ButtonType.ForwardToEnd, MetaID
        )
    };

    InteractionMeta.NavigationButtonsIDs = NavigationButtonsIDs;

    
    const LevelPage: Record<string, Level> = Object.fromEntries(
        Paginate(Object.entries(SearchResult), 1, 20)
    );
    
    const Embed: EmbedBuilder = LevelBrowserBuilder(LevelPage, 1, MaxPage);
    const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructNavigationButtonRow(1, MaxPage, NavigationButtonsIDs);
    const LevelPickerRow: ActionRowBuilder<StringSelectMenuBuilder> = LevelPickerBuilder(LevelPage, LevelPickerID);

    await Interaction.editReply({
        embeds: [Embed],
        components: [ButtonRow, LevelPickerRow],
        allowedMentions: { repliedUser: false }
    });
})
.AddSingleInteractionHandler(InteractionTypes.StringMenu, "LevelPickerSelect")
(async (Interaction: StringSelectMenuInteraction): Promise<void> => {
    const Owner: string = Interaction.user.id;
    const LevelBrowserInteractionMeta: LevelBrowserInteractionMeta | undefined = EmbedActionInteractionManager.GetInteractionMeta(
        Owner, Interaction.customId
    );

    if(!LevelBrowserInteractionMeta)
        return;

    const Value: string = Interaction.values[0];
    const Level: Level | undefined = await Database.Manager.GetLevel(Value);
    
    if(!Level) 
        return;
    
    await Interaction.deferUpdate();

    const LevelPage: { Embed: EmbedBuilder; BackButtonRow: ActionRowBuilder<ButtonBuilder> } = LevelPageBuilder(
        Level, true, EmbedActionInteractionManager.AddInteraction(
            Owner, "search", "BackToLevelBrowser", 
            EmbedActionInteractionManager.InteractionRegistry[Owner][Interaction.customId].MetaID!
        )
    );
    
    await Interaction.editReply({
        embeds: [LevelPage.Embed],
        components: [LevelPage.BackButtonRow],
        allowedMentions: { repliedUser: false }
    });
})
.AddMultipleInteractionHandlers(InteractionTypes.Button)
(CreateNavigationButtonHandler()
(async (Interaction: ButtonInteraction, Type: ButtonType): Promise<void> => {
    const Owner: string = Interaction.user.id;
    const InteractionMeta: LevelBrowserInteractionMeta | undefined = EmbedActionInteractionManager.GetInteractionMeta(
        Owner, Interaction.customId
    );

    if(!InteractionMeta)
        return;

    await Interaction.deferUpdate();
    
    const MaxPage: number = GetMaxPage(InteractionMeta.SearchResult, 20); 
    
    InteractionMeta.CurrentPage = InteractionMeta.CurrentPage = {
        [ButtonType.BackwardToStart]: 1,
        [ButtonType.Backward]: InteractionMeta.CurrentPage! - 1,
        [ButtonType.Forward]: InteractionMeta.CurrentPage! + 1,
        [ButtonType.ForwardToEnd]: MaxPage
    }[Type];
    
    const LevelPage: Record<string, Level> = Object.fromEntries(
        Paginate(InteractionMeta.SearchResult, InteractionMeta.CurrentPage, 20)
        .map(L => [L, Database.Manager.Levels[L]])
    );
    
    const Embed: EmbedBuilder = LevelBrowserBuilder(LevelPage, InteractionMeta.CurrentPage!, MaxPage);
    const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructNavigationButtonRow(
        InteractionMeta.CurrentPage,
        MaxPage,
        InteractionMeta.NavigationButtonsIDs!
    );
    const LevelPickerRow: ActionRowBuilder<StringSelectMenuBuilder> = LevelPickerBuilder(LevelPage, InteractionMeta.LevelPickerID);

    await Interaction.editReply({
        embeds: [Embed],
        components: [ButtonRow, LevelPickerRow],
        allowedMentions: { repliedUser: false }
    });
}))
.AddSingleInteractionHandler(InteractionTypes.Button, "BackToLevelBrowser")
(async (Interaction: ButtonInteraction): Promise<void> => {
    const Owner: string = Interaction.user.id;
    const InteractionMeta: LevelBrowserInteractionMeta | undefined = EmbedActionInteractionManager.GetInteractionMeta(
        Owner, Interaction.customId
    );

    if(!InteractionMeta)
        return;
    
    EmbedActionInteractionManager.RemoveInteraction(Owner, Interaction.customId);
    
    await Interaction.deferUpdate();

    const Levels: string[] = InteractionMeta.SearchResult;
    const MaxPage: number = GetMaxPage(Levels, 20);
    
    if(MaxPage <= 1) {
        const SearchResult: Record<string, Level> = Object.fromEntries(
            Levels.map(L => [L, Database.Manager.Levels[L]])
        );
        
        const Embed: EmbedBuilder = LevelBrowserBuilder(SearchResult);
        const LevelPickerRow: ActionRowBuilder<StringSelectMenuBuilder> = LevelPickerBuilder(SearchResult, InteractionMeta.LevelPickerID);

        await Interaction.editReply({
            embeds: [Embed],
            components: [LevelPickerRow],
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    const LevelPage: Record<string, Level> = Object.fromEntries(
        Paginate(Levels, InteractionMeta.CurrentPage!, 20).map(L => [L, Database.Manager.Levels[L]])
    );
    
    const Embed: EmbedBuilder = LevelBrowserBuilder(LevelPage, InteractionMeta.CurrentPage!, MaxPage);
    const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructNavigationButtonRow(
        InteractionMeta.CurrentPage!, MaxPage, InteractionMeta.NavigationButtonsIDs!
    );
    const LevelPickerRow: ActionRowBuilder<StringSelectMenuBuilder> = LevelPickerBuilder(LevelPage, InteractionMeta.LevelPickerID);

    await Interaction.editReply({
        embeds: [Embed],
        components: [ButtonRow, LevelPickerRow],
        allowedMentions: { repliedUser: false }
    });
});
import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChannelSelectMenuInteraction,
    ChatInputCommandInteraction,
    Client,
    MentionableSelectMenuInteraction,
    RoleSelectMenuInteraction,
    SlashCommandBuilder,
    StringSelectMenuInteraction,
    UserSelectMenuInteraction,
    type CacheType,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";

export enum InteractionTypes {
    Autocomplete = "Autocomplete",
    Button = "Button",
    StringMenu = "StringMenu",
    UserMenu = "UserMenu",
    RoleMenu = "RoleMenu",
    ChannelMenu = "ChannelMenu",
    MentionableMenu = "MentionableMenu"
}

type Interaction<Cached extends CacheType = CacheType> =
    | ChatInputCommandInteraction<Cached>
    | StringSelectMenuInteraction<Cached>
    | UserSelectMenuInteraction<Cached>
    | RoleSelectMenuInteraction<Cached>
    | MentionableSelectMenuInteraction<Cached>
    | ChannelSelectMenuInteraction<Cached>
    | ButtonInteraction<Cached>
    | AutocompleteInteraction<Cached>
;
type InteractionHandlers<T extends Interaction> = Record<string, InteractionHandler<T>>;
type InteractionHandler<T extends Interaction> = (Interaction: T, Client: Client) => Promise<void>;
type InteractionMap = {
    [InteractionTypes.Autocomplete]: AutocompleteInteraction;
    [InteractionTypes.Button]: ButtonInteraction;
    [InteractionTypes.StringMenu]: StringSelectMenuInteraction;
    [InteractionTypes.UserMenu]: UserSelectMenuInteraction;
    [InteractionTypes.RoleMenu]: RoleSelectMenuInteraction;
    [InteractionTypes.ChannelMenu]: ChannelSelectMenuInteraction;
    [InteractionTypes.MentionableMenu]: MentionableSelectMenuInteraction;
};
type InteractionHandlersRegistry = { [K in InteractionTypes]: InteractionHandlers<InteractionMap[K]> };

export default class Command {
    private readonly _Administrator: boolean;
    private readonly _Command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    private readonly _Action: (Interaction: ChatInputCommandInteraction, Signal?: AbortSignal, Client?: Client) => Promise<void>;
    
    private readonly _Pool?: Map<string, AbortController>;
    private readonly _CancelMessage?: string;

    public get Action(): (Interaction: ChatInputCommandInteraction, Signal?: AbortSignal, Client?: Client) => Promise<void> {
        return this._Action;
    }
    public get Command(): SlashCommandBuilder | SlashCommandOptionsOnlyBuilder {
        return this._Command;
    }
    public get Administrator(): boolean {
        return this._Administrator;
    }
    public get Cancelable(): { Pool: Map<string, AbortController>; Message?: string; } | undefined {
        if(!this._Pool)
            return;

        return { Pool: this._Pool, Message: this._CancelMessage };
    }
    
    public readonly InteractionHandlers: InteractionHandlersRegistry = {
        [InteractionTypes.Autocomplete]: {},
        [InteractionTypes.Button]: {},
        [InteractionTypes.StringMenu]: {},
        [InteractionTypes.UserMenu]: {},
        [InteractionTypes.RoleMenu]: {},
        [InteractionTypes.ChannelMenu]: {},
        [InteractionTypes.MentionableMenu]: {}
    }; 

    private constructor(
        Command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
        Action: (Interaction: ChatInputCommandInteraction, Signal?: AbortSignal, Client?: Client) => Promise<void>,
        Extra?: {
            Cancelable?: {
                IsCancelable: boolean;
                Message?: string;
            },
            Administrator?: boolean
        }
    ) {
        this._Command = Command;
        this._Action = Action;
        this._Administrator = Extra?.Administrator ?? false;

        if(Extra?.Cancelable?.IsCancelable) {
            this._Pool = new Map();
            this._CancelMessage = Extra?.Cancelable.Message;
        }
    }

    public static New(
        C: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
        Extra?: {
            Cancelable?: { IsCancelable: boolean; Message?: string; },
            Administrator?: boolean
        }
    ): (Action: (Interaction: ChatInputCommandInteraction, Signal?: AbortSignal, Client?: Client) => Promise<void>) => Command {
        return (Action: (Interaction: ChatInputCommandInteraction, Signal?: AbortSignal, Client?: Client) => Promise<void>) => 
            new Command(C, Action, Extra);
    }

    public AddSingleInteractionHandler<T extends InteractionTypes>(
        Type: T,
        Name: string
    ): (Handler: InteractionHandler<InteractionMap[T]>) => this {
        return (Handler: InteractionHandler<InteractionMap[T]>): this => {
            Object.assign(this.InteractionHandlers[Type], { [Name]: Handler });
            return this;
        };
    }

    public AddMultipleInteractionHandlers<T extends InteractionTypes>(
        Type: T
    ): (Handlers: InteractionHandlers<InteractionMap[T]>) => this {
        return (Handlers: InteractionHandlers<InteractionMap[T]>): this => {
            Object.assign(this.InteractionHandlers[Type], Handlers);
            return this;
        };
    }

    public GetInteractionHandler<T extends InteractionTypes>(
        Type: T,
        Name: string
    ): InteractionHandler<InteractionMap[T]> | undefined {
        return this.InteractionHandlers[Type][Name];
    }
};
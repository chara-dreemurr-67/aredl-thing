import { ButtonInteraction, Client } from "discord.js";
import { ButtonType } from "./ConstructNavigationButtonRow.js";

export default (Discriminator: string = ""): (Handler: (Interaction: ButtonInteraction, Type: ButtonType, Client: Client) => Promise<void>) => Record<ButtonType, (Interaction: ButtonInteraction, Client: Client) => Promise<void>> => 
(Handler: (Interaction: ButtonInteraction, Type: ButtonType, Client: Client) => Promise<void>): Record<string, (Interaction: ButtonInteraction, Client: Client) => Promise<void>> => ({
    [`${Discriminator}${ButtonType.BackwardToStart}`]: async (Interaction: ButtonInteraction, Client: Client) => 
        await Handler(Interaction, ButtonType.BackwardToStart, Client)
    ,
    [`${Discriminator}${ButtonType.Backward}`]: async (Interaction: ButtonInteraction, Client: Client) => 
        await Handler(Interaction, ButtonType.Backward, Client)
    ,
    [`${Discriminator}${ButtonType.Forward}`]: async (Interaction: ButtonInteraction, Client: Client) => 
        await Handler(Interaction, ButtonType.Forward, Client)
    ,
    [`${Discriminator}${ButtonType.ForwardToEnd}`]: async (Interaction: ButtonInteraction, Client: Client) => 
        await Handler(Interaction, ButtonType.ForwardToEnd, Client)
});
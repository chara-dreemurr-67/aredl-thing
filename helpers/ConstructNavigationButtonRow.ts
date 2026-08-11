import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export enum ButtonType {
    BackwardToStart = "BackwardToStart",
    Backward = "Backward",
    Forward = "Forward",
    ForwardToEnd = "ForwardToEnd"
};

const ButtonLable: Record<ButtonType, string> = {
    [ButtonType.BackwardToStart]: "⇇",
    [ButtonType.Backward]: "←",
    [ButtonType.Forward]: "→",
    [ButtonType.ForwardToEnd]: "⇉"
};

const ConstructButton = (
    Type: ButtonType,
    InteractionID: string
): ButtonBuilder => {
    return new ButtonBuilder()
        .setCustomId(InteractionID)
        .setLabel(ButtonLable[Type])
        .setStyle(ButtonStyle.Primary)
    ;
};

export default (
    PageIndex: number,
    MaxPage: number,
    InteractionIDs: Record<ButtonType, string>
): ActionRowBuilder<ButtonBuilder> => {
    const BackwardToStartButton: ButtonBuilder = ConstructButton(
        ButtonType.BackwardToStart,
        InteractionIDs[ButtonType.BackwardToStart]
    );
    const BackwardButton: ButtonBuilder = ConstructButton(
        ButtonType.Backward,
        InteractionIDs[ButtonType.Backward]
    );
    const ForwardButton: ButtonBuilder = ConstructButton(
        ButtonType.Forward,
        InteractionIDs[ButtonType.Forward]
    );
    const ForwardToEndButton: ButtonBuilder = ConstructButton(
        ButtonType.ForwardToEnd,
        InteractionIDs[ButtonType.ForwardToEnd]
    );
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            ...[BackwardToStartButton, BackwardButton, ForwardButton, ForwardToEndButton].slice(
                ...(PageIndex === MaxPage ? [0, 2] : PageIndex === 1 ? [2, 4] : [0, 4])
            )
        )
    ;
};
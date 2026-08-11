import dotenv from "dotenv";

dotenv.config();

export default {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN ?? "",
    CLIENT_ID: process.env.CLIENT_ID ?? "",
    ADMINISTRATOR_IDS: ((): string[] => {
        try {
            return (process.env.ADMINISTRATOR_IDS ? JSON.parse(process.env.ADMINISTRATOR_IDS) : []) as string[];
        }
        catch {
            return [];
        }
    })(),
    EMBED_EXPIRY_DURATION: /^\+?\d+$/.test(process.env.EMBED_EXPIRY_DURATION ?? "") ? Number(process.env.EMBED_EXPIRY_DURATION) : 900
};
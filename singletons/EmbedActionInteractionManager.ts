import EventEmitter from "events";
import GenerateUniqueUUID from "../helpers/GenerateUniqueUUID.js";
import LoadEnv from "./LoadEnv.js";

export interface Action {
    CommandName: string;
    ActionName: string;
    MetaID?: string;
    Timeout: NodeJS.Timeout;
};

interface Registry {
    [UserID: string]: {
        // assert type before usage
        [InteractionUUID: string]: Action;
    };
}

interface MetaRegistry {
    [MetaID: string]: {
        Meta: any;
        Timeout: NodeJS.Timeout;
    };
}

export default new class extends EventEmitter {
    public readonly InteractionRegistry: Registry = {};
    public readonly MetaRegistry: MetaRegistry = {};

    public GetInteractionMeta<T>(Owner: string, InteractionID: string): T | undefined {
        const MetaID: string | undefined = this.InteractionRegistry[Owner]?.[InteractionID]?.MetaID;
        if(!MetaID)
            return;
        return this.MetaRegistry[MetaID].Meta;
    }

    public AddInteraction(Owner: string, CommandName: string, ActionName: string): string; 
    public AddInteraction(Owner: string, CommandName: string, ActionName: string, MetaID: string): string;
    /**
     * [InteractionID, MetaID]
     */
    public AddInteraction(Owner: string, CommandName: string, ActionName: string, MetaID?: string): string {
        this.InteractionRegistry[Owner] ??= {};
        const InteractionID: string = GenerateUniqueUUID(UUID => !!this.InteractionRegistry[Owner][UUID]);

        this.InteractionRegistry[Owner][InteractionID] = {
            CommandName,
            ActionName,
            Timeout: setTimeout((): void => {
                this.emit("LifeTimeEnded", InteractionID);
                delete this.InteractionRegistry[Owner][InteractionID];

                if(Object.keys(this.InteractionRegistry[Owner]).length === 0) {
                    delete this.InteractionRegistry[Owner];
                }
            }, LoadEnv.EMBED_EXPIRY_DURATION * 1000)
        };

        if(MetaID) {
            if(!this.MetaRegistry[MetaID])
                throw new Error(`Metadata ID "${MetaID}" does not exists.`);
            this.InteractionRegistry[Owner][InteractionID].MetaID = MetaID;
        }

        return InteractionID;
    }

    public RemoveInteraction(Owner: string, InteractionID: string): void {
        if(!this.InteractionRegistry[Owner]?.[InteractionID])
            return;

        clearTimeout(this.InteractionRegistry[Owner][InteractionID].Timeout);
        delete this.InteractionRegistry[Owner][InteractionID];
        if(Object.keys(this.InteractionRegistry[Owner]).length === 0) {
            delete this.InteractionRegistry[Owner];
        }
    }

    public RefreshInteraction(Owner: string, InteractionID: string): void {
        if(!this.InteractionRegistry[Owner]?.[InteractionID])
            return;

        clearTimeout(this.InteractionRegistry[Owner][InteractionID].Timeout);
        this.InteractionRegistry[Owner][InteractionID].Timeout = setTimeout((): void => {
            this.emit("LifeTimeEnded", InteractionID);
            delete this.InteractionRegistry[Owner][InteractionID];

            if(Object.keys(this.InteractionRegistry[Owner]).length === 0) {
                delete this.InteractionRegistry[Owner];
            }
        }, LoadEnv.EMBED_EXPIRY_DURATION * 1000);
    }

    public AddMeta<T>(Meta: T): string {
        const MetaID: string = GenerateUniqueUUID(UUID => !!this.MetaRegistry[UUID]);
        this.MetaRegistry[MetaID] = {
            Meta,
            Timeout: setTimeout(() => delete this.MetaRegistry[MetaID], (LoadEnv.EMBED_EXPIRY_DURATION + 300) * 1000)
        };
        return MetaID;
    }

    public RemoveMeta(MetaID: string): void {
        if(!this.MetaRegistry[MetaID])
            return;

        clearTimeout(this.MetaRegistry[MetaID].Timeout);
        delete this.MetaRegistry[MetaID];
    }

    public RefreshMeta(MetaID: string): void {
        if(!this.MetaRegistry[MetaID])
            return;

        clearTimeout(this.MetaRegistry[MetaID].Timeout);
        this.MetaRegistry[MetaID].Timeout = setTimeout(() => delete this.MetaRegistry[MetaID], (LoadEnv.EMBED_EXPIRY_DURATION + 300) * 1000);
    }
}();
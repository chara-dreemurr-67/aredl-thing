import { pathToFileURL } from "url";
import Command from "../types/Command.js";
import fs from "fs/promises"; 
import path from "path";

export default new class {
    private readonly Registry: Map<string, Command> = new Map<string, Command>();
    private Loaded: boolean = false;

    public Register = (Command: Command): void => {
        this.Registry.set(Command.Command.name, Command);
    };

    public async LoadCommands(): Promise<void> {
        if(this.Loaded)
            return;

        this.Loaded = true;

        const PathToDir: string = path.join(import.meta.dirname, "..", "commands");
        const CommandFiles: string[] = (await fs.readdir(PathToDir))
            .filter(file => file.endsWith(".ts") || file.endsWith(".js"))
        ;

        for(const File of CommandFiles) {
            const Command: Command = (await import(pathToFileURL(path.join(PathToDir, File)).href)).default;
            if(Command.Cancelable) 
                Command.Command.setDescription(`${Command.Command.description} (Cancelable)`);

            if(Command.Administrator)
                Command.Command.setDescription(`${Command.Command.description} (Administrator Command)`);
            this.Register(Command);
        }
    }
    
    public Get(Name: string): Command | undefined {
        return this.Registry.get(Name)
    }
    
    public Values(): IterableIterator<Command> {
        return this.Registry.values();
    }

    public Has(Name: string): boolean {
        return this.Registry.has(Name);
    }
}();
import Database, { type Database as DBType, type Statement } from "better-sqlite3";
import fs from "fs/promises";
import path from "path";
import APIConnector from "./APIConnector.js";
import type { AREDLLevelDetailResponse, AREDLLevelListResponse, AREDLUser } from "../types/AREDLLevelListResponse.js";

const DBDir: string = path.join(import.meta.dirname, "..", "database");
const DBFile: string = path.join(DBDir, "Database.db");
await fs.mkdir(DBDir, { recursive: true });

const DB: DBType = new Database(DBFile);
DB.pragma("journal_mode = WAL");
DB.exec(`
    CREATE TABLE IF NOT EXISTS Levels(
        ID TEXT PRIMARY KEY,
        Position INTEGER NOT NULL,
        Name TEXT NOT NULL,
        Points INTEGER NOT NULL,
        LevelID TEXT NOT NULL,
        TwoPlayers INTEGER NOT NULL,
        Tags TEXT,
        Description TEXT,
        Song INTEGER,
        EDELEnjoyment REAL,
        GDDLTier REAL,
        NLWTier TEXT,
        Publisher TEXT,
        Verifiers TEXT,
        Creators TEXT,

        CHECK(TwoPlayers IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS Users(
        ID TEXT PRIMARY KEY,
        Username TEXT NOT NULL,
        GlobalName TEXT NOT NULL
    );
`);

export interface User {
    Username: string;
    GlobalName: string;
}
interface UserRow extends User {
    ID: string;
}

export interface Level {
    Position: number;
    Name: string;
    Points: number;
    LevelID: number;
    TwoPlayers: boolean;
    Tags: string[] | null;
    Description: string | null;
    Song: number | null;
    EDELEnjoyment: number | null;
    GDDLTier: number | null;
    NLWTier: string | null;
    
    Publisher: string | null;
    Verifiers: string[] | null;
    Creators: string[] | null;
}
interface LevelRow {
    ID: string;
    Position: number;
    Name: string;
    Points: number;
    LevelID: number;
    TwoPlayers: 0 | 1;
    Tags: string | null;
    Description: string | null;
    Song: number | null;
    EdelEnjoyment: number | null;
    GDDLTier: number | null;
    NLWTier: string | null;

    Publisher: string | null;
    Verifiers: string | null;
    Creators: string | null;
}

class DataManager {
    public readonly Levels: Record<string, Level> = Object.fromEntries(
        DB.prepare<[], LevelRow>("SELECT * FROM Levels").all().map(Level =>
            [
                Level.ID,
                {
                    Position: Level.Position,
                    Name: Level.Name,
                    Points: Level.Points,
                    LevelID: Level.LevelID,
                    TwoPlayers: Boolean(Level.TwoPlayers),
                    Tags: JSON.parse(Level.Tags as string),
                    Description: Level.Description,
                    Song: Level.Song,
                    EDELEnjoyment: Level.EdelEnjoyment,
                    GDDLTier: Level.GDDLTier,
                    NLWTier: Level.NLWTier,
                    Publisher: Level.Publisher,
                    Verifiers: JSON.parse(Level.Verifiers as string),
                    Creators: JSON.parse(Level.Creators as string)
                }
            ]
        )
    );
    public readonly Users: Record<string, User> = Object.fromEntries(
        DB.prepare<[], UserRow>("SELECT * FROM Users").all().map(User => 
            [
                User.ID,
                {
                    Username: User.Username,
                    GlobalName: User.GlobalName
                }
            ]
        )
    );
    
    public readonly AddLevelSTMT: Statement<[
        string,
        number,
        string,
        number,
        number,
        0 | 1,
        string | null,
        string | null,
        number | null,
        number | null,
        number | null,
        string | null
    ], void> = DB.prepare(`
        INSERT INTO Levels
        (ID, Position, Name, Points, LevelID, TwoPlayers, Tags, Description, Song, EdelEnjoyment, GDDLTier, NLWTier)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    public readonly UpdateLevelSTMT: Statement<[string, string, string, string], void> = DB.prepare(`
        UPDATE Levels SET
        Publisher = ?,
        Verifiers = ?,
        Creators = ?
        WHERE ID = ?
    `);
    public readonly AddUserSTMT: Statement<[string, string, string], void> = DB.prepare(`
        INSERT INTO Users
        (ID, Username, GlobalName)
        VALUES(?, ?, ?)
        ON CONFLICT DO NOTHING
    `);

    public async GetLevelList(): Promise<Record<string, Level> | undefined> {
        if(Object.keys(this.Levels).length) 
            return this.Levels;
        
        const Response: Response = await APIConnector.GetAllLevels();
        if(!Response.ok)
            return;
    
        const LevelList: AREDLLevelListResponse[] = await Response.json() as AREDLLevelListResponse[];
        const Levels: [string, Level][] = LevelList.map(Level => 
            [
                Level.id,
                {
                    Position: Level.position,
                    Name: Level.name,
                    Points: Level.points,
                    LevelID: Level.level_id,
                    TwoPlayers: Level.two_player,
                    Tags: Level.tags,
                    Description: Level.description,
                    Song: Level.song,
                    EDELEnjoyment: Level.edel_enjoyment,
                    GDDLTier: Level.gddl_tier,
                    NLWTier: Level.nlw_tier,
                    Publisher: null,
                    Verifiers: null,
                    Creators: null
                }
            ]
        );
        Object.assign(this.Levels, Object.fromEntries(Levels));

        for(const Level of LevelList) {
            this.AddLevelSTMT.run(
                Level.id,
                Level.position,
                Level.name,
                Level.points,
                Level.level_id,
                Number(Level.two_player) as 0 | 1,
                Level.tags ? JSON.stringify(Level.tags) : null,
                Level.description,
                Level.song,
                Level.edel_enjoyment,
                Level.gddl_tier,
                Level.nlw_tier
            );
        }

        return this.Levels;
    }

    public async GetLevel(LevelID: string): Promise<Level | undefined> {
        const Level: Level = this.Levels[LevelID];

        if(!Level.Publisher) {
            const LevelDetailResponse: Response = await APIConnector.GetLevelDetails(LevelID);
            const LevelCreatorsResponse: Response = await APIConnector.GetLevelCreators(LevelID);
            if(!LevelDetailResponse.ok || !LevelCreatorsResponse.ok)
                return;

            const LevelDetail: AREDLLevelDetailResponse = await LevelDetailResponse.json() as AREDLLevelDetailResponse;
            const LevelCreators: AREDLUser[] = await LevelCreatorsResponse.json() as AREDLUser[];
            const Verifiers: string[] = LevelDetail.verifications.map(V => V.submitted_by.id);
            const Creators: string[] = LevelCreators.map(C => C.id);

            const People: AREDLUser[] = [
                LevelDetail.publisher, 
                ...LevelDetail.verifications.map(V => V.submitted_by),
                ...LevelCreators
            ];

            Level.Publisher = LevelDetail.publisher.id;
            Level.Verifiers = Verifiers;
            Level.Creators = Creators;

            this.UpdateLevelSTMT.run(
                LevelDetail.publisher.id,
                JSON.stringify(Verifiers),
                JSON.stringify(Creators),
                LevelID
            );

            for(const P of People) {
                this.AddUserSTMT.run(
                    P.id,
                    P.username,
                    P.global_name
                );

                this.Users[P.id] = {
                    Username: P.username,
                    GlobalName: P.global_name
                };
            }
        }

        return Level;
    }

    public GetUser(UserID: string): User {
        return this.Users[UserID];
    }

    public async Search({
        Name, MaxPlacement, MinPlacement, TwoPlayers
    }: { Name?: string | null; MaxPlacement?: number| null; MinPlacement?: number| null; TwoPlayers?: boolean| null; }): Promise<Record<string, Level>> {
        return Object.fromEntries(Object.entries(await this.GetLevelList() ?? {}).filter(([, Level]) =>
            (Name == undefined || Level.Name.toLowerCase().trim().includes(Name.toLowerCase().trim())) &&
            (MaxPlacement == undefined || Level.Position <= MaxPlacement) &&
            (MinPlacement == undefined || Level.Position >= MinPlacement) &&
            (TwoPlayers == undefined || Level.TwoPlayers === TwoPlayers)
        ));
    }
}

export default {
    DB,
    Manager: new DataManager()
};
export default new class {
    private readonly BaseAPIURL: string = "https://api.aredl.net/v2";

    public async GetAllLevels(): Promise<Response> {
        return await fetch(`${this.BaseAPIURL}/api/aredl/levels?exclude_legacy=true`);
    }

    public async GetLevelDetails(LevelID: string): Promise<Response> {
        return await fetch(`${this.BaseAPIURL}/api/aredl/levels/${LevelID}`);
    }

    public async GetLevelCreators(LevelID: string): Promise<Response> {
        return await fetch(`${this.BaseAPIURL}/api/aredl/levels/${LevelID}/creators`);
    }

    public async PGetAllLevels(): Promise<Response> {
        return await fetch(`${this.BaseAPIURL}/api/arepl/levels?exclude_legacy=true`);
    }

    public async PGetLevelDetails(LevelID: string): Promise<Response> {
        return await fetch(`${this.BaseAPIURL}/api/arepl/levels/${LevelID}`);
    }

    public async PGetLevelCreators(LevelID: string): Promise<Response> {
        return await fetch(`${this.BaseAPIURL}/api/arepl/levels/${LevelID}/creators`);
    }
}();
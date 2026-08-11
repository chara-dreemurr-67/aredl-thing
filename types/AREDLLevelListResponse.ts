export interface AREDLLevelListResponse {
    id: string;
    position: number;
    name: string;
    points: number;
    legacy: boolean;
    level_id: number;
    two_player: boolean;
    tags: string[] | null;
    description: string | null;
    song: number | null;
    edel_enjoyment: number | null;
    is_edel_pending: boolean;
    gddl_tier: number | null;
    nlw_tier: string | null;
}

export interface AREDLLevelDetailResponse extends AREDLLevelListResponse {
    publisher: AREDLUser;
    verifications: AREDLLevelVerification[];
}

export type AREDLLevelCreators = AREDLUser[];

export interface AREDLUser {
    id: string;
    username: string;
    global_name: string;
}

export interface AREDLLevelVerification {
    id: string;
    submitted_by: AREDLUser;
    mobile: boolean;
    video_url: string;
    hide_video: boolean;
    achieved_at: string;
    created_at: string;
    updated_at: string;
}
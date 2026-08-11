import crypto from "crypto";

export default (Prerequisite: (UUID: string) => boolean): string => {
    let UUID: string;

    do UUID = crypto.randomUUID()
    while(Prerequisite(UUID));

    return UUID;
};
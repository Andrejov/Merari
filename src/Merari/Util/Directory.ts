import path from 'path';

export default class Directory
{
    private static envResolve(name: string, def: string, filename?: string)
    {
        const env = process.env[name];

        return path.resolve(
            `${env ?? def}/${filename ?? ''}`
        );
    }

    static get(filename?: string): string
    {
        return this.envResolve("DIR", process.cwd(), filename);
    }

    static getConfig(filename?: string): string
    {
        return this.envResolve(
            "CONFIGDIR",
            `${this.get()}/config`,
            filename
        );
    }
}
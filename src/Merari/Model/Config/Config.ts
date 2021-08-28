import ConfigSection, { ConfigValue } from "./ConfigSection";
import fs from 'fs';
import Logger from "../../Util/Logger";

export default class Config extends ConfigSection
{
    path: string;

    constructor(logger: Logger | undefined, path: string)
    {
        super(logger);

        this.logger = logger;
        this.path = path;
    }

    loadText(text: string)
    {
        try {
            const json = JSON.parse(text);

            this.loadFrom(json);
        } catch (error) {
            this.logger?.err(`Could not parse text to JSON. Err: ${error}`);
        }
    }

    loadFile(path: string)
    {
        try {
            const text = fs.readFileSync(path).toString();

            this.loadText(text);
        } catch (error) {
            this.logger?.err(`Could not load config file. Err: ${error}`);
        }
    }

    load()
    {
        this.loadFile(this.path);
    }

    dumpText(beautify?: boolean): string
    {
        return JSON.stringify(
            this.dump(),
            null,
            beautify ? 4 : undefined
        );
    }

    saveFile(path: string)
    {
        try {
            fs.writeFileSync(
                path,
                this.dumpText(true)
            );
        } catch (error) {
            this.logger?.err(`Could not save config file. Err: ${error}`);
        }
    }

    save()
    {
        this.saveFile(this.path);
    }

    init(defs: {
        [key: string]: ConfigValue
    }) {
        const keys = Object.keys(defs);

        keys.forEach(k => {
            this.setDefault(k, defs[k]);
        })

        this.copyDefaults();

        this.load();
        this.save();
    }
}
import Logger from "../../Util/Logger";

export default class ConfigSection
{
    public map: ConfigMap = {};

    public defaults: ConfigMap = {};

    public logger?: Logger;

    constructor(logger?: Logger)
    {
        this.logger = logger;
    }

    get(key: string): ConfigValue | undefined
    {
        return this.map[key];
    }

    getNumber(key: string): number
    {
        return this.map[key] as number;
    }
    getString(key: string): string
    {
        return this.map[key] as string;
    }
    getSection(key: string): ConfigSection
    {
        return this.map[key] as ConfigSection;
    }
    getList<T extends ConfigValue>(key: string): T[]
    {
        return this.map[key] as T[];
    }

    set(key: string, value: ConfigValue | undefined): void
    {
        if(value == undefined)
        {
            if(this.map[key] != undefined)
            {
                delete this.map[key];
            }
        }else{
            this.map[key] = value;
        }
    }

    setDefault(key: string, value: ConfigValue | undefined): void
    {
        if(value == undefined)
        {
            if(this.defaults[key] != undefined)
            {
                delete this.defaults[key];
            }
        }else{
            this.defaults[key] = value;
        }
    }

    copyDefaults(): void
    {
        const keys = Object.keys(this.defaults);

        keys.forEach(k => {
            const def = this.defaults[k];

            if(Array.isArray(def))
            {
                this.map[k] = def.map(v => 
                    v instanceof ConfigSection ? v.clone() : v
                );
            } else {
                this.map[k] = def instanceof ConfigSection ? def.clone() : def;
            }
        })
    }

    private cloneMap = (map: ConfigMap): ConfigMap =>
    {
        const keys = Object.keys(map);
        const out: ConfigMap = {};

        keys.forEach(k => {
            const value = map[k];

            if(Array.isArray(value))
            {
                out[k] = value.map(e => {
                    return e instanceof ConfigSection ? e.cloneDefault() : e;
                });
            } 
            else
            {
                out[k] = value instanceof ConfigSection ? value.cloneDefault() : value;
            }
        })

        return out;
    }

    clone(): ConfigSection
    {
        const ns = new ConfigSection();

        ns.map = this.cloneMap(this.map);
        ns.defaults = this.cloneMap(this.defaults);

        return ns;
    }

    cloneDefault(): ConfigSection
    {
        const ns = this.clone();

        ns.copyDefaults();

        return ns;
    }

    loadFrom(src: {
        [key: string]: ConfigSourceValue
    }, traceString?: string)
    {
        const keys = Object.keys(src);

        keys.forEach(k => {
            const entry = src[k];

            const parseEntry = (key: string, value: ConfigSourceValueSingular): 
                    ConfigValueSingular | undefined => {
                const type = typeof value;

                if(value == undefined)
                {
                    // do not add entry
                    if(this.logger) this.logger.trace(`Unexpected config value undefined at key ${traceString ? traceString + '/' : ''}${key}`);
                }
                else if(type === 'object')
                {
                    const sectionSrc = value as ConfigSource;
                    const section = new ConfigSection(this.logger);
                    section.loadFrom(sectionSrc, (traceString ?? '') + '/' + key);

                    return section;
                }
                else if(type == 'string' || type == 'number')
                {
                    return value as ConfigValueSingular;
                }else{
                    if(this.logger) this.logger.trace(`Unexpected config value typeof ${type} at key ${traceString ? traceString + '/' : ''}${key}`);
                }
            }

            if(Array.isArray(entry))
            {
                const array = entry.map((value, index) => {
                    return parseEntry(`${k}:${index}`, value)
                }).filter(v => v != undefined);

                this.set(k, array as ConfigValueSingular[]);
            }else{
                this.set(k, parseEntry(k, entry));
            }
        })
    }

    dump(): ConfigSource
    {
        const output: ConfigSource = {};

        const keys = Object.keys(this.map);

        keys.forEach(k => {
            const entry = this.map[k];

            if(Array.isArray(entry))
            {
                output[k] = entry.map(v => v instanceof ConfigSection ? v.dump() : v);
            }else{
                output[k] = entry instanceof ConfigSection ? entry.dump() : entry;
            }
        })

        return output;
    }

    clear()
    {
        this.map = {}
    }
    
    clearDefaults()
    {
        this.defaults = {};
    }

    clearAll()
    {
        this.clearDefaults();
        this.clear();
    }
}

export type ConfigValueSingular = ConfigSection | string | number;
export type ConfigValue = ConfigValueSingular | ConfigValueSingular[];
export type ConfigMap = { [key: string]: ConfigValue }

export type ConfigSourceValueSingular = ConfigSource | string | number | undefined;
export type ConfigSourceValue = ConfigSourceValueSingular | ConfigSourceValueSingular[];
export type ConfigSource = { [key: string]: ConfigSourceValue }
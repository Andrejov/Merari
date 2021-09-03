import Logger from "../../Util/Logger";

export default class ConfigSection
{
    public map: ConfigMap = {};

    public defaults: ConfigMap = {};

    public env?: string;

    public logger?: Logger;

    constructor(logger?: Logger, env?: string)
    {
        this.logger = logger;
        this.env = env;
    }

    get(key: string): ConfigValue | undefined
    {
        if(this.env)
        {
            const envkey = `cfg_${this.env}_${key}`.toUpperCase();
            const ev = process.env[envkey];

            if(ev)
            {
                try {
                    return JSON.parse(ev);
                } catch (err1) {
                    // try {
                    //     return JSON.parse(`"${ev}"`)
                    // } catch (err2) {
                    //     if(this.logger) this.logger.err(`Could not parse env key ${envkey}. ${err1} ${err2}`)
                    // }
                    try {
                        return JSON.parse(ev.split("'").join('"'));
                    } catch (error) {
                        return ev;
                    }
                }
            }
        }

        return this.map[key];
    }

    getNumber(key: string): number
    {
        return this.get(key) as number;
    }
    getString(key: string): string
    {
        return this.get(key) as string;
    }
    getBool(key: string): boolean
    {
        return this.get(key) as boolean;
    }
    getSection(key: string): ConfigSection
    {
        return this.get(key) as ConfigSection;
    }
    getList<T extends ConfigValue>(key: string): T[]
    {
        return this.get(key) as T[];
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

    setPath(path: string, value?: ConfigValue)
    {
        const keys = path.split('.');

        if(keys.length == 1)
        {
            this.set(path, value)
        } else {
            const section = this.getSection(keys.shift() as string);

            if(!(section instanceof ConfigSection))
            {
                if(this.logger) this.logger.trace(`Could not get section from path '${path}'`);
                return;
            }

            section.setPath(keys.join('.'), value);
        }
    }

    getPath(path: string): ConfigValue | undefined
    {
        const keys = path.split('.');

        if(keys.length == 1)
        {
            return this.get(path);
        } else {
            const section = this.getSection(keys.shift() as string);

            if(!(section instanceof ConfigSection))
            {
                if(this.logger) this.logger.trace(`Could not get section from path '${path}'`);
                return undefined;
            }

            return section.getPath(keys.join('.'));
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

    clone(logger?: Logger): ConfigSection
    {
        const ns = new ConfigSection(logger ?? this.logger, this.env);

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

                if(value == undefined || value == null)
                {
                    // do not add entry
                    if(this.logger) this.logger.trace(`Unexpected config value undefined at key ${traceString ? traceString + '/' : ''}${key}`);
                }
                else if(type === 'object')
                {
                    const sectionSrc = value as ConfigSource;
                    const section = new ConfigSection(this.logger, `${this.env}_${k}`);
                    section.loadFrom(sectionSrc, (traceString ?? '') + '/' + key);

                    return section;
                }
                else if(type == 'string' || type == 'number')
                {
                    return value as ConfigValueSingular;
                }
                else if(type == 'boolean')
                {
                    return value as boolean;
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

export type ConfigValueSingular = ConfigSection | string | number | boolean;
export type ConfigValue = ConfigValueSingular | ConfigValueSingular[];
export type ConfigMap = { [key: string]: ConfigValue }

export type ConfigSourceValueSingular = ConfigSource | string | number | boolean | undefined;
export type ConfigSourceValue = ConfigSourceValueSingular | ConfigSourceValueSingular[];
export type ConfigSource = { [key: string]: ConfigSourceValue }
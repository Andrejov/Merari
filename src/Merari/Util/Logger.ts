import colors from 'colors';

export default class Logger
{
    public parent?: Logger;
    public subname?: string;
    public logLevel: LogLevel = LogLevel.ALL;

    public logCount: number = 0;

    public logConfig: LogLevelConfig[] = [
        new LogLevelConfig(LogLevel.GREETING, 'BOOT', colors.green),
        new LogLevelConfig(LogLevel.CRITICAL, '.ERR', colors.red),
        new LogLevelConfig(LogLevel.WARNING, 'WARN', colors.yellow),
        new LogLevelConfig(LogLevel.INFO, 'INFO', colors.white),
        new LogLevelConfig(LogLevel.DEBUG, '.DBG', colors.yellow.dim),
        new LogLevelConfig(LogLevel.TRACE, '.TRC', colors.gray),
    ]

    public log(value: string, level?: LogLevel): number
    {
        if(level == undefined) level = LogLevel.INFO;

        if(this.parent)
        {
            this.logCount += 1;
            return this.parent.log(this.subname ? 
                `..${this.subname.substr(0, 7).padEnd(9,'.')} ${value}` :
                `. ${value}`, level);
        }else{
            if(level <= this.logLevel)
            {
                const now = new Date();
                const nowstring = now.toISOString().substr(11,8);

                const config = this.logConfig.find(c => c.level == level)
                    ?? new LogLevelConfig(LogLevel.UNKNOWN, "UNKW", colors.white);

                this.logCount += 1;

                console.log(
                    config.color(
                        `[${nowstring}] ..${config.string}.. ${value}`
                    )
                )
            }

            return this.logCount;
        }
    }

    public child(subname?: string): Logger
    {
        const logger = new Logger();
        logger.parent = this;
        logger.subname = subname;

        return logger;
    }

    public greet(value: string): number
    {
        return this.log(value, LogLevel.GREETING);
    }
    public err(value: string): number
    {
        return this.log(value, LogLevel.CRITICAL);
    }
    public warn(value: string): number
    {
        return this.log(value, LogLevel.WARNING);
    }
    public info(value: string): number
    {
        return this.log(value, LogLevel.INFO);
    }
    public debug(value: string): number
    {
        return this.log(value, LogLevel.DEBUG);
    }
    public trace(value: string): number
    {
        return this.log(value, LogLevel.TRACE);
    }

    public msg(caller: Object)
    {
        const name = caller.constructor.name;

        return {
            starting: () => {
                this.info(`Starting ${name}`);
            }
        }
    }
}

export enum LogLevel
{
    ALL = Number.MAX_SAFE_INTEGER,
    UNKNOWN = -2,
    GREETING = -1,
    CRITICAL = 0,
    WARNING = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}

export class LogLevelConfig
{
    public level: LogLevel;
    public string: string;
    public color: colors.Color;

    constructor(level: LogLevel, string: string, color: colors.Color)
    {
        this.level = level;
        this.string = string;
        this.color = color;
    }
}
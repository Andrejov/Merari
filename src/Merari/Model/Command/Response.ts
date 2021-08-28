import { Permission } from "./Permissions";

export default class Response
{
    status: ResponseStatus;
    message?: string;

    badArg?: number;
    exception?: any;
    permission?: Permission;

    constructor(
        status: ResponseStatus, 
        message?: string | string[] | null, 
        badArg?: number | null,
        exception?: any,
        permission?: any
    ) {
        this.status = status;
        this.message = Array.isArray(message) ? message.join('\r\n') : message ?? undefined;
        this.badArg = badArg ?? undefined;
        this.exception = exception ?? undefined;
        this.permission = permission ?? undefined;
    }

    static ok()
    {
        return new Response(ResponseStatus.OK);    
    }
    static empty()
    {
        return new Response(ResponseStatus.EMPTY);
    }
    static err(msg?: string | string[])
    {
        return new Response(ResponseStatus.ERROR, msg);
    }
    static arg(argIndex: number)
    {
        return new Response(ResponseStatus.BAD_ARG, null, argIndex);
    }
    static bad(msg: string | string[])
    {
        return new Response(ResponseStatus.BAD_REQUEST, msg);
    }
    static perm(perm: Permission, msg?: string | string[])
    {
        return new Response(ResponseStatus.FORBIDDEN, msg, null, null, perm);
    }
    static except(err: Object, msg?: string | string[])
    {
        return new Response(ResponseStatus.EXCEPTION, msg, null, err);
    }
    static delete()
    {
        return new Response(ResponseStatus.DELETE);
    }
}

export enum ResponseStatus
{
    EMPTY = 0,
    OK = 1,
    ERROR = 2,
    BAD_ARG = 3,
    BAD_REQUEST = 4,
    FORBIDDEN = 5,
    
    EXCEPTION = 9,
    DELETE = 10
}
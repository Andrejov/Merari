export default class Version
{
    static packageJson = require('./../../../package.json'); 

    static get(): string
    {
        return this.packageJson.version;
    }
}
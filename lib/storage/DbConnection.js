import events from "events";

export default class DbConnection extends events.EventEmitter
{
    constructor(config)   //构造函数
    {
        super();
        if (config)
        {
            if (!config.name)
            {
                throw new Error(`"name" is not found in the config section of mongo.`);
            }
            this._name = config.name;
            if (!config.url)
            {
                throw new Error(`"url" is not found in the config section of mongo.`);
            }
        }
        else
        {
            throw new Error("Config section of connection can not be null or empty");
        }
        this._config = config;
    }


    get name()
    {
        return this._name;
    }

    get config()
    {
        return this._config;
    }

    get internalConnection()
    {
        return this._internalConnection;
    }


    async connect()
    {
        throw new Error("Must be implemented in the derived class.");
    }
}

import logger from "winston";
import config from "../../config";
//import mongo from "./mongo";

let _storage = {};

function setup()   //打开链接默认数据库：henry-home-2501
{
    const defaultConnectionName = config.get("storage.default");
    if (defaultConnectionName)
    {
        if (config.get(`storage.connections.${defaultConnectionName}`))
        {
            const configSection = config.get(`storage.connections.${defaultConnectionName}`);   //henry-home-2501
            let provider = null;
            switch (configSection.provider)
            {
                case "mongo":
                    provider = require("./mongo");
                    if (provider.default)
                    {
                        // In ES6, use provider.default
                        provider = provider.default;
                    }
                    break;
                default:
                    throw new Error(`The provider of connection "${defaultConnectionName}" is "${configSection.provider}" which is not supported.`);
            }
            _storage.name = defaultConnectionName;
            _storage.provider = provider;
            _storage.SensorStorage = provider.SensorStorage;  //mongo.SensorStorage.js
            configSection.name = defaultConnectionName;
            _storage.connection = new provider.DbConnection(configSection);  //mongo.DbConnection(henry-home-2501)
        }
        else
        {
            throw new Error(`Default connection "${defaultConnectionName}" not found.`);
        }
    }
    else
    {
        throw new Error(`Default connection must be specified in "storage.default".`);
    }
}

setup();
export default _storage;
import settings from "./settings";

/**
*  判定输出settings是context（henry-home-2501）还是defaultValue
*/
settings.get = (function(key, defaultValue = undefined) {  
    const parts = key.split(".");
    let context = this;
    for (let i = 0; i < parts.length; i++)
    {
        context = context[parts[i]];
        if (!context)
        {
            return defaultValue;
        }
    }
    return context !== undefined ? context : defaultValue;
}).bind(settings);

export default settings;
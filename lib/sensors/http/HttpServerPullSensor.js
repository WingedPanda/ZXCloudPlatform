import logger from "winston";
import request from "request-promise";

import Sensor from "../Sensor";

export default class HttpServerPullSensor extends Sensor
{
    constructor(config)
    {
        super(config);
        this._monitoring = false;
    }


    get monitoring()
    {
        return this._monitoring;
    }


    startMonitor()
    {
        this._monitoring = true;
        this.updateValue();
        this.updateValuePoll();
    }

    stopMonitor()
    {
        this._monitoring = false;
    }


    async updateValue()
    {
        let value = null;
        try
        {
            value = await request(this.config.monitor.url, { json: true });
        }
        catch (err)
        {
            logger.error(`- [${this.name}] Fail to update from sensor.`);
            throw err;
        }
        this.setValue(value);
    }

    updateValuePoll()
    {
        if (this.monitoring)
        {
            setTimeout(async () => {
                if (this.monitoring)
                {
                    try
                    {
                        await this.updateValue();
                    }
                    catch (e)
                    {
                        logger.error(e);
                    }
                    finally
                    {
                        if (this.monitoring)
                        {
                            this.updateValuePoll();
                        }
                    }
                }
            }, this.config.monitor.interval);
        }
    }
}

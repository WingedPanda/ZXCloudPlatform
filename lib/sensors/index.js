import logger from "winston";

import HttpClientPushSensor from "./http/HttpClientPushSensor";
import HttpServerPullSensor from "./http/HttpServerPullSensor";

import app from "../server/app";
import storage from "../storage";

let sensors = require("../../config/sensors");
if (sensors.default)
{
    // In ES6, use sensors.default
    sensors = sensors.default;
}

async function loadSensors()
{
    logger.info("Loading sensors...");
    let s = null;
    for (let i = 0; i < sensors.length; i++)
    {
        s = sensors[i];
        logger.info(`- [${s.id}] - ${s.name}`);
        let sensor = null;
        try
        {
            if (s.monitor.mode === "http-server-pull")
            {
                sensor = new HttpServerPullSensor(s);
            }
            else if (s.monitor.mode === "http-client-push")
            {
                sensor = new HttpClientPushSensor(s);
            }
            else
            {
                throw new Error(`"${s.monitor.mode}" is not a supported sensor monitor mode. Try "http-server-pull" or "http-client-push".`);
            }
            // Setup router
            app.use("/api/sensor/" + sensor.id, sensor.router);
            // Re-map indices for sensor.
            sensors[i] = sensor;
            if (s.id)
            {
                sensors[s.id] = sensor;
            }
        }
        catch (err)
        {
            logger.error(err);
            throw new Error(`Error ocurs when create sensor "${s.name}".`);
        }

        const sensorStorage = new storage.SensorStorage(storage.connection);
        try
        {
            await sensorStorage.bind(sensor);
        }
        catch (err)
        {
            logger.error(err);
            throw new Error(`Error ocurs when binding SensorStorage to sensor "${s.name}".`);
        }

        if (sensor.startMonitor)     //若为服务器拉模式，需要
        {
            sensor.startMonitor();
        }
    }
}


sensors.load = loadSensors;
export default sensors;

import events from "events";

export default class SensorStorage extends events.EventEmitter
{
    constructor(connection)
    {
        super();
        this._connection = connection;
    }

    get sensor()
    {
        return this._sensor;
    }

    get connection()
    {
        return this._connection;
    }

    async bind(sensor)
    {
        throw new Error("Must be implemented in the derived class.");
    }



    async queryOne(time)
    {
        throw new Error("Must be implemented in the derived class.");
    }

    async query(startTime, endTime)
    {
        throw new Error("Must be implemented in the derived class.");
    }
}

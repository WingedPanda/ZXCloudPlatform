import events from "events";
import logger from "winston";
import { Double } from "mongodb";

import SensorStorage from "../SensorStorage";

export default class MongoSensorStorage extends SensorStorage
{
    get collection()
    {
        return this._collection;
    }

    async bind(sensor)   //捆绑sensor
    {
        this._sensor = sensor;
        sensor._storage = this;

        this.sensor.on("updated", this._sensor_onUpdated.bind(this));
        let collectionName = null;
        try
        {
            collectionName = this.sensor.config.storage.collection.name;
        }
        catch (err)
        {
            throw new Error(`Can't get the collection name of sensor "${this.sensor.name}". Check your config in section "config.storage.collection.name".`);
        }

        try
        {
            const conn = this.connection.internalConnection;
            this._collection = await conn.createCollection(collectionName, {
                noPadding: true // NOTE see https://docs.mongodb.com/manual/core/mmapv1/#exact-fit-allocation
            });
        }
        catch (err)
        {
            logger.error(err);
            throw new Error(`Error ocurs when create collection for sensor "${this.sensor.name}".`);
        }

        try
        {
            await this.collection.ensureIndex({ timestamp: 1 }, { unique: true }); //建立索引
        }
        catch (err)
        {
            logger.error(err);
            throw new Error(`Error ocurs when create index for the collection of sensor "${this.sensor.name}".`);
        }
    }


    async queryOne(time)  //查询一条数据
    {
        const doc = await this._getDocumentOfTime(time);
        if (doc)
        {
            return doc.values[time.getMinutes()];
        }
        else
        {
            return null;
        }
    }

    async query(from, to)  //查询一段数据
    {
        if (from * 1 > to * 1)
        {
            throw new Error("'To' time must be greater than 'from' time.");
        }
        const startTimestamp = _getHours(from) * 1;
        const endTimestamp = _getHours(to) * 1;
        let docs = null;
        try
        {
            docs = await this.collection.find({
                timestamp: {
                    $gte: startTimestamp,
                    $lte: endTimestamp
                }
            }).toArray();
        }
        catch (err)
        {
            throw err;
        }

        if (docs.length === 0)
        {
            return [];
        }

        if (startTimestamp === endTimestamp)
        {
            // Both from and to time are in the same hour.
            return docs[0].values.slice(from.getMinutes(), to.getMinutes() + 1);
        }
        else
        {
            let results = [];
            let startJ = 0;
            for (let i = startTimestamp; i <= endTimestamp; i += 60 * 60 * 1000)
            {
                let doc = null;
                for (let j = startJ; j < docs.length; j++)
                {
                    if (docs[j].timestamp === i)
                    {
                        doc = docs[j];
                        startJ = j;
                        break;
                    }
                }

                if (doc === null)
                {
                    doc = {
                        values: this._createBlankValues()
                    };
                }

                if (i === startTimestamp)
                {
                    results.push(...(doc.values.slice(from.getMinutes())));
                }
                else if (i === endTimestamp)
                {
                    results.push(...(doc.values.slice(0, to.getMinutes() + 1)))
                }
                else
                {
                    results.push(...doc.values);
                }
            }
            return results;
        }
        return docs;
    }



    async _sensor_onUpdated(e)  //更新数据
    {
        try
        {
            await this._findAndUpdateValue(
                this.sensor.lastUpdatedTime,
                this.sensor.value
            );
        }
        catch(err)
        {
            logger.error(err);
        }
    }


    async _findAndUpdateValue(time, rawValue)   //查找并更新值
    {
        const value = this._normalizeValue(rawValue);
        const doc = await this._getDocumentOfTime(time, true);
        const minutes = time.getMinutes();

        const blankValue = this._createBlankValue();
        if (JSON.stringify(doc.values[minutes]) !== JSON.stringify(blankValue))
        {
            logger.warn(`- [${this.sensor.name}] Duplicated update found. This update will be ignored.`);
            return;
        }

        const set = {};
        set[`values.${minutes}`] = value;
        const stats = doc.stats;
        this._updateStats(stats, rawValue);
        set["stats"] = stats;
        this.collection.updateOne(
            {
                _id: doc._id
            },
            {
                $set: set
            }
        );
    }

    async _getDocumentOfTime(time, createIfNotExists = false)   
    {
        const timestamp = _getHours(time) * 1;
        let doc = await this.collection.findOne({
            timestamp
        });
        if (!doc)
        {
            if (createIfNotExists)
            {
                doc = await this._insertBlankDocumentOfTimestamp(timestamp);
                return doc;
            }
            else
            {
                return null;
            }
        }
        else
        {
            return doc;
        }
    }

    async _insertBlankDocumentOfTimestamp(timestamp)   //插入初始值
    {
        let doc = {
            timestamp,
            values: this._createBlankValues(),
            stats: this._createBlankStats()
        };
        await this.collection.insertOne(doc);
        return doc;
    }

    _createBlankValues()
    {
        if (this.sensor.config.monitor.interval === 60 * 1000)
        {
            const values = [];
            const size = 60 * 60 * 1000 / this.sensor.config.monitor.interval;
            for (let i = 0; i < size; i++)
            {
                const value = this._createBlankValue();
                values.push(value);
            }
            return values;
        }
        else
        {
            throw new Error("Monitoring interval not supported.");
        }
    }

    _createBlankValue()
    {
        const value = {};
        for (let key in this.sensor.meta.values)
        {
            const valueDesc = this.sensor.meta.values[key];
            let v = null;
            switch (valueDesc.type)
            {
                case "double":
                    v = new Double(Number.MIN_SAFE_INTEGER);
                    break;
                case "int":
                    v = Number.MIN_SAFE_INTEGER;
                    break;
                default:
                    throw new Error("Currently data type of sensor value could only be double or int.");
            }
            value[key] = v;
        }
        return value;
    }

    _normalizeValue(rawValue)
    {
        const value = {};
        for (let key in this.sensor.meta.values)
        {
            const valueDesc = this.sensor.meta.values[key];
            let v = null;
            switch (valueDesc.type)
            {
                case "double":
                    v = new Double(rawValue[key]);
                    break;
                case "int":
                    v = parseInt(rawValue[key]);
                    break;
                default:
                    throw new Error("Currently data type of sensor value could only be double or int.");
            }
            value[key] = v;
        }
        return value;
    }






    _createBlankStats()
    {
        const stats = {};
        for (let key in this.sensor.meta.values)
        {
            const valueDesc = this.sensor.meta.values[key];
            let v = null;
            switch (valueDesc.type)
            {
                case "double":
                    v = {
                        max: new Double(Number.MIN_SAFE_INTEGER),
                        min: new Double(Number.MAX_SAFE_INTEGER),
                        avg: new Double(0),
                        total: 0,
                        sum: new Double(0)
                    };
                    break;
                case "int":
                    v = {
                        max: Number.MIN_SAFE_INTEGER,
                        min: Number.MAX_SAFE_INTEGER,
                        avg: new Double(0),
                        total: 0,
                        sum: 0
                    };
                    break;
                default:
                    throw new Error("Currently data type of sensor value could only be double or int.");
            }
            stats[key] = v;
        }
        return stats;
    }

    _updateStats(stats, rawValue)   //更新状态信息：大小值、平均值、和
    {
        for (let key in this.sensor.meta.values)
        {
            const valueDesc = this.sensor.meta.values[key];
            let v = stats[key];
            v.total++;
            switch (valueDesc.type)
            {
                case "double":
                    if (rawValue[key] > v.max)
                    {
                        v.max = new Double(rawValue[key]);
                    }
                    if (rawValue[key] < v.min)
                    {
                        v.min = new Double(rawValue[key]);
                    }
                    v.sum = new Double(v.sum.valueOf() + rawValue[key]);
                    v.avg = new Double(v.sum.valueOf() / v.total);
                    break;
                case "int":
                    if (rawValue[key] > v.max)
                    {
                        v.max = rawValue[key];
                    }
                    if (rawValue[key] < v.min)
                    {
                        v.min = rawValue[key];
                    }
                    v.sum = v.sum + rawValue[key];
                    v.avg = new Double(v.sum / v.total);
                    break;
                default:
                    throw new Error("Currently data type of sensor value could only be double or int.");
            }
        }
    }
}


function _getHours(time)
{
    if (time)
    {
        return new Date(
            time.getFullYear(),
            time.getMonth(),
            time.getDate(),
            time.getHours());
    }
    else
    {
        return null;
    }
}

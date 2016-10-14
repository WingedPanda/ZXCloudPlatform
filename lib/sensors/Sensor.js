import events from "events";
import express from "express";
import logger from "winston";

export default class Sensor extends events.EventEmitter
{
    constructor(config)
    {
        super();
        this._config = config;
        this._id = config.id;
        this._name = config.name;
        this._meta = config.meta;
        this._storage = null;

        this._value = {};
        this._lastUpdatedTime = null;

        this.initRouter();
    }

    initRouter()
    {
        this._router = express.Router();
        this._router.get("/", this._get_handler.bind(this));
        this._router.get("/value", this._value_get_handler.bind(this));
        this._router.get("/data", this._data_get_handler.bind(this));
    }


    get id()
    {
        return this._id;
    }

    get name()
    {
        return this._name;
    }

    get config()
    {
        return this._config;
    }

    get meta()
    {
        return this._meta;
    }

    get storage()
    {
        return this._storage;
    }

    get router()
    {
        return this._router;
    }

    get lastUpdatedTime()
    {
        return this._lastUpdatedTime;
    }


    get value()
    {
        return this._value;
    }
    setValue(value)
    {
        this._lastUpdatedTime = new Date();
        if (JSON.stringify(value) !== JSON.stringify(this._value))
        {
            this._value = value;
            this.emit("valueChanged");
        }
        this.emit("updated");
        logger.info(`- [${this.id}] ${JSON.stringify(this.value)}`);
    }


    _get_handler(req, res)
    {
        res.send({
            id: this.id,
            name: this.name,
            desc: this.desc,
            meta: this.meta,
            monitor: this.config.monitor,
            storage: this.config.storage,
        });
    }

    _value_get_handler(req, res)
    {
        const value = _clone(this.value);
        value.lastUpdatedTime = this.lastUpdatedTime;
        res.send(value);
    }

    async _data_get_handler(req, res)
    {
        if (req.query.time)
        {
            const timeString = req.query.time;
            const time = new Date(timeString);
            if (isNaN(time))
            {
                res.send(`Parameters "time" is not a valid date time format.`);
                res.status(422).end();
                return;
            }

            let data = null;
            try
            {
                data = await this.storage.queryOne(time);
            }
            catch (err)
            {
                logger.error(err);
                res.status(500).end(err.message);
                return;
            }
            res.send(data);
        }
        else if (req.query.from)
        {
            const from = req.query.from;
            const to = req.query.to;
            if (!to)
            {
                res.status(422).end(`Parameters "to" are required.`);
                return;
            }
            const fromTime = new Date(from);
            if (isNaN(fromTime))
            {
                res.status(422).end(`Parameters "from" is not a valid date time format.`);
                return;
            }
            const toTime = new Date(to);
            if (isNaN(toTime))
            {
                res.status(422).end(`Parameters "to" is not a valid date time format.`);
                return;
            }

            let data = null;
            try
            {
                data = await this.storage.query(fromTime, toTime);
            }
            catch (err)
            {
                logger.error(err);
                res.status(500).end(err.message);
                return;
            }
            res.send(data);
        }
        else
        {
            res.status(422).end(`Query parameters required. e.g. "time", "from" + "to"`);
        }
    }
}


function _clone(obj)
{
    return JSON.parse(JSON.stringify(obj));
}

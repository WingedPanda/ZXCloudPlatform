import logger from "winston";

import app from "../../server/app";
import Sensor from "../Sensor";

export default class HttpClientPushSensor extends Sensor
{
    initRouter()
    {
        super.initRouter();      //继承父类时构造函数要写的一个内部函数
        this.router.post("/value", this._value_post_handler.bind(this));
    }

    _value_post_handler(req, res)   //处理应答，更新传感器值
    {
        const value = req.body;
        this.setValue(value);
        res.end("OK");
    }
}

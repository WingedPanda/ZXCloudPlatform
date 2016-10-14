import MongoDbConnection from "./DbConnection";
import MongoSensorStorage from "./SensorStorage";

export default {
    name: "mongo",
    info: {
        database: "MongoDB 3",
        version: "1.0.0",
        driverVersion: "2.2.9"
    },
    DbConnection: MongoDbConnection,
    SensorStorage: MongoSensorStorage
};
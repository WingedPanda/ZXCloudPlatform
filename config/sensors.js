export default [
    {
        id: "dht11-living-room",
        name: "DHT11 in Living Room",
        desc: "A DHT11 sensor in my living room connected with WiFi via ESP8266, powered by USB connector.",
        meta: {
            model: {
                name: "DHT11",
                manufacturer: "Shenzhen Ruishengweiye Electronic Co., Ltd."
            },
            values: {
                temperature: {
                    type: "double",
                    unit: "degree Celsius"
                },
                humidity: {
                    type: "double",
                    unit: "percentage"
                }
            }
        },
        monitor: {
            interval: 60 * 1000,
            mode: "http-client-push",
//            mode: "http-server-pull",
            url: "http://localhost:3000/sensors/dht11-living-room/data"
  //            url: "http://127.0.0.1:1919/dht11"
        },
        storage: {
            collection: {
                name: "sensor-data-dht11-living-room"
            }
        }
    }
];

const ds18b20 = require("@iiot2k/ds18b20");

const version = ds18b20.version();

const pin = 4;//17;
const sensors = ds18b20.list_sensor(pin);
const fahrenheit = false;
const temps = ds18b20.read_sensor_sync(pin, fahrenheit);

const id = "28-000007519802";
const temp = ds18b20.read_one_sensor_sync(pin, id, fahrenheit)
console.log({version}, {sensors}, {temps}, {temp})

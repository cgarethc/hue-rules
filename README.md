# hue-rules

Rules-based automation for Philips Hue bridge.

## Installation

Take a copy of `config.example.js` and name it `config.js`. The example config includes documentation.The key initial settings are the Hue bridge IP or hostname and the username. The Hue API uses a generated username: a random-seeming 40 character alphanumeric string.

## Configuration

The rules engine is [JSON-rules-engine on Github](https://github.com/cachecontrol/json-rules-engine). The config includes a block for specifying an array of rules in that format.

There are two event types that can be included: "on" and "off". Each needs the name of a light.
The "on" event can include:

* a brightness
* a colorTemp (for white to yellow lights)
* hue and saturation (for full colour lights)

The conditions are based on facts. The facts include the state of the lights and rooms, and information about the current time. E.g.:

```javascript
{
  'Lounge light': { // white-to yellow bulb
    on: true,
    reachable: true,
    hue: undefined,
    saturation: undefined,
    brightness: 254,
    colorTemp: 424
  },
  'Lounge lamp': { // simple white bulb
    on: true,
    reachable: true,
    hue: undefined,
    saturation: undefined,
    brightness: 254,
    colorTemp: undefined
  },
  "Kids' light": { // full colour bulb
    on: true,
    reachable: false,
    hue: 13248,
    saturation: 5,
    brightness: 254,
    colorTemp: 250
  },
  'Kitchen night light': { // smart plug
    on: false,
    reachable: true,
    hue: undefined,
    saturation: undefined,
    brightness: undefined,
    colorTemp: undefined
  },
  'Living room': { anyOn: true, allOn: true },
  "Children's room": { anyOn: true, allOn: true },
  Kitchen: { anyOn: false, allOn: false },
  year: 2022,
  month: 6,
  day: 6,
  hour: 10,
  minute: 43,
  second: 39,
  dayOfWeek: 'Mon',
  weekNumber: 23,
  isoTime: '10:43:39.270+12:00'
}
```

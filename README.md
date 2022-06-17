# hue-rules

Rules-based automation for Philips Hue bridge.

## Installation

Take a copy of `config.example.js` and name it `config.js`. The example config includes documentation.The key initial settings are the Hue bridge IP or hostname and the username. The Hue API uses a generated username: a random-seeming 40 character alphanumeric string.

```sh
npm install
cp config.example.js config.js
cp rules.example.hue rules.hue
node index.js
```

## Configuration

There are two ways to set up the rules:

* a simplified rules format in the rules.hue file
* the native format that the rules engine uses, specified in a block in config.js

If you are using the full native format, there is an example in the config.js and the actual rules engine is [JSON-rules-engine on Github](https://github.com/cachecontrol/json-rules-engine).

### Using the simplified format

The rules.hue file has one rule per line. Each rule is a list of comma-separated conditions inside curly braces, followed by an event.

The full grammar is in the parser.pegjs file. The condition can be:

* a light or room followed by an on or off state, e.g. `[Lounge light] on` or `<Living room> all`
* the property of a light (e.g. brightness) along with an operator and value, e.g. `[Lounge light] brightness gt 20`
* a time-based fact along with an operator and value, e.g. `hour lte 21`

Valid syntax:

* The operators are `eq lt gt lte gte`
* The light states are `on off`
* The room states are `all any none`
* The properties are `brightness colorTemp hue saturation`
* The time-based facts are `day month year hour minute second weekday weekNumber sinceSunrise sinceSunset`

Note that sinceSunrise and sinceSunset are the number of seconds since that time. If it hasn't occurred yet on that day, it will be negative.

The events can be:

* a light or room followed by a state, e.g. `[Lounge light] on`
* a light followed by a property and a value, e.g. `[Lounge light] colorTemp 120`
* a room followed by a scene name in double quotes, e.g. `<Living room> "Relax"`

Here's an example of a complete rule that will turn on the kitchen night light if it is off, there are no lights on in the living room, and it's 8pm or later:

`{hour gte 20,<Living room> none,[Kitchen night light] off} [Kitchen night light] on`

### Using the rules engine object format

#### Events

There are two event types that can be included: "on" and "off". Each needs the name of one or more lights.
The "on" event can include:

* a brightness
* a colorTemp (for white to yellow lights)
* hue and saturation (for full colour lights)

#### Conditions

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
  isoTime: '10:43:39.270+12:00',
  moonIllumination: { 
    fraction: 0.9066002352965129, /* 0 new moon 1.0 full moon */
    phase: 0.5988616246048384, /* 0/1 New Moon < 0.25 waxing crescent < 0.5 waxing gibbous 0.5 full moon > 0.5 waning gibbous > 0.75 waning crescent */
    angle: 1.4602920390886516
  },
}
```

Here's a set of conditions that will fire the event if the Lounge lamp is on and it's after 11am

```javascript
conditions: {
      all: [
        {
          fact: 'Lounge lamp',
          operator: 'equal',
          value: true,
          path: '$.on'
        },
        {
          fact: 'hour',
          operator: 'greaterThanInclusive',
          value: 11
        }
      ]
    }
```

## License

MIT License

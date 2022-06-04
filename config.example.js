exports.bridge = {
  host: '123.0.12.34',
  username: 'bridgeusername',
  port: 80,                     // Optional
  timeout: 15000,               // Optional, timeout in milliseconds (15000 is the default)
};

// see https://github.com/cachecontrol/json-rules-engine
// event types are "turnOn" and "turnOff"
exports.rules = [
  {
    conditions: {
      all: [
        {
          fact: 'Lounge lamp',
          operator: 'equal',
          value: true,
          path: '$.on'
        },
        {
          fact: 'Lounge light',
          operator: 'equal',
          value: false,
          path: '$.on'
        }
      ]
    },
    event: {
      type: 'on',
      params: {
        light: 'Lounge light'
      }
    }
  },
  {
    conditions: {
      any: [{
        fact: 'Lounge light',
        operator: 'equal',
        value: true,
        path: '$.on'
      }]
    },
    event: {
      type: 'brightness',
      params: {
        light: 'Lounge light',
        brightness: 20
      }
    }
  }
];
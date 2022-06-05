exports.settings = {
  server: true // if false, run once and exit. If true, stay running and evaluate the rules every minute
};

exports.bridge = {
  host: '123.0.12.34',          // IP or hostname of the Hue bridge on the local network
  username: 'bridgeusername',   // Required
  port: 80,                     // Optional port of the Hue bridge on the local network
  timeout: 15000,               // Optional, Hue connection timeout in milliseconds (15000 is the default)
};

// see https://github.com/cachecontrol/json-rules-engine
// event types are "on" and "off"
exports.rules = [
  {
    conditions: {
      all: [
        {
          fact: 'Lounge lamp', // needs to match the name of one of your lights
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
        light: 'Lounge light',
        brightness: 255, // 0-255 are valid values,
        colorTemp: 200 // 153-500 are valid values
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
      type: 'off',
      params: {
        light: 'Lounge light'        
      }
    }
  }
];
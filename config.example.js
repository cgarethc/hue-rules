exports.bridge = {
  host: '123.0.12.34',         
  username: 'bridgeusername',   // Optional at first: if left out, we can help you create one
  port: 80,                     // Optional
  timeout: 15000,               // Optional, timeout in milliseconds (15000 is the default)
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
        brightness: 255 // 0-255 are the valid values
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
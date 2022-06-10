exports.settings = {
  server: true
};

exports.bridge = {
  host: 'hue',
  username: 'jq58M7Dm4fkrrmbrFa7HS0i0b6kDR-abcdefghijkl'
};

exports.rules = [
  {
    conditions: { // all of the living room lights are off, it's after 8pm, night light is off: turn it on
      all: [
        {
          fact: 'Living room', // all living room lights off
          operator: 'equal',
          value: false,
          path: '$.anyOn'
        },
        {
          fact: 'hour', // 8pm or later
          operator: 'greaterThanInclusive',
          value: 20
        },
        {
          fact: 'Kitchen night light', // night light is off
          operator: 'equal',
          value: false,
          path: '$.on'
        },

      ]
    },
    event: {
      type: 'on',
      params: {
        light: 'Kitchen night light'
      }
    }
  },
  {
    conditions: { // between 5am and 8pm, any living room lights are on, the night light is on: turn if off
      all: [
        {
          fact: 'Living room', // any living room lights on
          operator: 'equal',
          value: true,
          path: '$.anyOn'
        },
        {
          fact: 'Kitchen night light', // night light is on
          operator: 'equal',
          value: true,
          path: '$.on'
        },
        {
          fact: 'hour',  // after 5am
          operator: 'greaterThanInclusive',
          value: 5
        },
        {
          fact: 'hour',  // before 8pm
          operator: 'lessThanInclusive',
          value: 20
        },
      ]
    },
    event: {
      type: 'off',
      params: {
        light: 'Kitchen night light'
      }
    }
  },
  {
    conditions: { // it's between 10pm and 5am, the stair light is on: dim it
      all: [
        {
          fact: 'hour', // 10pm or later
          operator: 'greaterThanInclusive',
          value: 22
        },
        {
          fact: 'hour',  // before 5am
          operator: 'lessThanInclusive',
          value: 5
        },
        {
          fact: 'Stair light', // stair light is on
          operator: 'equal',
          value: true,
          path: '$.on'
        },
        {
          fact: 'Stair light', // stair light is bright
          operator: 'greaterThan',
          value: 20,
          path: '$.brightness'
        }
      ]
    },
    event: { // dim the lights
      type: 'on',
      params: {
        light: 'Stair light',
        brightness: 16
      }
    }
  },
];
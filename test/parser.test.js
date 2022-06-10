const parser = require('../parser/parser');

test('test parser', () => {
  let result;
  result = parser.parse('{hour gte 9} [Lounge lamp] off');
  expect(result[0][1][0]).toEqual({ "fact": "hour", "operator": "gte", "value": 9 });
  expect(result[2]).toEqual({light: 'Lounge lamp', state: 'off'});
  expect(result[0][1][1].length).toEqual(0);

  result = parser.parse('{hour lte 13} <Living room> off');
  expect(result[0][1][0]).toEqual({ "fact": "hour", "operator": "lte", "value": 13 });
  expect(result[2]).toEqual({room: 'Living room', state: 'off'});
  expect(result[0][1][1].length).toEqual(0);

  result = parser.parse('{<Living room> any} [Lounge lamp] off');
  expect(result[0][1][0]).toEqual({ "room": "Living room", "state": "any" });
  expect(result[2]).toEqual({light: 'Lounge lamp', state: 'off'});
  expect(result[0][1][1].length).toEqual(0);
  
  result = parser.parse('{hour lt 10,minute eq 12,[Stair light] on,[Lounge lamp] brightness gt 50} [Kitchen night light] on');
  expect(result[0][1][0]).toEqual({ "fact": "hour", "operator": "lt", "value": 10 });
  expect(result[0][1][1].length).toEqual(3);
  expect(result[0][1][1][0][1]).toEqual({ "fact": "minute", "operator": "eq", "value": 12 });
  expect(result[0][1][1][1][1]).toEqual({ "light": "Stair light", "state": "on" });
  expect(result[0][1][1][2][1]).toEqual({ "light": "Lounge lamp", "property": "brightness", "operator": "gt", "value": 50 });
  expect(result[2]).toEqual({light: 'Kitchen night light', state: 'on'});
});

test('negative cases', () => {
  let result;
  result = parser.parse('{sinceSunset gt -30} [Lounge lamp] on');
  expect(result[0][1][0]).toEqual({ "fact": "sinceSunset", "operator": "gt", "value": -30 });
});

test('invalid cases', () => {
  let result;
  expect(() => {
    result = parser.parse(''); // blank
  }).toThrow();
  expect(() => {
    result = parser.parse('{hour lt 9}'); // no event
  }).toThrow();
});
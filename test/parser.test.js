const parser = require('../parser/parser');

test('test parser', () => {
  let result;
  result = parser.parse('{hour gte 9} [Lounge lamp] off');
  expect(result[0][1][0]).toEqual({ "fact": "hour", "operator": "gte", "value": 9 });
  expect(result[2]).toEqual({light: 'Lounge lamp', state: 'off'});
  
  result = parser.parse('{hour lt 10,minute eq 12,[Stair light] on,[Lounge lamp] brightness gt 50} [Kitchen night light] on');
  expect(result[0][1][0]).toEqual({ "fact": "hour", "operator": "lt", "value": 10 });
  expect(result[0][1][1][0][1]).toEqual({ "fact": "minute", "operator": "eq", "value": 12 });
  expect(result[0][1][1][1][1]).toEqual({ "light": "Stair light", "state": "on" });
  expect(result[0][1][1][2][1]).toEqual({ "light": "Lounge lamp", "property": "brightness", "operator": "gt", "value": 50 });
  expect(result[2]).toEqual({light: 'Kitchen night light', state: 'on'});
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
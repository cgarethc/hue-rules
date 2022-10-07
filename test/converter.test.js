const converter = require('../converter');

test('test simple light rule', () => {
  const result = converter.convert('{hour lt 9} [Lounge lamp] off');
  expect(result.conditions.all).toBeDefined();
  expect(result.conditions.all[0].fact).toEqual('hour');
  expect(result.conditions.all[0].operator).toEqual('lessThan');
  expect(result.conditions.all[0].value).toEqual(9);

  expect(result.event).toBeDefined();
  expect(result.event.type).toEqual('off');
  expect(result.event.params.light).toEqual('Lounge lamp');
  expect(result.event.params.transitionTime).toEqual(0);
});

test('test on the rule', () => {
  const result = converter.convert('{onTheTen true} [Lounge lamp] off');
  expect(result.conditions.all).toBeDefined();
  expect(result.conditions.all[0].fact).toEqual('onTheTen');
  expect(result.conditions.all[0].operator).toEqual('equal');
  expect(result.conditions.all[0].value).toEqual(true);

  expect(result.event).toBeDefined();
  expect(result.event.type).toEqual('off');
  expect(result.event.params.light).toEqual('Lounge lamp');
  expect(result.event.params.transitionTime).toEqual(0);
});

test('test simple light rule with light condition', () => {
  const result = converter.convert('{[Kitchen light] on} [Lounge lamp] off');
  expect(result.conditions.all).toBeDefined();
  expect(result.conditions.all[0].fact).toEqual('Kitchen light');
  expect(result.conditions.all[0].operator).toEqual('equal');
  expect(result.conditions.all[0].value).toEqual(true);
  expect(result.conditions.all[0].path).toEqual('$.on');

  expect(result.event).toBeDefined();
  expect(result.event.type).toEqual('off');
  expect(result.event.params.light).toEqual('Lounge lamp');
});

test('test room events', () => {
  let result = converter.convert('{[Kitchen light] on} <Living room> off');
  expect(result.conditions.all).toBeDefined();
  expect(result.conditions.all[0].fact).toEqual('Kitchen light');
  expect(result.conditions.all[0].operator).toEqual('equal');
  expect(result.conditions.all[0].value).toEqual(true);
  expect(result.conditions.all[0].path).toEqual('$.on');

  expect(result.event).toBeDefined();
  expect(result.event.type).toEqual('off');
  expect(result.event.params.room).toEqual('Living room');

  result = converter.convert('{[Kitchen light] on} <Living room> "Reading time"');
  expect(result.conditions.all).toBeDefined();
  expect(result.conditions.all[0].fact).toEqual('Kitchen light');
  expect(result.conditions.all[0].operator).toEqual('equal');
  expect(result.conditions.all[0].value).toEqual(true);
  expect(result.conditions.all[0].path).toEqual('$.on');

  expect(result.event).toBeDefined();
  expect(result.event.type).toEqual('on');
  expect(result.event.params.room).toEqual('Living room');
  expect(result.event.params.scene).toEqual('Reading time');
});

test('test simple room rule', () => {
  const result = converter.convert('{<Lounge> any} [Lounge lamp] brightness 150');
  expect(result.conditions.all).toBeDefined();
  expect(result.conditions.all[0].fact).toEqual('Lounge');
  expect(result.conditions.all[0].operator).toEqual('equal');
  expect(result.conditions.all[0].value).toEqual(true);
  expect(result.conditions.all[0].path).toEqual('$.anyOn');

  expect(result.event).toBeDefined();
  expect(result.event.type).toEqual('on');
  expect(result.event.params.light).toEqual('Lounge lamp');
  expect(result.event.params.brightness).toEqual(150);
});

test('test longer rule', () => {
  const result = converter.convert('{[Kitchen light] on,weekday eq 1} [Lounge lamp] off');
  expect(result.conditions.all).toBeDefined();
  expect(result.conditions.all.length).toEqual(2);

  expect(result.conditions.all[0].fact).toEqual('Kitchen light');
  expect(result.conditions.all[0].operator).toEqual('equal');
  expect(result.conditions.all[0].value).toEqual(true);
  expect(result.conditions.all[0].path).toEqual('$.on');

  expect(result.conditions.all[1].fact).toEqual('weekday');
  expect(result.conditions.all[1].operator).toEqual('equal');
  expect(result.conditions.all[1].value).toEqual(1);

  expect(result.event).toBeDefined();
  expect(result.event.type).toEqual('off');
  expect(result.event.params.light).toEqual('Lounge lamp');
});


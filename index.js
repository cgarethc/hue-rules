const huejay = require('huejay');
const { Engine } = require('json-rules-engine');

const bridgeConfig = require('./config').bridge;
const rules = require('./config').rules;

if (!bridgeConfig || !bridgeConfig.host || !bridgeConfig.username) {
  console.error('Please provide a host and username in config.js');
  process.exit(2);
}
if (!rules || !Array.isArray(rules)) {
  console.error('Please provide at least one rule in config.js');
  process.exit(2);
}

(async () => {
  const client = new huejay.Client(
    bridgeConfig
  );

  const engine = new Engine();
  for (let rule of rules) {
    console.debug('Adding rule:', rule);
    engine.addRule(rule);
  }


  try {
    console.log('Testing connection...')
    await client.bridge.ping()
    console.log('Successful');
  }
  catch (err) {
    console.error('Failed to connect to the Hue bridge', err);
    process.exit(2);
  }

  const lights = await client.lights.getAll();
  const facts = {};
  for (let light of lights) {
    facts[light.name] = {on: light.on, hue: light.hue, brightness: light.brightness};
  }
  console.log(facts);

  const { events } = await engine.run(facts);
  console.log('events', events);

  for (let event of events) {
    console.log(event);
    if (event.type === 'on') {
      const light = lights.find(light => light.name === event.params.light);
      light.on = true;
      await client.lights.save(light);
    }
    else if (event.type === 'off') {
      const light = lights.find(light => light.name === event.params.light);
      light.on = false;
      await client.lights.save(light);
    }
    else if (event.type === 'brightness') {
      const light = lights.find(light => light.name === event.params.light);
      light.brightness = Math.max(0, Math.min(255, event.params.brightness));
      await client.lights.save(light);
    }
    else{
      console.warn('unrecognized event type', event.type);
    }
  }

})();


const huejay = require('huejay');
const { Engine } = require('json-rules-engine');
const luxon = require('luxon');
const DateTime = luxon.DateTime;
const fs = require('fs');

if (!fs.existsSync('./config.js')) {
  console.log('Please create a config.js file in the root directory with your bridge configuration and rules: see config.example.js');
  process.exit(2);
}

const bridgeConfig = require('./config').bridge;
const rules = require('./config').rules;
const settings = require('./config').settings;

if (!bridgeConfig || !bridgeConfig.host || !bridgeConfig.username) {
  console.error('Please provide a host and username in config.js');
  process.exit(2);
}
if (!rules || !Array.isArray(rules)) {
  console.error('Please provide at least one rule in config.js');
  process.exit(2);
}

const connectAndExecute = async () => {
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
    facts[light.name] = { on: light.on, hue: light.hue, brightness: light.brightness };
  }

  const groups = await client.groups.getAll();
  for (let group of groups) {
    let groupName = group.name;
    // de-dupe if the group and a light share a name
    if (facts[groupName]) {
      groupName = `Group ${groupName}`;
    }
    facts[groupName] = { anyOn: group.anyOn, allOn: group.allOn };
  }

  // time facts for writing time-dependent conditions
  const now = DateTime.now();
  facts.year = now.year;
  facts.month = now.month;
  facts.day = now.day;
  facts.hour = now.hour;
  facts.minute = now.minute;
  facts.second = now.second;
  facts.dayOfWeek = now.weekdayShort;
  facts.weekNumber = now.weekNumber;
  facts.isoTime = now.toISOTime();

  console.info('All facts', facts);

  const { events } = await engine.run(facts);

  for (let event of events) {
    console.debug('processing event', event);
    if (event.type === 'on') {
      const light = lights.find(light => light.name === event.params.light);
      if (event.params.brightness) {
        light.brightness = Math.max(0, Math.min(255, event.params.brightness));
      }
      light.on = true;
      await client.lights.save(light);
    }
    else if (event.type === 'off') {
      const light = lights.find(light => light.name === event.params.light);
      light.on = false;
      await client.lights.save(light);
    }
    else {
      console.warn('unrecognized event type', event.type);
    }
  }

}

(async () => {

  if (!settings.server) {
    // run once and exit
    connectAndExecute();
  }
  else {
    // run forever
    // find millis until the next minute and zero seconds
    const millisUntilNearestMinute = DateTime.now().plus({ minutes: 1 }).startOf('minute').toMillis() - DateTime.now().toMillis();
    // wait until on the start of the minute
    setTimeout(async () => {
      await connectAndExecute();
      // then repeat every one minute
      setInterval(() => { connectAndExecute() }, 60 * 1000);
    }, millisUntilNearestMinute);
  }

})();


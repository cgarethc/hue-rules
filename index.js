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

  const lights = await client.lights.getAll();
  const facts = {};
  for (let light of lights) {
    facts[light.name] = {
      on: light.on, reachable: light.reachable,
      hue: light.hue, saturation: light.saturation,
      brightness: light.brightness, colorTemp: light.colorTemp
    };
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
    console.debug('processing event', JSON.stringify(event));

    let lightParams;
    if (event.params.lights) {
      lightParams = event.params.lights;
    }
    else {
      lightParams = [event.params]
    }

    for (let lightParam of lightParams) {

      const light = lights.find(light => light.name === lightParam.light);
      if (light) {
        if (event.type === 'on') {
          console.debug('Switching on light', light.name);
          light.on = true;
          if (lightParam.brightness) {
            light.brightness = Math.max(0, Math.min(255, lightParam.brightness));
          }
          if (lightParam.hue) {
            light.hue = Math.max(0, Math.min(65535, lightParam.hue));
          }
          if (lightParam.saturation) {
            light.saturation = Math.max(0, Math.min(254, lightParam.saturation));
          }
          if (lightParam.colorTemp) {
            light.colorTemp = Math.max(153, Math.min(500, lightParam.colorTemp));
          }
          await client.lights.save(light);
        }
        else if (event.type === 'off') {
          console.debug('Switching off light', light.name);
          light.on = false;
          await client.lights.save(light);
        }
        else {
          console.warn('unrecognized event type', event.type);
        }
      }
      else {
        console.warn('unrecognized light', lightParam.light);
      }
    }
  }

}

(async () => {

  if (!settings.server) {
    // run once and exit
    try {
      connectAndExecute();
    } catch (err) {
      console.error('Failed to execute', err);
    }
  }
  else {
    // run forever
    // find millis until the next minute and zero seconds
    const millisUntilNearestMinute = DateTime.now().plus({ minutes: 1 }).startOf('minute').toMillis() - DateTime.now().toMillis();
    // wait until on the start of the minute
    setTimeout(async () => {
      try {
        await connectAndExecute();
      } catch (err) {
        console.error('Failed to execute', err);
      }
      // then repeat every one minute
      setInterval(() => {
        try {
          connectAndExecute()
        } catch (err) {
          console.error('Failed to execute', err);
        }
      }, 60 * 1000);
    }, millisUntilNearestMinute);
  }

})();


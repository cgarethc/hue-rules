const huejay = require('huejay');
const { Engine } = require('json-rules-engine');
const luxon = require('luxon');
const DateTime = luxon.DateTime;
const fs = require('fs');
const SunCalc = require('suncalc2');

const converter = require('./converter');
const weather = require('./weather');

const RULES_FILE = './rules.hue';

let cloudCover;

if (!fs.existsSync('./config.js')) {
  console.log('Please create a config.js file in the root directory with your bridge configuration and rules: see config.example.js');
  process.exit(2);
}

const bridgeConfig = require('./config').bridge;
const rules = require('./config').rules;
const settings = require('./config').settings;
const weatherSettings = require('./config').weather;

if (!bridgeConfig || !bridgeConfig.host || !bridgeConfig.username) {
  console.error('Please provide a host and username in config.js');
  process.exit(2);
}
if ((!rules || !Array.isArray(rules)) && !fs.existsSync(RULES_FILE)) {
  console.error('Please provide at least one rule in config.js or a rules.hue file');
  process.exit(2);
}

const connectAndExecute = async () => {
  const client = new huejay.Client(
    bridgeConfig
  );

  const engine = new Engine();

  if (fs.existsSync(RULES_FILE)) {
    const rulesLines = fs.readFileSync(RULES_FILE, 'utf8').split('\n');
    for (let ruleLine of rulesLines) {
      if (ruleLine.startsWith('#')) {
        // it's a comment - ignore
        console.debug('ignoring', ruleLine);
      }
      else {
        const rule = converter.convert(ruleLine);
        if (rule) {
          console.debug('Adding rule:', JSON.stringify(rule));
          engine.addRule(rule);
        }
        else {
          console.warn('Could not parse rule:', ruleLine);
        }
      }
    }
  }
  else {
    for (let rule of rules) {
      console.debug('Adding rule:', JSON.stringify(rule));
      engine.addRule(rule);
    }
  }

  const facts = {};

  let lights;
  try {
    lights = await client.lights.getAll();
    for (let light of lights) {
      facts[light.name] = {
        on: light.on, reachable: light.reachable,
        hue: light.hue, saturation: light.saturation,
        brightness: light.brightness, colorTemp: light.colorTemp
      };
    }
  }
  catch (err) {
    console.warn('Failed to fetch the lights list for the facts, giving up', err);
    return;
  }

  let groups;
  try {
    groups = await client.groups.getAll();
    for (let group of groups) {
      let groupName = group.name;
      // de-dupe if the group and a light share a name
      if (facts[groupName]) {
        groupName = `Group ${groupName}`;
      }
      facts[groupName] = { anyOn: group.anyOn, allOn: group.allOn };
    }
  }
  catch (err) {
    console.warn('Failed to fetch the groups list for the facts, giving up', err);
    return;
  }

  let scenes;
  try {
    scenes = await client.scenes.getAll();
  }
  catch (err) {
    console.warn('Failed to fetch the scenes list giving up', err);
    return;
  }

  const now = DateTime.now();

  // sunrise and sunset facts
  if (settings.latitude && settings.longitude) {
    try {
      const sunTimes = SunCalc.getTimes(now, settings.latitude, settings.longitude);
      const sunrise = DateTime.fromJSDate(sunTimes.sunrise);
      const sunset = DateTime.fromJSDate(sunTimes.sunset);
      facts.sunrise = sunrise.toMillis();
      facts.sunset = sunset.toMillis();
      facts.sinceSunrise = Math.round((now.toMillis() - facts.sunrise) / 1000 / 60);
      facts.sinceSunset = Math.round((now.toMillis() - facts.sunset) / 1000 / 60);
      facts.moonIllumination = SunCalc.getMoonIllumination(now.toJSDate());

    } catch (err) {
      console.warn('Failed to fetch the sunrise and sunset facts, giving up', err);
      return;
    }
  }

  // time facts for writing time-dependent conditions
  facts.year = now.year;
  facts.month = now.month;
  facts.day = now.day;
  facts.hour = now.hour;
  facts.minute = now.minute;
  facts.second = now.second;
  facts.dayOfWeek = now.weekdayShort;
  facts.weekday = now.weekday;
  facts.weekNumber = now.weekNumber;
  facts.isoTime = now.toISOTime();
  facts.millis = now.toMillis();
  facts.onTheHour = now.minute % 60 === 0;
  facts.onTheHalfHour = now.minute % 30 === 0;
  facts.onTheQuarterHour = now.minute % 15 === 0;
  facts.onTheTen = now.minute % 10 === 0;
  facts.onTheFive = now.minute % 5 === 0;
  facts.cloudCover = cloudCover;

  console.debug('All facts', facts);

  try {
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

        if (lightParam.light) {
          const light = lights.find(light => light.name === lightParam.light);
          if (light) {
            if (event.type === 'on') {
              console.info('Switching on light', light.name, lightParam);
              light.on = true;
              if (lightParam.brightness) {
                light.brightness = Math.max(0, Math.min(255, lightParam.brightness));
              }
              else {
                light.brightness = 254; // has to be set to enable transition times
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
              if (lightParam.transitionTime) {
                light.transitionTime = lightParam.transitionTime;
              }
              try {
                await client.lights.save(light);
              }
              catch (err) {
                console.warn('Failed to save light', light.name, err);
              }
            }
            else if (event.type === 'off') {
              console.info('Switching off light', light.name);
              light.on = false;
              if (event.transitionTime) {
                room.transitionTime = event.transitionTime;
              }
              try {
                await client.lights.save(light);
              }
              catch (err) {
                console.warn('Failed to save light', light.name, err);
              }
            }
            else {
              console.warn('unrecognized event type', event.type);
            }
          }
          else {
            console.warn('unrecognized light', lightParam.light);
          }
        }
        else if (lightParam.room) {
          const room = groups.find(group => group.name === lightParam.room);
          if (room) {
            if (event.type === 'off') {
              console.debug('Turning off room', lightParam.room);
              room.on = false;
              if (event.transitionTime) {
                room.transitionTime = event.transitionTime;
              }
              client.groups.save(room);
            }
            else if (event.type === 'on' && event.params.scene) {
              console.debug('Turning on room', lightParam.room, 'with scene', event.params.scene);
              room.on = true;
              const matchingScene = scenes.find(scene => {
                return scene.name === event.params.scene &&
                  scene.lightIds.length === room.lightIds.length &&
                  scene.lightIds.every(id => room.lightIds.includes(id));
              });
              if (matchingScene) {
                room.scene = matchingScene;
                if (event.transitionTime) {
                  room.transitionTime = event.transitionTime;
                }
              }
              else {
                console.warn('Couldn\'t find scene', event.params.scene, 'for room', lightParam.room);
              }

              client.groups.save(room);
            }
            else if (event.type === 'on') {
              console.debug('Turning on room', lightParam.room);
              room.on = true;
              if (event.transitionTime) {
                room.transitionTime = event.transitionTime;
              }
              client.groups.save(room);
            }
            else {
              console.warn('unrecognized event type', event.type);
            }
          }
          else {
            console.warn('unrecognized room', lightParam.room);
          }
        }
        else {
          logger.warn('No light or room in the event', event.params);
        }

      }
    }
  } catch (err) {
    logger.error('Failed to execute rules', err);
  }

}

const updateWeather = async () => {
  try {
    const currentConditions = await weather.currentConditions(weatherSettings.location, weatherSettings.key)
    cloudCover = currentConditions.cloudcover;
    console.debug('Updated cloud cover from visualcrossing.com', cloudCover);
  } catch (err) {
    console.error('Failed to get weather', err);
  }
};

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
    let millisUntilNearestMinute;
    if (settings.skipwait) {
      millisUntilNearestMinute = 0;
    }
    else {
      const millisUntilNearestMinute = DateTime.now().plus({ minutes: 1 }).startOf('minute').toMillis() - DateTime.now().toMillis();
      console.info('Starting in', Math.round(millisUntilNearestMinute / 1000), 'seconds');
    }

    setTimeout(async () => {
      try {
        await connectAndExecute();
      } catch (err) {
        console.error('Failed to execute', err);
      }
      // then repeat every one minute
      setInterval(() => {
        try {
          connectAndExecute();
        } catch (err) {
          console.error('Failed to execute', err);
        }
      }, 60 * 1000);
    }, millisUntilNearestMinute);
  }

  if (weatherSettings && weatherSettings.key && weatherSettings.location) {
    updateWeather();
    setInterval(() => {
      console.log('30 minutes up, updating current weather');
      updateWeather();
    }, 30 * 60 * 1000);
  }

})();


const huejay = require('huejay');

const bridgeConfig = require('./config').bridge;

if (!bridgeConfig || !bridgeConfig.host || !bridgeConfig.username) {
  console.error('Please provide a host and username in config.js');
  process.exit(2);
}

(async () => {
  const client = new huejay.Client(
    bridgeConfig
  );

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
  console.log(lights.map(light => light.name));

})();


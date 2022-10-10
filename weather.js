const request = require('superagent');

exports.currentConditions = async (location, key) => {
  const response = await request
    .get(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}`)
    .query({ unitGroup: 'metric', include: 'current', key, contentType: 'json' });
  const data = response.body;
  return data.currentConditions;
};

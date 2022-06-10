const parser = require('./parser/parser');

const operatorMapping = {
  'eq': 'equal',
  'gt': 'greaterThan',
  'lt': 'lessThan',
  'gte': 'greaterThanInclusive',
  'lte': 'lessThanInclusive'
};

exports.convert = (ruleAsText) => {
  let result;
  try {
    result = parser.parse(ruleAsText);
    const firstCondition = result[0][1][0];
    const subsequentConditions = result[0][1][1];
    let conditions = [firstCondition];
    if (subsequentConditions.length > 0) {
      conditions = conditions.concat(subsequentConditions.map(condition => condition[1]));
    }

    const jsonConditions = [];
    for (let condition of conditions) {
      const jsonCondition = {};

      if (condition.fact) {
        jsonCondition.fact = condition.fact;
        jsonCondition.operator = operatorMapping[condition.operator];
        jsonCondition.value = condition.value;
      }
      else if (condition.room) {
        jsonCondition.fact = condition.room;
        jsonCondition.operator = 'equal';

        if (condition.state === 'any') {
          jsonCondition.path = '$.anyOn';
          jsonCondition.value = true;
        }
        else if (condition.state === 'none') {
          jsonCondition.path = '$.anyOn';
          jsonCondition.value = false;
        }
        else if (condition.state === 'all') {
          jsonCondition.path = '$.allOn';
          jsonCondition.value = true;
        }
      }
      else if (condition.light) {
        jsonCondition.fact = condition.light;
        if (condition.state) {
          jsonCondition.value = condition.state === 'on';
          jsonCondition.operator = 'equal';
          jsonCondition.path = '$.on';
        }
        else if (condition.property) {
          jsonCondition.path = `$.${condition.property}`;
          jsonCondition.operator = operatorMapping[condition.operator];
          jsonCondition.value = condition.value;
        }
      }

      jsonConditions.push(jsonCondition);
    }

    let jsonEvent;

    const event = result[2];
    if (event.state) {
      // set on/off
      jsonEvent = {
        type: event.state,
        params: {
          light: event.light
        }
      };
    }
    else {
      // modify property
      const propertyName = event.property;
      const eventParams = {
        light: event.light
      }
      eventParams[propertyName] = event.value;
      jsonEvent = {
        type: 'on',
        params: eventParams
      };
    }

    const jsonRule = {
      conditions: {
        all: jsonConditions
      },
      event: jsonEvent

    };

    return jsonRule;

  }
  catch (err) {
    console.error('Failed to parse the rules', err);
    return;
  }
}
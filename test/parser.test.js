const parser = require('../parser/parser');

test('test parser', () => {
  let result;
  result = parser.parse('{hour lt 9,minute eq 12,[Stair light] on,[Lounge lamp] brightness gt 50}');
  console.log(JSON.stringify(result));

});
const parser = require('../parser/parser');

test('test parser', () => {
  let result;
  result = parser.parse('{hour lt 9,minute eq 12,[Stair light] on,[Lounge lamp] brightness gt 50} [Kitchen night light] off');
  console.log(JSON.stringify(result));
  result = parser.parse('{hour lt 9,minute eq 12,[Stair light] on,[Lounge lamp] brightness gt 50} [Lounge lamp] brightness 25');
  console.log(JSON.stringify(result));

});
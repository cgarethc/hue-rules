start
  = conditions

conditions
  = '{' conditionlist '}'

conditionlist
  = condition (',' condition)*

condition
  = fact:fact ' ' operator:operator ' ' value:numbervalue {return {fact, operator, value}}
  / light:light ' ' property:property ' ' operator:operator ' ' value:numbervalue {return {light, property, operator, value}}
  / light:light ' ' state:state {return {light, state}}

operator
  = 'eq' / 'gt' / 'lt'

state
  = 'on' / 'off'

property
  = 'brightness' / 'colorTemp' / 'hue' / 'saturation'

fact 
  = 'hour'/'minute'/light 

light
  = '[' name:[^\]]+ ']' {return name.join('')}

numbervalue
  = digits:[0-9]+ {return parseInt(digits.join(''))}



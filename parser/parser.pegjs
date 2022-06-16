start
  = rule

rule
  = conditions ' ' event

event
  = light:light ' ' state:state {return {light, state}}
  / room:room ' ' scene:scene {return {room, scene}}
  / room:room ' ' state:state {return {room, state}}
  / light:light ' ' property:property ' ' value:numbervalue {return {light, property, value}}

conditions
  = '{' conditionlist '}'

conditionlist
  = condition (',' condition)*

condition
  = fact:fact ' ' operator:operator ' ' value:numbervalue {return {fact, operator, value}}
  / light:light ' ' property:property ' ' operator:operator ' ' value:numbervalue {return {light, property, operator, value}}
  / light:light ' ' state:state {return {light, state}}
  / room:room ' ' state:roomstate {return {room, state}}

operator
  = 'lte' / 'gte' / 'eq' / 'gt' / 'lt' / 'ne'

state
  = 'on' / 'off'

roomstate
  = 'any' / 'all' / 'none'

property
  = 'brightness' / 'colorTemp' / 'hue' / 'saturation'

fact 
  = 'hour'/'minute'/'second'/'day'/'month'/'year'/'weekday'/'weekNumber'
  /'isoTime'/'millis'
  /'sinceSunrise'/'sinceSunset'/'sunrise'/'sunset'

light
  = '[' name:[^\]]+ ']' {return name.join('')}

room
  = '<' name:[^>]+ '>' {return name.join('')}

scene
  = '"' name:[^"]+ '"' {return name.join('')}

numbervalue
  = digits:[0-9\-]+ {return parseInt(digits.join(''))}


{
  function extractTransition(transition) {
    return transition ? transition[1] : 0;
  }
}

start
  = rule

rule
  = conditions ' ' event

event
  = light:light ' ' state:state transition:(' ' transition)? {return {light, state, transition: extractTransition(transition)}}
  / room:room ' ' scene:scene transition:(' ' transition)? {return {room, scene, transition: extractTransition(transition)}}
  / room:room ' ' state:state transition:(' ' transition)? {return {room, state, transition: extractTransition(transition)}}
  / light:light ' ' property:property ' ' value:numbervalue transition:(' ' transition)? {return {light, property, value, transition: extractTransition(transition)}}

transition
  = 'transition ' value:numbervalue {return value}

conditions
  = '{' conditionlist '}'

conditionlist
  = condition (',' condition)*

condition
  = fact:fact ' ' operator:operator ' ' value:numbervalue {return {fact, operator, value}}
  / fact:fact ' ' booleanvalue:booleanvalue {return {fact, value: booleanvalue}}
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
  /'onTheHour'/ 'onTheHalfHour'/'onTheQuarterHour'/'onTheTen'/'onTheFive'

light
  = '[' name:[^\]]+ ']' {return name.join('')}

room
  = '<' name:[^>]+ '>' {return name.join('')}

scene
  = '"' name:[^"]+ '"' {return name.join('')}

booleanvalue
  = 'true' {return true}
  / 'false' {return false}

numbervalue
  = digits:[0-9\-]+ {return parseInt(digits.join(''))}


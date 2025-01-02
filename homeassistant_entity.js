/**************************************************

A Scriptable widget for displaying a single Home Assistant entity in iOS

chris@thenowhereman.com

Tips are appreciated via PayPal at the address above
or as DOGE at DTm5bu1eeNsp6qosPe2o5kKRBJocMs2rmW

Scriptable: https://scriptable.app
Home Assistant: https://www.home-assistant.io

This software is released to the PUBLIC DOMAIN
without warranty of any kind. You are free to modify
and distribute it as you like.

***************************************************/

// Home Assistant server info
ip_addr = '192.168.1.71';
port = '8123';
access_token = '';

// colors
background_color = Color.lightGray();
background_color_on = Color.green(); // for entities with on/off state

// when true, the widget background will be the color of the entity
// returned by Home Assistant. If no color is returned, the widget
// will use the colors defined above
use_entity_color = true;

font_size = 18;

// The Home Assistant entity to be displayed
entity_id = 'light.accent_lights';

// name to display above the main value
// set to null to use the friendly name from Home Assistant
// if the entity has no friendly name, the entity ID will be used
entity_name = null; //'Desk Lamp';
name_color = Color.black();

// attribute to display as the main value in the widget
// can be an attribute name or any one of 'state', 'last_changed', or 'last_updated'
attribute = 'brightness';
attribute_color = Color.darkGray();

// data to be displayed below the main value
// can be an attribute name or any one of 'state', 'last_changed', or 'last_updated'
// set to null for nothing to be be rendered below the main value
secondary_info = 'last_changed';

/**************************************************
END CONFIG
For basic use, you should not need to change anything blow this point
**************************************************/

// request entity data from Home Assistant
req = new Request('http://' + ip_addr + ':' + port + '/api/states/' + entity_id);
// setup the access token
req.headers = { 'Authorization': 'Bearer ' + access_token, 'content-type': 'application/json' };
// parse the response
json = await req.loadJSON();
console.log(json)

// start building the widget
widget = new ListWidget();
if(use_entity_color && json['attributes']['rgb_color'] != null){
    hex_str = '#' + json['attributes']['rgb_color'][0].toString(16).padStart(2, '0')
        + json['attributes']['rgb_color'][1].toString(16).padStart(2, '0')
        + json['attributes']['rgb_color'][2].toString(16).padStart(2, '0');
    widget.backgroundColor = new Color(hex_str);
}else
    widget.backgroundColor = (background_color_on != null && json['state'] == 'on') ? background_color_on : background_color;

widget.setPadding(5,5,10,5);

widget.addSpacer()

if(entity_name != null)
    str = entity_name
else if('friendly_name' in json['attributes'])
    str = json['attributes']['friendly_name'];
else
    str = json['entity_id'];

rowStack = widget.addStack();
rowStack.layoutHorizontally();
rowStack.addSpacer()
mytext = rowStack.addText(str);
mytext.font = Font.regularSystemFont(font_size);
mytext.textColor = name_color;
rowStack.addSpacer()

widget.addSpacer()

if(attribute in json){
    str = json[attribute]
    if(attribute == 'last_changed' || attribute == 'last_updated')
        str = formatDateString(str)
}else{
    str = json['attributes'][attribute]
    if(attribute == 'brightness')
        str = (str / 2.55).toLocaleString(undefined, { maximumFractionDigits: 0 }) + '%'
}

console.log(str)

rowStack = widget.addStack();
rowStack.layoutHorizontally();
rowStack.addSpacer()
mytext = rowStack.addText(str);
mytext.font = Font.semiboldMonospacedSystemFont(font_size * 2);
mytext.textColor = attribute_color;
rowStack.addSpacer()

widget.addSpacer()

if(secondary_info != null){
    if(secondary_info in json){
        str = json[secondary_info]
        if(secondary_info == 'last_changed' || secondary_info == 'last_updated')
            str = formatDateString(str)
    }else{
        str = json['attributes'][secondary_info]
        if(secondary_info == 'brightness')
            str = (str / 2.55).toLocaleString(undefined, { maximumFractionDigits: 0 }) + '%'
    }

    rowStack = widget.addStack();
    rowStack.backgroundColor = new Color('#000000', 0.1)
    rowStack.setPadding(5,10,5,10)
    rowStack.borderWidth = 5
    rowStack.borderColor = new Color('#000000', 0.1)
    rowStack.cornerRadius = 10

    rowStack.layoutHorizontally();
    rowStack.addSpacer()
    mytext = rowStack.addText(str);
    mytext.font = Font.regularSystemFont(font_size);
    mytext.textColor = name_color;
    rowStack.addSpacer()
}

// if we're not on the home screen, show a preview
if (!config.runsInWidget) {
    widget.presentSmall();
}
// DONE!
Script.setWidget(widget);
Script.complete();

function formatDateString(str){
    // DateFormatter can't handle microseconds, so this is a bit kludgy
    // assume all HA instances return GMT dates. Unsure if that's really true
    str = str.split('.')[0] + ' GMT'
    df = new DateFormatter()
    df.dateFormat = 'yyyy-MM-dd\'T\'HH:mm:ss zzz'
    d = df.date(str)
    df.useShortDateStyle()
    df.useShortTimeStyle()
    return df.string(d)
}

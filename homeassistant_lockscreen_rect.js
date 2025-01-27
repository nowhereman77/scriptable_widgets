// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: home;
/**************************************************

A Scriptable lock screen widget for displaying Home Assistant entities in iOS

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

font_size = 14;

// array of Home Assistant entities to be displayed
entities = [
    'sensor.radio_thermostat_company_of_america_ct100_thermostat_usa_temperature',
    'binary_sensor.hvac_running','binary_sensor.gate_sensor_opening'];

// Array of labels MUST have the same number of items as array of entities.
// If a label has a null value, the script will attempt to use the friendly name
// returned by Home Assistant. If an entity does not have a friendly name, the
// entity ID will be used as the label
labels = ['Hall','HVAC','Gate'];

// Array of attributes MUST have the same number of items as array of entities
// attributes to display as values in the widget
// can be an attribute name or any one of 'state', 'last_changed', or 'last_updated'
attributes = ['state','last_changed','state'];

/**************************************************
END CONFIG
For basic use, you should not need to change anything blow this point
**************************************************/

// we can re-use a single request object for all the API calls
req = new Request('');
// setup the access token
req.headers = { 'Authorization': 'Bearer ' + access_token, 'content-type': 'application/json' };

// start building the widget
widget = new ListWidget();

num_items = entities.length;
for(i = 0; i < num_items; i++){
    // build the API request for the entity
    req.url = 'http://' + ip_addr + ':' + port + '/api/states/' + entities[i];
    // parse the response
    json = await req.loadJSON();

    if(labels[i] != null)
        str = labels[i]
    else if('friendly_name' in json['attributes'])
        str = json['attributes']['friendly_name'];
    else
        str = json['entity_id'];

    rowStack = widget.addStack();
    rowStack.layoutHorizontally();
    mytext = rowStack.addText(str);
    mytext.font = Font.semiboldSystemFont(font_size);
    mytext.textColor = Color.white();
    rowStack.addSpacer();

    attribute = (attributes[i] != null) ? attributes[i] : 'state';
    if(attribute in json){
        str = json[attribute]
        if(attribute == 'last_changed' || attribute == 'last_updated')
            str = formatDateString(str)
        else if(attribute == 'state'){
            // TODO: add handling for additional device classes
            if('device_class' in json['attributes']
                && json['attributes']['device_class'] == 'opening')
                // if the entity's device class is 'opening'
                // use "Open" and "Closed" instead of the raw state ("on" and "off")
                str = (json['state'] == 'on') ? 'Open' : 'Closed';
            else
                // fall back to the raw state for other entities
                str = json['state'];

            // if the entity has a unit, use it
            if('unit_of_measurement' in json['attributes'])
                str += ' ' + json['attributes']['unit_of_measurement'];
        }
    }else{
        str = json['attributes'][attribute];
        if(attribute == 'brightness')
            str = (str / 2.55).toLocaleString(undefined, { maximumFractionDigits: 0 }) + '%'
    }

    mytext = rowStack.addText(str);
    mytext.font = Font.regularSystemFont(font_size);
    mytext.textColor = Color.lightGray();
}

// if we're not on the home screen, show a preview
if (!config.runsInWidget) {
    widget.presentAccessoryRectangular();
}
// DONE!
Script.setWidget(widget);
Script.complete();

function formatDateString(str){
    // DateFormatter can't handle microseconds, so this is a bit kludgy
    // assume all HA instances return GMT dates. Unsure if that's really true
    str = str.split('.')[0] + ' GMT';
    df = new DateFormatter();
    rdf = new RelativeDateTimeFormatter();
    df.dateFormat = 'yyyy-MM-dd\'T\'HH:mm:ss zzz';
    d = df.date(str);
    return rdf.string(d, new Date());
}

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: home;
/**************************************************

A Scriptable widget for displaying Home Assistant entities in iOS

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

// title displayed on the widget
// set to null if you don't want a header in your widget
title = null; //'Home Assistant';

// colors
background_color = new Color('#03a9f4');
title_color = Color.black();
label_color = Color.black();
value_color = Color.white();
value_color_on = Color.red(); // for entities with on/off state

// when true, the tile for an entity will be the color
// returned by Home Assistant. If no color is returned, the tile
// will not be colored
use_entity_color_tiles = true;

// when true, the value for an entity will be the color
// returned by Home Assistant. If no color is returned, the widget
// will use the colors defined above
use_entity_color_values = false;

// array of Home Assistant entities to be displayed
entities = ['input_number.target_temperature','input_number.temp_goal',
    'sensor.stardust_413_temperature','binary_sensor.gate_sensor_opening'];

/* Array of labels MUST have the same number of items as array of entities.
   If a label has a null value, the script will attempt to use the friendly name
   returned by Home Assistant. If an entity does not have a friendly name, the
   entity ID will be used as the label */
labels = ['Target','Goal',null,'Gate'];

// attribute to display as the main value in the widget
// can be an attribute name or any one of 'state', 'last_changed', or 'last_updated'
attribute = 'brightness';

// data to be displayed below the main value
// can be an attribute name or any one of 'state', 'last_changed', or 'last_updated'
// set to null for nothing to be be rendered below the main value
secondary_info = null; //'brightness';

// number of entities to be displayed in each row of the widget
num_items_per_row = 2;

// fonts
font_size = 14;

title_font = Font.boldSystemFont(font_size * 1.5);
label_font = Font.semiboldSystemFont(font_size);
value_font = Font.mediumMonospacedSystemFont(font_size);

/**************************************************
END CONFIG
For basic use, you should not need to change anything blow this point
**************************************************/

// start building the widget
widget = new ListWidget();
widget.backgroundColor = background_color;
widget.setPadding(5,5,5,5);

// add the header
if( title != null ){
    headerStack = widget.addStack();
    horizStack = headerStack.addStack();
    horizStack.layoutHorizontally();
    horizStack.addSpacer(); // needed to make the label appear centered
    titleLabel = horizStack.addText(title);
    titleLabel.font = title_font;
    titleLabel.textColor = title_color;
    horizStack.addSpacer(); // needed to make the label appear centered
}

// add a body to be populated later with Home Assistant data
bodyStack = widget.addStack();
bodyStack.layoutVertically();
bodyStack.spacing = 5;

// we can re-use a single request object for all the API calls
req = new Request('');
// setup the access token
req.headers = { 'Authorization': 'Bearer ' + access_token, 'content-type': 'application/json' };

num_items = entities.length;
for(i = 0; i < num_items; i++){ // for each entity we're interersted in
    // build the API request for the entity
    req.url = 'http://' + ip_addr + ':' + port + '/api/states/' + entities[i];
    // parse the response
    json = await req.loadJSON();

    // if this is the first item of a new row
    // add the necessary widget bits for the new row
    if(i % num_items_per_row == 0){
        rowStack = bodyStack.addStack();
        rowStack.layoutHorizontally();
        rowStack.spacing = 5
    }

    // build the label string for the entity
    // local array first, then friendly name from Home Assistant, then entity ID
    if(labels[i] != null)
	    label_str = labels[i];
    else if('friendly_name' in json['attributes'])
        label_str = json['attributes']['friendly_name'];
    else
        label_str = json['entity_id'];

    // add the label to the widget
    itemStack = rowStack.addStack();
    itemStack.layoutVertically();
    if(use_entity_color_tiles && json['attributes']['rgb_color'] != null){
        itemStack.backgroundColor = new Color(getHexForColor(json['attributes']['rgb_color']));
    }else
	    itemStack.backgroundColor = new Color('#ffffff', 0.1);
    itemStack.borderWidth = 5;
    itemStack.borderColor = new Color('#ffffff', 0.1);
    itemStack.cornerRadius = 10;
    itemStack.setPadding(5,5,5,5)
    itemStack.addSpacer();

    horizStack = itemStack.addStack();
    horizStack.layoutHorizontally();
    horizStack.addSpacer(); // so text will appear centered
    mytext = horizStack.addText(label_str);
    mytext.font = label_font;
    mytext.textColor = label_color;
    horizStack.addSpacer(); // so text will appear centered

    if(attribute in json){
        value_str = json[attribute]
        if(attribute == 'last_changed' || attribute == 'last_updated')
            value_str = formatDateString(str)
        else if(attribute == 'state'){
            if('device_class' in json['attributes']
                && json['attributes']['device_class'] == 'opening')
                // if the entity's device class is 'opening'
                // use "Open" and "Closed" instead of the raw state ("on" and "off")
                value_str = (json['state'] == 'on') ? 'Open' : 'Closed';
            else
                // fall back to the raw state for other entities
                value_str = json['state'];
        }
        // if the entity has a unit, use it
        if('unit_of_measurement' in json['attributes'])
            value_str += ' ' + json['attributes']['unit_of_measurement'];
    }else{
        value_str = json['attributes'][attribute]
        if(attribute == 'brightness')
            value_str = (value_str / 2.55).toLocaleString(undefined, { maximumFractionDigits: 0 }) + '%'
    }

    // add the value to the widget
    horizStack = itemStack.addStack();
    horizStack.layoutHorizontally();
    horizStack.addSpacer(); // so text will appear centered
    mytext = horizStack.addText(value_str);
    mytext.font = value_font;
    if(use_entity_color_values && json['attributes']['rgb_color'] != null){
        mytext.textColor = new Color(getHexForColor(json['attributes']['rgb_color']));
    }else
        mytext.textColor = (value_color_on != null && json['state'] == 'on') ? value_color_on : value_color;
    horizStack.addSpacer(); // so text will appear centered

    if(secondary_info != null){
        str = null;
        if(secondary_info in json){
            str = json[secondary_info];
            if(secondary_info == 'last_changed' || secondary_info == 'last_updated')
                str = formatDateString(str);
        }else if(secondary_info in json['attributes']){
            str = json['attributes'][secondary_info];
            if(secondary_info == 'brightness')
                str = (str / 2.55).toLocaleString(undefined, { maximumFractionDigits: 0 }) + '%';
        }

        if(str != null){
            horizStack = itemStack.addStack();
            horizStack.layoutHorizontally();
            horizStack.addSpacer();
            mytext = horizStack.addText(str);
            mytext.font = Font.regularSystemFont(font_size * 0.75);
            mytext.textColor = title_color;
            horizStack.addSpacer();
        }
    }

    itemStack.addSpacer();
}

// if we're not on the home screen, show a preview
if (!config.runsInWidget) {
    widget.presentMedium();
}
// DONE!
Script.setWidget(widget);
Script.complete();

function getHexForColor(rgb_color){
    result = '#' + rgb_color[0].toString(16).padStart(2, '0')
        + rgb_color[1].toString(16).padStart(2, '0')
        + rgb_color[2].toString(16).padStart(2, '0');
    return result;
}

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

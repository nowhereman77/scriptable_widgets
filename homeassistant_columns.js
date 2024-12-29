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
title = 'Home Assistant';

// colors
background_color = new Color('#03a9f4');
title_color = Color.black();
label_color = Color.black();
value_color = Color.white();
value_color_on = Color.red(); // for entities with on/off state

font_size = 16;

// array of Home Assistant entities to be displayed
entities = ['input_number.target_temperature','input_number.temp_goal',
    'sensor.stardust_413_temperature','binary_sensor.gate_sensor_opening'];

/* Array of labels MUST have the same number of items as array of entities.
   If a label has a null value, the script will attempt to use the friendly name
   returned by Home Assistant. If an entity does not have a friendly name, the
   entity ID will be used as the label */
labels = ['Target',null,'Outside','Gate'];

// number of entities to be displayed in each column of the widget
num_items_per_col = 4;

/**************************************************
END CONFIG
For basic use, you should not need to change anything blow this point
**************************************************/

// start building the widget
widget = new ListWidget();
widget.backgroundColor = background_color;
// add the header
if( title != null ){
    headerStack = widget.addStack();
    horizStack = headerStack.addStack();
    horizStack.layoutHorizontally();
    horizStack.addSpacer(); // needed to make the label appear centered
    titleLabel = horizStack.addText(title);
    titleLabel.font = Font.boldSystemFont(font_size * 1.5);
    titleLabel.textColor = title_color;
    horizStack.addSpacer(); // needed to make the label appear centered
}

// add a body to be populated later with Home Assistant data
bodyStack = widget.addStack();
bodyStack.layoutHorizontally();
bodyStack.spacing = 10;
bodyStack.setPadding(10,0,0,0);

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

    // if this is the first item of a new column
    // add the necessary widget bits for the new column
    if(i % num_items_per_col == 0){
        labelStack = bodyStack.addStack();
        labelStack.layoutVertically();
        valueStack = bodyStack.addStack();
		valueStack.layoutVertically();
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
    horizStack = labelStack.addStack();
    horizStack.layoutHorizontally();
    horizStack.addSpacer(); // needed to make the label appear right aligned
    mytext = horizStack.addText(label_str);
    mytext.font = Font.boldSystemFont(font_size);
    mytext.textColor = label_color;

    // build the value string for the entity
    // TODO: add handling for additional device classes
    if('device_class' in json['attributes']
        && json['attributes']['device_class'] == 'opening')
        // if the entity's device class is 'opening'
        // use "Open" and "Closed" instead of the raw state ("on" and "off")
        value_str = (json['state'] == 'on') ? 'Open' : 'Closed';
    else
        // fall back to the raw state for other entities
	    value_str = json['state'];

    // if the entity has a unit, use it
    if('unit_of_measurement' in json['attributes'])
	    value_str += ' ' + json['attributes']['unit_of_measurement'];

    // add the value to the widget
    mytext = valueStack.addText(value_str);
    mytext.font = Font.semiboldSystemFont(font_size);
    if(value_color_on != null && json['state'] == 'on')
        mytext.textColor = value_color_on;
    else
        mytext.textColor = value_color;
}

// if we're not on the home screen, show a preview
if (!config.runsInWidget) {
    widget.presentMedium();
}
// DONE!
Script.setWidget(widget);
Script.complete();

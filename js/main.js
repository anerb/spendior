'use strict';


Element.prototype.$ = HTMLElement.prototype.querySelector;
Element.prototype.$$ = HTMLElement.prototype.querySelectorAll;
Document.prototype.$ = Document.prototype.querySelector;
Document.prototype.$$ = Document.prototype.querySelectorAll;


// @import url("./currency.js");

function getSetting(key) {
  return window.localStorage.getItem(key);
}

function selectItem(item) {
  item.classList.add('selected');
}

function snake_case2PascalCase(snake_case, delimiter = "") {
  let PascalCaseTokens = [];
  for (let token of snake_case.split("_")) {
    token = token[0].toLocaleUpperCase() + token.slice(1);
    PascalCaseTokens.push(token);
  }
  return PascalCaseTokens.join(delimiter);
}

/*
 * Compares two endpoints, removing space, dash, underscore.
 * Does case-insensitive comparison.
 */
function areEndpointsEqual(e1, e2) {
  e1 = e1.trim().toLowerCase().replace(/[ _-]/, '');
  e2 = e2.trim().toLowerCase().replace(/[ _-]/, '');
  return e1 == e2;
}

function getScrollerValue(id) {
  let id_selector = "#" + id;
  let scroller = document.$(id_selector);
  let parent_bottom = source.getBoundingClientRect().bottom;
  let source_endpoints = document.$$(id_selector + " sd-endpoint");
  let min_diff = 999999999;  // ARBITRARY
  let value = undefined;
  for (let c of source_endpoints) {
    let child_bottom = c.getBoundingClientRect().bottom;
    let diff = Math.abs(parent_bottom - child_bottom);
    if (diff < min_diff && diff < 100) {  // ARBITRARY
      min_diff = diff;
      value = c.getAttribute("endpoint");
    }
  }
  return value;
}

function formatDate(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");
  let formattedDate = [year, month, day].join('-');
  return formattedDate;
}

function buildSendUrl() {
  let body = {};
  let today = new Date();
  body.sheet_name = getSetting("sheet_name");
  body.date_first = formatDate(today);
  body.date_final = formatDate(today);
  body.source = getScrollerValue("source");
  body.amount = document.$("#amount").value;
  body.currency = document.$("#currency").value;
  body.destination = getScrollerValue("destination");
  body.description = "DESCRIPTION";
  
  let queryParameters = [];
  for (let key in body) {
    let ẽkey = encodeURIComponent(key);
    let ẽvalue = encodeURIComponent(body[key]);
    let queryParameter = `${key}=${body[key]}`;
    queryParameters.push(queryParameter);
  }

  let href = getSetting("server_url");
  href += '?';
  href += queryParameters.join('&');
  return href;
}

function ready() {

  let currency = document.$("#currency").value;
  let amount = document.$("#amount").value;

  // Update exchange rate
  let converter = document.$("#converter");
  if (currency == "CHF" || currency == "OTH") {
    converter.classList.add("display_none");
  }
  if (currency != "CHF") {
    let chf = window.localStorage.getItem('CHF');
    if (chf) {
      chf = JSON.parse(chf);
      let rate = chf.conversion_rates[currency];
      let chf_value = amount / rate;
      chf_value = Math.round(chf_value * 100) / 100;
      converter.innerHTML = "= " + chf_value + " CHF";
      converter.classList.remove("display_none");
    }
  }
}

function updateSource() {
  source_value = document.$('input[name="source"]:checked').value;
  document.$("#source_text").value = source_value;
}


function updateDestination() {
  destination_value = document.$('input[name="destination"]:checked').value;
  document.$("#destination_text").value = destination_value;
}

// TODO: encapsulate this in the Endpoint class and name it better.
function showPrompt(e) {
  let endpoint = e.target.closest("sd-endpoint");
  let newValue = window.prompt('Choose an endpoint:', endpoint.attr('endpoint'));
  if (!newValue) {  // all manner of degenerate endpoint values.
    return;
  }
  // This should trigger the right changes on attribute update.
  endpoint.setAttribute('endpoint', newValue);

  // since taking this action is a final setting mod, flip back
  endpoint.$('.card').classList.remove('flipped');
}

// SUPER HACKY: need to better handle the different possible targets for click events.
function selectOrChangeEndpoint(e) {
  if (e.target.classList.contains('text_input')) {
    showPrompt(e);
    return;
  }
  let card = e.target.closest('.card');
  let initial_bottom = e.target.getBoundingClientRect().bottom;
  let parentElement = e.target.closest('.y-scroller');
  let parent_bottom = parentElement.getBoundingClientRect().bottom;
  let scroll_needed = initial_bottom - parent_bottom;
  let initial_scroll = parentElement.scrollTop;
  parentElement.scrollTo({ top: initial_scroll + scroll_needed, behavior: 'smooth' });
  ready();
}

function scrollEndpointsToBottom() {
  let source = document.$("#source");
  source.scrollTo({top: source.scrollHeight, behavior: 'smooth' });
  let destination = document.$("#destination");
  destination.scrollTo({top: destination.scrollHeight, behavior: 'smooth' });
}

function chooseImageFile(e) {
  e.preventDefault();
  e.target.parentElement.$("input").click();
}

function updateEndpointSrc(e) {
  // SUPER HACKY: Finding out if we should listen to this change event at the sd-endpoint level.
  if (e.target != document.$('input[type="file"]')) {
    return;
  }
  let sdEndpoint = e.target.closest('sd-endpoint');
  let endpoint = sdEndpoint.getAttribute('endpoint');
  let card = sdEndpoint.$('.card');
  let img = sdEndpoint.$("img");  //  TODO:change to a class
  const reader = new FileReader();

  let file = e.target.files[0];

  reader.addEventListener(
    'load',
    () => {
      let dataUrl = reader.result;
      // TODO: scale down image using https://imagekit.io/blog/how-to-resize-image-in-javascript/
      // convert image file to base64 string
      let key = `source:${endpoint}`;
      window.localStorage.setItem(key, dataUrl);
      key = `destination:${endpoint}`;
      window.localStorage.setItem(key, dataUrl);
      img.src = dataUrl;
      card.classList.remove('flipped');
    },
    false
  );

  if (file) {
    reader.readAsDataURL(file);
  }
}


function flipCard(e) {
  e.preventDefault();
  e.target.closest('sd-endpoint').$('.card').classList.toggle('flipped');
}

function imageLoadError(e) {
  
}

class PriceDisplay extends HTMLElement {

  // takes a string, returns a string
  addCommas = function(whole) {
    let rwhole = whole.split('').reverse().join('');
    let ñwhole = "";
    // Iterate in reverse;

    for (let d in rwhole) {
      if (d % 3 == 0 && d > 0) {
        ñwhole = ',' + ñwhole;  // prepend
      }
      ñwhole = rwhole[d] + ñwhole;  // prepend
    }
    // due to prepending, there is no need to reverse.
    return ñwhole;
  }

  distributeValue = function() {
    let parts = this.value_.split('.');
/*
    if (parts.length == 1) {
      // There is not dot;
      this.dot.classList.add('pending');
      this.dimes.classList.add('pending');
      this.pennies.classList.add('pending');
    } else {
      this.dot.classList.remove('pending');
      this.dimes.classList.add('pending');
      this.pennies.classList.add('pending');
    }
*/
    if (parts[0].length == 0) {
      this.dollars.classList.add('pending');
      this.dot.classList.add('pending');
      this.dimes.classList.add('pending');
      this.pennies.classList.add('pending');
      parts[0] += '0';
    } else {
      this.dollars.classList.remove('pending');
    }
    let withCommas = this.addCommas(parts[0]);
    this.dollars.innerHTML = withCommas;

    if (parts.length == 1) {
      this.dot.classList.add('pending');
      this.dimes.classList.add('pending');
      this.pennies.classList.add('pending');
      parts.push("");
    } else {
      this.dot.classList.remove('pending');
    }
    if (parts[1].length == 0) {
      parts[1] += '0';
      this.dimes.classList.add('pending');
      this.pennies.classList.add('pending');
    } else {
      this.dimes.classList.remove('pending');
    }
    if (parts[1].length == 1) {
      parts[1] += '0';
      this.pennies.classList.add('pending');
    } else {
      this.pennies.classList.remove('pending');
    }
    this.dimes.innerHTML = parts[1][0];
    this.pennies.innerHTML = parts[1][1];
  }

  constructor() {
    // Always call super first in constructor
    super();

    this.value_ = "";

    this.dollars = document.createElement('div');
    this.dollars.classList.add('dollars');
    this.dot = document.createElement('div');
    this.dot.classList.add('dot');
    this.dot.innerHTML = '.';
    this.dimes = document.createElement('div');
    this.dimes.classList.add('dimes');
    this.pennies = document.createElement('div');
    this.pennies.classList.add('pennies');

    this.appendChild(this.dollars);
    this.appendChild(this.dot);
    this.appendChild(this.dimes);
    this.appendChild(this.pennies);

    this.distributeValue();
  }

  // emitted as a Number
  get value() {
    let ñdollars = this.dollars.innerHTML;
    ñdollars = ñdollars.replace(/,/g, '');
    let renderedValue = `${ñdollars}.${this.dimes.innerHTML}${this.pennies.innerHTML}`
    return Number(renderedValue);
  }

  set value (v) {
    if (typeof v != typeof 12.34) {
      throw new Error(`PriceDisplay.value can only be set to Number. ${typeof v} recieved instead.`);
    }
    this.stringValue = String(v);
  }

  set stringValue (v) {
    if (typeof v != typeof '') {
      throw new Error(`PriceDisplay.value can only be set to string. ${typeof v} recieved instead.`);
    }
    if (v != "") {
      if (v.match(/^([1-9][0-9]*|0)([.][0-9]{0,2})?$/) == null) {
        throw new Error(`Setting PriceDisplay.value to invalid ${v}.`);
      }
    }
    this.value_ = v;
    this.distributeValue();
  }

}

/*
 *  left vs right is mostly about where the decimal/clear button goes.
 */
class Keypad extends HTMLElement {
  
  /*
   * The dot is disabled when the value is cleared.
   *  - You must type 0, then dot
   *  - This is so you can press the dot key multiple times to clear.
   * 
   * If the value is not clear, then:
   *  - Add a dot, and 
   *  - change the key's role to role_clear
   */

  clear = function() {
    this.value_ = "";
    this.setKeyClasses();
    this.dispatchEvent(new Event("change"));
  }

  handleClick = function(e) {
    if (e.target.classList.contains('disabled')) {
      return;
    }
    if (e.target.classList.contains('role_clear')) {
      this.clear();
    } else {
      this.value_ += e.target.innerHTML;
    }
    this.setKeyClasses();

    const changeEvent = new Event("change");
    this.dispatchEvent(changeEvent);
  }

  // Based on current value_, keys get their roles and disabled.
  setKeyClasses = function() {

    if (this.value_ != "") {
      // https://regexr.com/79vus
      if (this.value_.match(/^([1-9][0-9]*|0)([.][0-9]{0,2})?$/) == null) {
        console.error(`An invalid value arose: ${this.value_}`)
        this.clear();
      }
    }

    let roles = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
    };

    // Awaiting any digit, but not dot
    if (this.value_ == "") {
      for (let role in roles) {
        let key = this.$(`.role_${role}`);
        key.classList.remove('disabled');
      }
      this.$('.role_0').classList.remove('disabled');
      // Show a disabled dot.  There is no need to clear a cleared value_
      this.$('.role_dot').classList.add('disabled');
      this.$('.role_dot').classList.remove('display_none');

      this.$('.role_clear').classList.add('display_none');
    }

    // The only valid key is '.'  (clear should not be visible)
    if (this.value_ == "0") {
      for (let role in roles) {
        let key = this.$(`.role_${role}`);
        key.classList.add('disabled');
      }
      this.$('.role_0').classList.add('disabled');
      this.$('.role_dot').classList.remove('disabled');
      this.$('.role_dot').classList.remove('display_none');
      this.$('.role_clear').classList.add('display_none');
    }

    // A valid integer appears
    // Waiting for 0-9 or dot
    if (this.value_.match(/^[1-9][0-9]*$/) != null) {
      // all keys are enabled.
      for (let role in roles) {
        let key = this.$(`.role_${role}`);
        key.classList.remove('disabled');
      }
      this.$('.role_0').classList.remove('disabled');
      this.$('.role_dot').classList.remove('disabled');
      this.$('.role_dot').classList.remove('display_none');
      this.$('.role_clear').classList.add('display_none');
    }

    // 0.
    // 1.
    // 1230.
    // 123.1
    // 0.0
    // Waiting for 0-9 or clear
    if (this.value_.match(/[0-9]+[.][0-9]?/) != null) {
      // all keys are enabled.
      for (let role in roles) {
        let key = this.$(`.role_${role}`);
        key.classList.remove('disabled');
      }
      this.$('.role_0').classList.remove('disabled');
      this.$('.role_dot').classList.add('disabled');
      this.$('.role_dot').classList.add('display_none');
      this.$('.role_clear').classList.remove('display_none');
    }

    // 0.12
    // 0.00
    // 1.20
    // Nothing more to type. Only clear is an option.
    if (this.value_.match(/[0-9]+[.][0-9][0-9]/) != null) {
      // all keys are enabled.
      for (let role in roles) {
        let key = this.$(`.role_${role}`);
        key.classList.add('disabled');
      }
      this.$('.role_0').classList.add('disabled');
      this.$('.role_dot').classList.add('disabled');
      this.$('.role_dot').classList.add('display_none');
      this.$('.role_clear').classList.remove('display_none');
    }
  }

  constructor() {
    // Always call super first in constructor
    super();

    // "" means cleared
    // "0" means it's ready for a dot
    // "ABC" is the value
    // "ABC.D" means the last zero pending
    // "ABC.D0" means all digits have been typed.
    // "ABC." means it's ABC. (ready for the tenths)

    this.value_ = "";

    this.addEventListener('click', this.handleClick);

    const handed = this.getAttribute('handed');  // left/right
    const orientation = this.getAttribute('orientation');  // portrait/landscape

    const front = document.createElement('div');
    front.classList.add('front');

    let roles = {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      dot: ".",
      clear: "0.00",
    };
    for (let role in roles) {
      const key = document.createElement('div');
      key.classList.add(`role_${role}`);
      key.classList.add(`key`);
      key.innerHTML = roles[role];
      if (role == "clear") {
        key.classList.add('display_none');
      }
      front.appendChild(key);
      const back = document.createElement('div');
    }
    this.appendChild(front);
    this.setKeyClasses();
  }

  get value() {
    return this.value_;
  }



}
/***right grid portrait******
  1 2 3
  4 5 6
  7 8 9
    0 .
*********/

/****left grid portrait*****
  1 2 3
  4 5 6
  7 8 9
  . 0 
*********/

/****right grid landscape*****
  1 2 3
  4 5 6 .
  7 8 9 0
*********/

/****left grid landscape*****
 0 1 2 3
 . 4 5 6 
   7 8 9 
*********/

function endpointNamePrompt(e) {
  let role = e.target.getAttribute('role');
  let endpoint = e.target.getAttribute('endpoint');
  let name = window.prompt(`Choose a name for this ${role}:`, endpoint);
  if (name) {
    e.target.setAttribute('endpoint', name);
  }
}


// TODO: Maybe I can get rid of img_src and only store the b64 on img.src.
class Endpoint extends HTMLElement {

  static get observedAttributes() {
    return ['endpoint', 'direction'];
  }
  attributeChangedCallback(attribute, oldValue, newValue) {
    if (attribute === 'endpoint') {
      // IDEA: this can compare normalized values in case capitalization, etc. doesn't matter
      if (oldValue == newValue) {
        return;
      }

      // Note: 2 ways to be "smart" about updates.
      // 1 (chosen): only call the items that need updating
      // 2 (more robust): call everyone, and each one knows how to return early if nothing to do.
      console.log([`attributeChangedCallback: ${newValue}`, this])
      this.defineImage();
      this.defineLabel();
      this.defineTextInput();
    }
  }

  // Should be in parent calss
  attr = function(attribute) {
    return this.getAttribute(attribute);
  }

  // TODO: Maybe use oldValue and reference counting to delete image storage
  defineImage = function() {
    let endpoint = this.attr('endpoint');
    console.log(`defineImage calling prepareWard: ${endpoint} , ${this.attr('role')}`);
    const imgEl = this.prepareWard('image', 'img', this.$('.front'));

    let img_src = window.localStorage.getItem(endpoint) || undefined;
    if (img_src != undefined) {
      imgEl.setAttribute('src', img_src);
    }
    imgEl.setAttribute('alt', endpoint);
    imgEl.setAttribute('title', this.attr('title'))
    imgEl.setAttribute('srcset', `../images/lineart/${endpoint}.png, ../images/lineart/no_image.png`);
  }

  defineLabel = function() {
    const labelEl = this.prepareWard('label', 'div', this.$('.front'));

    let title = snake_case2PascalCase(this.attr('endpoint'));
    labelEl.innerHTML = title;
  }

  defineFileButton = function() {
    let fileButtonEl = this.prepareWard('file_button', 'div', this.$('.back'));
    fileButtonEl.classList.add('button');
    fileButtonEl.innerHTML = 'Choose an Image';  
  }

  defineFileInput = function() {
    let fileInputEl = this.prepareWard('file_input', 'input', this.$('.back'));
    fileInputEl.setAttribute('type', 'file');
  }
  
  defineTextInput = function() {
    let textInputEl = this.prepareWard('text_input', 'div', this.$('.back'));
    textInputEl.classList.add('button');
    textInputEl.innerHTML = this.attr('endpoint');
  }

  // TODO: figure out the name for this pattern of "retreive or create".
  prepareWard = function(wardName, tag, parentEl) {
    let wardEl = this.$(`.${wardName}`) || undefined;
    if (wardEl === undefined) {
      console.log(`prepareWard creating ${tag}`);
      wardEl = document.createElement(tag);
      wardEl.setAttribute('class', wardName);    
      parentEl.appendChild(wardEl);
    }
    return wardEl;
  }

  // The constructor is called before the Element is attached to the DOM
  constructor() {

    // Always call super first in constructor
    super();

    // HACK to stop multiple constructor calls
    this.addEventListener('click', selectOrChangeEndpoint);  // I think eventlisteners are removed when the element is taken out of the dom (before being reinserted right away again);
    this.addEventListener('contextmenu', flipCard);
    this.addEventListener('change', updateEndpointSrc);
    this.addEventListener('error', imageLoadError);

    if (this.children.length > 0) {
      return;
    }

   ////// TODO : **** use hierarchical selectors instead of prepended class names.

    // Build up the basic scaffolding of this Element
    const cardEl = document.createElement('div');
    this.appendChild(cardEl);
    cardEl.classList.add('card');

    const frontEl = document.createElement('div');
    cardEl.appendChild(frontEl);
    frontEl.classList.add('card_face');
    frontEl.classList.add('front');

    const backEl = document.createElement('div');
    cardEl.appendChild(backEl);
    backEl.classList.add('card_face');
    backEl.classList.add('back');

    console.log(`Endpoint.constructor() ${this.attr('endpoint')}`)

    // Populate the front
    // Some work to do: At the moment, this will create and insert, and update per attributes
    this.defineImage();
    this.defineLabel();


    // Populate the back
    this.defineFileButton();
    this.defineFileInput();
    this.defineTextInput();
 
  }
}

function csv2array(csv) {
  let lines = csv.split("\n");
  let arr = [];
  for (let line of lines) {
    let row = line.split(",");  // This is where the hard stuff with quoting happens
    arr.push(row);
  }
  return arr;
}

function increment(obj, key, amount) {
  if (!(key in obj)) {
    obj[key] = 0;
  }
  obj[key] += amount;
}


/*
 * An Inventory is an object with sortable keys and sortable values
 * The output is just the sorted keys in an array
 */
function sortInventory(inventory) {
  if (typeof inventory != typeof {}) {
    throw new Error(`sortInventory takes an object, but got a ${typeof inventory}`);
  }
  // Term-by-term comparison starting on the end
  let less_than_pairs = function(p1, p2) {
    if (p1[1] == p2[1]) {
      if (p1[0] == p2[0]) {
        return 0;
      }
      return p1[0] < p2[0] ? -1 : 1;
    }
    return p1[1] < p2[1] ? -1 : 1;
  }

  let sorted = Object.entries(inventory).sort(less_than_pairs);
  let sorted_keys = [];
  for (let entry of sorted) {
    sorted_keys.push(entry[0]);
  }
  return sorted_keys;
}

// in-place removal of inventory items with degenerate key or value
function cleanupInventory(inventory) {
  for (let key in inventory) {
    // Use JS liberal truthiness interpretation of empty strings and zeros
    if (!key || !inventory[key]) {
      delete(inventory[key]);
    }
  }
}


//New convention, name objects with ĩ to indicate they are an Inventory.

function getEndpointsForEmail(arr, email_re) {
  // This will hold the index of the column for a header value.
  // E.G. header[source] is 0 or 1 ... header[anerbenartzi@outlook.com] is 4 or something like it.
  let ĩsources = {};
  let ĩdestinations = {};
  let header = {};
  let header_found = false;
  let emails = [];
  for (let row of arr) {
    if ((row[0] == "source" && row[1] == "destination") ||
        (row[0] == "destination" && row[1] == "source")) {
      // Handle header row
      for (let c in row) {
        let value = row[c];
        header[value] = c;
        // Every value in the header row that matches email_re is a good email.
        if (["source", "destination"].includes(value)) {
          continue;
        }
        if (value.match(email_re)) {  // can be empty-string
          emails.push(value);
        }
      }
      header_found = true;
      continue;
    }
    if (!header_found) {
      // ignore any rows before the official header row
      // E.G. The pseudo-header row ("COUNT A of source .. from.. <empty>").
      continue;
    }
    let source = row[header["source"]];
    let destination = row[header["destination"]];
    let count = 0;
    for (let email of emails) {
      let value = parseInt(row[header[email]]);
      if (isNaN(value)) {
        value = 0;
      }
      count += value;
    }
    // For now, I'm keeping it simple so the source-destination linkage is ignored.
    increment(ĩsources, source, count);
    increment(ĩdestinations, destination, count);
  }

  cleanupInventory(ĩsources);
  cleanupInventory(ĩdestinations);

  let endpoints = {
    sources: sortInventory(ĩsources),
    destinations: sortInventory(ĩdestinations),
  }

  return endpoints

}

function getSortedEndpoints() {
  let endpoints = {sources: [], destinations: []};

  let endpoints_csv = window.localStorage.getItem("endpoints_csv");
  if (endpoints_csv) { // != null
    let endpoints_array = csv2array(endpoints_csv);
    let email_re = getSetting("email_re");
    endpoints = getEndpointsForEmail(endpoints_array, email_re);
  }

  // add "OTHER" to the bottom of the list (most common)
  let ñendpoints = modifySortedEndpoints(endpoints);
  return ñendpoints;
}

// TODO create element and use appendChild instead of HTML manipulation.

function appendEndpointFiller(parent, role) {
  let html = `<sd-endpoint class="slot filler" endpoint="filler" role="source"></sd-endpoint>`;
  parent.innerHTML += html;
}

function appendEndpoint(parent, endpoint, role) {
  // TODO: check against a less permissive regexp
  if (endpoint == "") {
    return;
  }
  let html = `<sd-endpoint class="slot" endpoint="${endpoint}" role="source"></sd-endpoint>`;
  parent.innerHTML += html;
}

/*
 * Adds any missing alwaysEndponts to the front.
 * Moves "other" to the end (or adds it if missing).
 */
function augmentSortedEndpoints(endpoints, alwaysEndpoints, isSource) {
  let ñendpoints = [];
  for (let alwaysEndpoint of alwaysEndpoints) {
    if (endpoints.find(s => areEndpointsEqual(s, alwaysEndpoint)) != undefined) {
      // alwaysEndpoint is already in the sources, so we'll come upon it later.
      continue;
    }
    ñendpoints.push(alwaysEndpoint);
  }

  let endpointOther = isSource ? "other_source" : "other_destination";

  for (let endpoint of endpoints) {
    if (!endpoint) {
      // Skip all manner of degenerate endpoints.
      continue;
    }
    if (areEndpointsEqual(endpoint, endpointOther)) {
      // We skip the endpointOther, and add it at the end.
      continue;
    }
    ñendpoints.push(endpoint);
  }

  ñendpoints.push(endpointOther);
  return ñendpoints;
}

// Originally, I set "other" to be at the start (farthest from the most popular).
// However, that made it so the most popular were pre-selected in endpoints, which means open,digits,send would erronously capture the endpoints.
function modifySortedEndpoints(endpoints) {
  let IS_SOURCE = true;

  let alwaysPresentEndpoints = window.localStorage.getItem('always_present_endpoints') || '';
  let alwaysEndpoints = alwaysPresentEndpoints.trim().split(/\s*,\s*/);

  let ñsources = augmentSortedEndpoints(endpoints.sources, alwaysEndpoints, IS_SOURCE);
  let ñdestinations = augmentSortedEndpoints(endpoints.destinations, alwaysEndpoints, !IS_SOURCE);
  let ñendpoints = {sources: ñsources, destinations: ñdestinations};
  return ñendpoints;
}

function tbody2imageMapping(tbody) {
  let images = tbody.$$("img");
  let image_mapping = {};
  for (let image of images) {
    image_mapping[image.title] = image.src;
  }
  return image_mapping;
}

// ignore rowspan
// handle colspan
// HACK: assumes rectangular table
function tbody2array(tbody) {
  let arr = [];
  let trs = tbody.$$("tr");
  for (let tr of trs) {
    let row = [];
    let tds = tr.$$("td");
    for (let td of tds) {
      let value = td.innerHTML;
      let colspan = td.getAttribute('colspan') || 1;
      for (let i = 0; i < colspan; i++) {
        row.push(value);
      }
    }
    arr.push(row);
  }
  return arr;
}

// FRAGILE: Based on the specific way Google Sheets published to the web.
// FRAGILE: hardcodes the expeceted sheet_names for this program.
// Returns a mapping from sheet_name -> gid
function getSheetNames(desired_body) {
  let sheet_names = {
    images: null,
    endpoints: null,
  };

  let lis = desired_body.$$('li[id*="sheet-button-"]');
  for (let li of lis) {
    let innerHTML = li.innerHTML;
    // By the nature of this loop, if multiple sheet_names match, the final one is retained.
    for (let sheet_name in sheet_names) {
      // TODO: Make this case-insesitive.
      if (innerHTML.indexOf(sheet_name) < 0) {
        continue;
      }
      let match = li.id.match(/sheet-button-(.*)/);
      let gid = match[1];
      sheet_names[sheet_name] = gid;
      break;  // We found the sheet that matches this li
    }
  }
  return sheet_names;
}


function memoFetch(key) {
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = "";
  }
  return value;
}

// TODO: Perhaps run extraction from published html here.
function retrieveEndpointsImageMapping() {
  let json = window.localStorage.getItem("endpoints_image_mapping");
  let image_mapping = {};
  try {
    image_mapping = JSON.parse(json);
  } catch(e) {}
  return image_mapping;
}

function isNonEmptyString(s) {
  let isString = typeof s == typeof '';
  let nonEmpty = s.length > 0;
  console.log([s, isString, nonEmpty]);
  return isString && nonEmpty;  
}

/*
 * Tests if a url can return non-empty text data
 */
function testUrl(url) {
  let noCORS = true;
  try {
    let success = false;
    httpsGet(url, (d) => {
      success = isNonEmptyString(d);
    }, !noCORS);
    return success;
  } catch(e) {
    return false;
  }
  return false;  // How did I get here?
}

/*
 * TODO: Consider different images based on role... I tried that and it got complicated.
 */
function chooseEndpointImageSrc(endpoint) {
  let chosenSrc = undefined;
  // The default value of getItem is null, but it should have been in JS, I think it should be undefined.
  chosenSrc = window.localStorage.getItem(endpoint) || undefined;
  if (chosenSrc == undefined) {
    chosenSrc = `../images/lineart/${endpoint}.png`;
    let urlWorks = testUrl(chosenSrc);
    if (!urlWorks) {
      chosenSrc = `../images/lineart/no_image.png`;
    }
  }
  window.localStorage.setItem(endpoint, chosenSrc);
  return chosenSrc;
}

/*
 * isSource (if not is_source, tha assumed is_destination)
 */
function populateScroller(scroller, endpoints, role) {
  let image_mapping = retrieveEndpointsImageMapping();

  for (let f in [1, 2, 3, 4]) {
//    appendEndpointFiller(scroller, role);
  }

  for (let endpoint of endpoints) {
    appendEndpoint(scroller, endpoint, role);
  }
}

function generateEndpoints() {
  let endpoints = getSortedEndpoints();
  populateScroller(
    document.$("#source"),
    endpoints.sources,
    'source'
  );

  populateScroller(
    document.$("#destination"),
    endpoints.destinations,
    'destination'
  );
}

function navToEmail() {
//  window.open("mailto:anerbenartzi@gmail.com?subject=Howdy&Body=Pardner", "_blank");
  document.$("#sendlink").click();
}


/**
 * A keypad for entering in a currency amount.
 * Some unusual behavior for which I ask forgiveness:
 *   - The decimal can only be pressed once.  After that it becomes a "clear" button.
 *   - There is no indication of how to clear until pressing the decimal.
 * A visual hint is attempted where the "cleared" state uses an outline font.
 
function keyclick(e) {
  let amount = document.$("#amount");
  let click_value = e.target.innerHTML;
  let decimal_clear = document.$("#decimal_clear");
  if (click_value == "0.00") {
    amount.innerHTML = "0.00";
    amount.classList.add("amount_clear");
    // When clearing, convert the key back to a decimal point.
    decimal_clear.classList.remove("keypad_clear");
    decimal_clear.innerHTML = ".";
  } else {
    // Special handling of the decimal/clear key and when typing begins
    if (amount.innerHTML == "0.00") {  // first real key for the amount
        amount.innerHTML = "";
        amount.classList.remove("amount_clear");
    }
    // Special handling of the decimal key
    if (click_value == ".") {
      decimal_clear.classList.add("keypad_clear");
      decimal_clear.innerHTML = "0.00";
    }
    amount.innerHTML += click_value;
  }
  ready();
}
*/

function keypadChanged(e) {
  let value = e.target.value;
  document.$('#amount').stringValue = value;
  ready();
}

function currencykeyclick(e) {
  let currency_key_elements = document.$$('.currency_key')
  for (let currency_key_element of currency_key_elements) {
    currency_key_element.classList.remove('selected');
  }
  e.target.classList.add('selected');
  ready();
}

function keydown(e) {
  document.getElementById('console-log').innerHTML += `${e.key}<br>`;
}

function noScroll() {
  window.scrollTo(0, 0);
}

/*
 * Tries to fetch from url anc call func(restult.text).
 * An error in fetching or in calling func() will cause a throw.
 */
function httpsGet(url, func, noCORS) {
  // TODO: Better error handling when the request fails.
  if (!url || !(url.match('^https://.*') || url.match('^[.]{1,2}/.*'))) {
    return;
  }
  fetch(url, {mode: noCORS ? 'no-cors' : 'cors'})
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Fetch response not OK for ${url}`);
      }
      return response.text();  // A promise that provides the response as text.
    })
    .then(func)
    .catch((error) => {
      console.error("ERROR calling httpsGet: ", error);
      throw error;
    });
}

function updateLocalStorageFromUrl(key, url, ttl_s) {
  let item = window.localStorage.getItem(key);
  if (!!item && ttl_s > 0) {  // DEVELOPMENT: use ttl_s as a boolean for now.
    return;
  }
  httpsGet(url, (data_text) => {
    window.localStorage.setItem(key, data_text);
  });
}

function PWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../pwa/sw.js", {scope: 'https://anerb.github.io/spendior/'});
  }
  /*
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', {scope: './spendior/', type: 'classic', updateViaCache: 'none'}).then((registration) => {
      console.log('Service worker registration succeeded:', registration);
    },  (error) => {
      console.error(`Service worker registration failed: ${error}`);
    });
  } else {
    console.error('Service workers are not supported.');
  }
  */
}

function WebComponents() {
  customElements.define("sd-endpoint", Endpoint);
  customElements.define("sd-keypad", Keypad);
  customElements.define("sd-price-display", PriceDisplay);
}

function BuildPage() {
  // HACKY: This implicitly depends on settings.
  generateEndpoints();
}

// Default to updating after a minimum of 6 hours.
function LoadSettings(ttl_s = 6*60*60) {

  updateLocalStorageFromUrl("CHF", "https://v6.exchangerate-api.com/v6/9f6f6bfda75673484596f7ab/latest/CHF", ttl_s);
  updateLocalStorageFromUrl("endpoints_csv", getSetting("published_endpoints_url"), ttl_s);
  // TODO: Add a button in settings to refresh exchange rate and published endpoints.

  // TODO: Add the currency based on the locale timestamp and/or location.
}

function ApplySettings() {
  // Applying the settings at startup.  This is why a refresh is needed when settings change.
  document.$("#static_header").classList.add(getSetting("keypad_location"));
  document.body.style.backgroundColor = getSetting("background_color");
}

function AddEventListeners() {
  window.onscroll = noScroll;
  for (let element of document.$$('.y-scroller')) {
    element.addEventListener('scroll', ready);
  }

  let input_elements = document.$$('input')
  for (let input_element of input_elements) {
    input_element.addEventListener('input', ready);
  }

  let currency_key_elements = document.$$('.currency_key')
  for (let currency_key_element of currency_key_elements) {
    currency_key_element.addEventListener('click', currencykeyclick);
  }

  let keypad = document.$('sd-keypad');
  keypad.addEventListener('change', keypadChanged);

  const state = document.visibilityState;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState == 'visible') {
      StartingPlaces();
    }
  });
}

function sendIt() {
  let noCORS = true;
  let sendUrl = buildSendUrl();
  httpsGet(sendUrl, (x) => {}, noCORS);
  StartingPlaces();
}

// HACKY: Find a better name.
// This puts all the scrolling/focus/orientation/animations in place to start.
// TODO: StartingPlaces() should probably be combined with PostSend().
function StartingPlaces() {
  scrollEndpointsToBottom();
  document.$("#keypad").clear();
  ready();
}

window.onload = () => {
  console.log("onload");
  PWA();
  WebComponents();
  LoadSettings();

  // FRAGILE: This needs to come after LoadSettings() to get the latest published_endpoints for the specific email_address.
  BuildPage();
  ApplySettings();
  AddEventListeners();
  StartingPlaces();
}
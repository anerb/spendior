// importScripts('https://unpkg.com/dexie@3.2.3/dist/dexie.js')

'use strict';

const version=20230504081258;
const db = new Dexie("Spendior");

Element.prototype.$ = HTMLElement.prototype.querySelector;
Element.prototype.$$ = HTMLElement.prototype.querySelectorAll;
Document.prototype.$ = Document.prototype.querySelector;
Document.prototype.$$ = Document.prototype.querySelectorAll;


// @import url("./currency.js");

function get(key) {
  return window.localStorage.getItem(key) || undefined;
}

function set(key, value) {
  return window.localStorage.setItem(key, value);
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

function goToSettings() {
  window.location.assign(`./settings.html?version=${version}`);
}

function generateTextImageDataUrl(text) {
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  ctx.font = "48px serif";
  let textMeasure = ctx.measureText(text);
  canvas.width = textMeasure.actualBoundingBoxRight - textMeasure.actualBoundingBoxLeft;
  canvas.height = 48;

  ctx = canvas.getContext('2d');
  ctx.font = "48px serif";
  ctx.fillText(text, -textMeasure.actualBoundingBoxLeft, textMeasure.actualBoundingBoxAscent);
  let dataURL = canvas.toDataURL();
  return dataURL;
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
  let source_endpoints = document.$$(`${id_selector} sd-endpoint`);
  let min_diff = 999999999;  // ARBITRARY
  let value = undefined;
  for (let c of source_endpoints) {
    let child_bottom = c.getBoundingClientRect().bottom;
    let diff = Math.abs(parent_bottom - child_bottom);
    if (diff < min_diff && diff < 100) {  // ARBITRARY
      min_diff = diff;
      value = c.attr('endpoint');
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


function getLocation() {

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    set('location', JSON.stringify([latitude, longitude]));
  }

  function error() {
    console.log("Unable to retrieve your location");
  }

  const options = {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 27000,
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error, options);
  }
}

function captureRecord() {
  let record = {};
  let today = new Date();
  record.server_id = get('record_id');
  record.server_sheetname = get("sheet_name");
  record.date_first = formatDate(today);
  record.date_final = formatDate(today);
  record.source = getScrollerValue("source");
  record.amount = document.$("#amount").value;
  record.currency = document.$("#currency").value;
  record.converted = document.$('#converter').innerHTML.replace(/[^0-9.]/g, '');
  record.destination = getScrollerValue("destination");
  record.username = get('username');
  record.location = get('location');
  record.version = version;
  return record;
}


// TODO: Make home_currency a setting
function buildSendUrl(record) {
  
  let queryParameters = [];
  for (let key in record) {
    let ẽkey = encodeURIComponent(key);
    let ẽvalue = encodeURIComponent(record[key]);
    let queryParameter = `${key}=${record[key]}`;
    queryParameters.push(queryParameter);
  }

  let href = get("server_url");
  href += '?';
  href += queryParameters.join('&');
  return href;
}

function updateCurrencyConversion() {

  let currency = document.$("#currency").value;
  let amount = document.$("#amount").value;

  // Update exchange rate
  let converter = document.$("#converter");

  // Visibility is orthogonal to generating the value.
  if (currency == "CHF" || currency == "OTH") {
    converter.classList.add("display_none");
  } else {
    converter.classList.remove("display_none");
  }

  let rate = 1.0;
  if (currency != 'CHF') {
    let rates = get('CHF');
    if (rates) {
      rates = JSON.parse(rates);
      rate = rates.conversion_rates[currency];
    } else {
      rate = 0.0;
    }
  }
  let home_value = amount / rate;
  home_value = Math.round(home_value * 100) / 100;
  let home_formatted = addCommasToDecimal(home_value);
  converter.innerHTML = "= " + home_formatted + " CHF";
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
  let endpointEl = e.target.closest("sd-endpoint");
  // if (navigator.virtualKeyboard) {  // Can't rely on this since Firefox/Safari don't have it.    
  //   navigator.virtualKeyboard.show();
  // }
  let newValue = window.prompt('Choose an endpoint:', endpointEl.attr('endpoint'));
  // if (navigator.virtualKeyboard) {  // Can't rely on this since Firefox/Safari don't have it.    
  //   navigator.virtualKeyboard.hide();
  // }

  if (!newValue) {  // all manner of degenerate endpoint values.
    return;
  }
  // This should trigger the right changes on attribute update.
  endpointEl.setAttribute('endpoint', newValue);
  endpointEl.commitAttributes();

  // since taking this action is a final setting mod, flip back
  endpointEl.$('.card').classList.remove('flipped');
}

// SUPER HACKY: need to better handle the different possible targets for click events.
function selectEndpoint(e) {
  let cardFaceEl = e.target.closest('.card_face');
  if (!cardFaceEl.classList.contains('front')) {
    // We really only want to handle clicks on the front.
    return;
  }
  let endpointEl = e.target.closest('sd-endpoint');
  let initial_bottom = e.target.getBoundingClientRect().bottom;
  let scrollerEl = e.target.closest('.y-scroller');
  let scroller_bottom = scrollerEl.getBoundingClientRect().bottom;
  let scroll_needed = initial_bottom - scroller_bottom;
  let initial_scroll = scrollerEl.scrollTop;
  scrollerEl.scrollTo({ top: initial_scroll + scroll_needed, behavior: 'smooth' });
}

function changeEndpoint(e) {
  if (e.target.classList.contains('text_input')) {
    showPrompt(e);
    return;
  }
}


function scrollEndpointsToBottom() {
  let source = document.$("#source");
  source.scrollTo({top: source.scrollHeight, behavior: 'smooth' });
  let destination = document.$("#destination");
  destination.scrollTo({top: destination.scrollHeight, behavior: 'smooth' });
}

function setImgAltTextClass(e) {
  let imageEl = e.target;
  if (!imageEl.tag == 'img') {
    return;
  }
  imageEl.classList.add('showing_alt_text');
}

function updateEndpointSrc(e) {
  let endpointEl = e.target.closest('sd-endpoint');
  let expectedTargetEl = endpointEl.$('.file_input');
  // SUPER HACKY: Finding out if we should listen to this change event at the sd-endpoint level.
  if (e.target !== expectedTargetEl) {
    return;
  }
  let endpoint = endpointEl.attr('endpoint');
  let card = endpointEl.$('.card');
  let img = endpointEl.$("img");  //  TODO:change to a class
  const reader = new FileReader();

  let file = e.target.files[0];

  reader.addEventListener(
    'load',
    () => {
      let dataUrl = reader.result;
      // TODO: scale down image using https://imagekit.io/blog/how-to-resize-image-in-javascript/
      // convert image file to base64 string
      let key = `source:${endpoint}`;
      set(key, dataUrl);
      key = `destination:${endpoint}`;
      set(key, dataUrl);
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

// TODO: Use locales and toLocaleString (including finding the char for decimal 'point')

 // takes a string, returns a string
 function addCommas(whole) {
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

// takes number, returns string
function addCommasToDecimal(decimal) {
  let parts = String(decimal).split('.');
  parts[0] = addCommas(parts[0]);
  if (parts.length >= 1) {
    return parts.join('.');
  }
  return parts[0];
}

class PriceDisplay extends HTMLElement {
 
  distributeValue = function() {
    let parts = this.value_.split('.');
    if (parts[0].length == 0) {
      this.dollars.classList.add('pending');
      this.dot.classList.add('pending');
      this.dimes.classList.add('pending');
      this.pennies.classList.add('pending');
      parts[0] += '0';
    } else {
      this.dollars.classList.remove('pending');
    }
    let withCommas = addCommas(parts[0]);
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

  // TODO: figure out the name for this pattern of "retreive or create".

class StagedAttributes extends HTMLElement {
  static get observedAttributes() {
    return ['is_staged', 'id'];
  }

  // The constructor is called before the Element is attached to the DOM
  constructor() {
    // Always call super first in constructor
    super();
  }

  addAllListeners() {}

  connectedCallback() {
    if (!this.isConnected) {
      return;
    }
    this.addAllListeners();
 
    // HACK to stop multiple constructor calls
    if (this.children.length > 0) {
      return;
    }

    this.restoreAttributesForId();
    this.commitAttributes();
  }

  prepareWard = function(wardName, tag, parentEl) {
    let wardEl = this.$(`.${wardName}`) || undefined;
    if (wardEl === undefined) {
      wardEl = document.createElement(tag);
      wardEl.setAttribute('class', wardName);    
      parentEl.appendChild(wardEl);
    }
    return wardEl;
  }
  
  /*
   * I'm taking over this to introduce the idea of staged attributes and committing.
   */
  attributeChangedCallback(attribute, oldValue, newValue) {
    // IDEA: this can compare normalized values in case capitalization, etc. doesn't matter
    if (oldValue == newValue) {
      return;
    }

    // if is_staged was removed (meaning that a commit occured)
    if ((attribute == 'is_staged') && (newValue == null)) {
      // OK. This is the real deal.  attribute == 'is_staged' and it has been removed.  I.E. a commitAttributes() happened.
      this.removeOldAttributes();
      this.committedAttributesChangedCallback();
      return;
    }

    if (attribute == 'is_staged') {
      return; // ignore the introduction of the is_staged attribute.
    }

    if (attribute.match(/^old_.*$/)) {
      console.error(`Should not happen because old_ attributes are not registered (${attribute}).`)
      return;
    }

    let oldAttribute = `old_${attribute}`; 
    if (this.getAttributeNames().includes(oldAttribute)) {
      // ignore this intermediate 'oldValue', and keep the one that was last true when the attributes were commited.
      // This looses some information, but if there are only going to be two attribtues:
      //   - the real/actual/current
      //   - the old
      //  , then it's better for the old to represent what is on-screen as a result of the most recent commit.
    } else {
      this.setAttribute(oldAttribute, oldValue);
      this.setAttribute('is_staged', '');
    }
    // That's it.  No actual work will be done by setting an attribute.
    return;
  }

  // A developer can choose to call this, or directly remove the is_staged attribute.
  commitAttributes() {
    if (!this.isConnected) {
      // When the element is connected, that also trigges a commitAttributes(),
      // so this call to commitAttributes() will be attempted again at the right time.
      return;
    }
    // This triggers the actual updates to the element based on the attributes.
    this.removeAttribute('is_staged');
  }

  removeOldAttributes() {
    let attributeNames = this.getAttributeNames();
    for (let attribute of attributeNames) {
      if (!attribute.match(/^old_/)) {
        continue;
      }
      this.getAttribute(attribute);
      this.removeAttribute(attribute);
    }
  }  

  committedAttributesChangedCallback() {
    this.backupAttributesForId();
  }

  /*
   * Returns a string, boolean, or undefined
   * for is_* attributes, a boolean is returned.
   */
  // TODO: figure out what the value is when attribute is present but not set to anything.
  attr = function(attribute) {
    let value = this.getAttribute(attribute) || undefined;

    if (!attribute.match(/^is_/)) {
      return value;
    }

    // Treat it as boolean

    // Even for is_* attributes, we want to return undefined to indicate it's not there.
    if (value === undefined) {
      return value;
    }
    
    // handle as string
    if (typeof value == typeof '') {
      value = value.toLowerCase().trim();
      let falseyStrings = ['undefined', 'null', '', 'false', 'f', 'no', 'n', '0'];
      if (falseyStrings.includes(value)) {
        return false;
      }
      return true;
    }

    // handle as anything else
    return !!value
  }

  // Returns all the attributes that aren't part of the stage/commit cycle.
  // I wonder if I should actually return the old values since those are what is active.
  // If so, I need to be careful to still return the regular attributes for those that don't participate in staging (e.g. class)
  // Also, maybe they should be now_attributes not old_attributes.
  getAttributes() {
    let attributes = {};
    let attributeNames = this.getAttributeNames();
    for (let attribute of attributeNames) {
      if (attribute.match(/^old_/)) {
        continue;
      }
      if (attribute == 'is_staged') {
        continue;
      }
      attributes[attribute] = this.attr(attribute);
    }
    return attributes;
  }

  backupAttributesForId() {
    // If this has an id, that is a signal to remember all the attributes for that id.
    let id = this.attr('id');
    if (id != undefined) {
      let attributes = this.getAttributes();
      set(`${id}.attributes`, attributes);
    }
  }

  // If this has an id, then the attributes are only fallback values if we don't have any in storage
  restoreAttributesForId() {
    if (!this.hasAttribute('id')) {
      return;
    }
    let attributes = this.defaultAttributes();
    let storedAttributes = get(`${this.getAttribute('id')}.attributes`);
    if (storedAttributes != undefined) {
      attributes = {
        ...this.defaultAttributes(),
        ...storedAttributes,
      }
    }

    for (let attribute in attributes) {
      this.setAttribute(attribute, attributes[attribute]);
    }
    this.commitAttributes();
  }

  defaultAttributes() {
    return {
      'is_staged': false,
      'id' : undefined,
    }
  }

}  // class StagedAttributes

class EndpointSettings extends HTMLElement {

}


// TODO: Maybe I can get rid of img_src and only store the b64 on img.src.
class Endpoint extends StagedAttributes {
  constructor() {
    // Always call super first in constructor
    super();
  }
  defaultAttributes() {
    let superDefaultAttributes = super.defaultAttributes();
    let defaults = {
      ...superDefaultAttributes,
      'endpoint': 'unknown_endpoint',
      'role': 'unknown_role',
    }
    return defaults;
  }

  static get observedAttributes() {
    return [...StagedAttributes.observedAttributes, 'endpoint', 'role'];
  }

  // This should real like a traditional attributeChangedCallback, but it knows all the attributes are valid and ready.
  committedAttributesChangedCallback() {
    super.committedAttributesChangedCallback();

    // The scaffolding
    this.defineScaffolding()

    // The front
    this.defineImage();

    // The back
    this.defineFileButton();
    this.defineTextInput();
  }

  addAllListeners() {
    // TODO: decide if I want to prevent.default for all "internal" events.
    // Q: Does shadow dom/light dom do this?
    this.addEventListener('click', changeEndpoint);  // I think eventlisteners are removed when the element is taken out of the dom (before being reinserted right away again);
    this.addEventListener('contextmenu', flipCard);
    this.addEventListener('change', updateEndpointSrc);
    this.addEventListener('error', setImgAltTextClass);
  }

  // The defineX functions have to be idempotent.
  // Basing them on prepareWard helps that effort.
  // TODO: Maybe use oldValue and reference counting to delete image storage
  defineImage = function() {
    // TODO: make lineartImages more dynamic, and a function of "theme" (when eventually there is a theme).
    let lineartImages = {
      bank: `bank`,
      cash: `cash`,
      credit_card: `credit_card`,
      no_image: `no_image`,
      other_destination: `other_destination`,
      other_source: `other_source`,
      person: `person`,
      store: `store`,
      filler: `FILLER`,
    };

    let knownImages = {
      atm: 'atm',
      ayelet_twint: 'ayelet_twint',
      bofa_mc: 'bofa_mc',
      bofa_visa: 'bofa_visa',
      box: 'box',
      cash: 'cash',
      cash_box: 'cash_box',
      cembra_mc: 'cembra_mc',
      certo_mastercard: 'certo_mastercard',
      chase: 'chase',
      chf: 'chf',
      coop: 'coop',
      coop_at_home: 'coop_at_home',
      credit_suisse_mastercard_debit: 'credit_suisse_mastercard_debit',
      credit_suisse_mc_debit: 'credit_suisse_mc_debit',
      credi_suisse_twint: 'credit_suisse_twint',
      cs_twint: 'cs_twint',
      editte_twint: 'editte_twint',
      eur: 'eur',
      first_ent: 'first_ent',
      firstent_visa_debit: 'firstent_visa_debit',
      gbp: 'gbp',
      gift_card: 'gift_card',
      kkiosk: 'kkiosk',
      lidl: 'lidl',
      migros: 'migros',
      migros_gift_card: 'migros_gift_card',
      no_image: 'no_image',
      other: 'other',
      paypal: 'paypal',
      person: 'person',
      starbucks: 'starbucks',
      store: 'store',
      tchibo: 'tchibo',
      twint: 'twint',
      ubs_twint: 'ubs_twint',
      ubs_visa_debit: 'ubs_visa_debit',
      usd: 'usd',
    }

    let endpoint = this.attr('endpoint');
    const imgEl = this.prepareWard('image', 'img', this.$('.front'));

    // Previously, I hadthe defaults in reverse, where it started with the most basic, and kept changing it while it could.
    // That doesn't turn out to work because I need to do more work for some (but not others).
    // Temporarily setting each one means that would would have to be undone.
    let chosenSrc = undefined;
    if (chosenSrc == undefined) {
      let img_src = get(endpoint);
      if (img_src != undefined) {
        chosenSrc = img_src;
      }
    }
    if (chosenSrc == undefined) {
      if (endpoint in lineartImages) {
        chosenSrc = `../images/lineart/${lineartImages[endpoint]}.png`;
      }
    }
    if (chosenSrc == undefined) {
      if (endpoint in knownImages) {
        chosenSrc = `../images/${knownImages[endpoint]}.png`;
      }
    }
    if (chosenSrc == undefined) {
      chosenSrc = generateTextImageDataUrl(endpoint);
    }

    imgEl.setAttribute('src', chosenSrc);
    imgEl.setAttribute('alt', endpoint);
    imgEl.setAttribute('title', this.attr('title'))
  }

  defineFileButton = function() {
    let fileButtonEl = this.prepareWard('file_button', 'div', this.$('.back'));
    fileButtonEl.classList.add('button');
    fileButtonEl.innerHTML = 'Choose an Image';  

    let fileInputEl = this.prepareWard('file_input', 'input', fileButtonEl);
    fileInputEl.setAttribute('type', 'file');
  }
  
  defineTextInput = function() {
    let textInputEl = this.prepareWard('text_input', 'div', this.$('.back'));
    textInputEl.classList.add('button');
    textInputEl.innerHTML = this.attr('endpoint');
  }

  defineScaffolding() {
    // Build up the basic scaffolding of this Element
    const cardEl = this.prepareWard('card', 'div', this);
    const frontEl = this.prepareWard('front', 'div', cardEl);
    frontEl.classList.add('card_face');
    const backEl = this.prepareWard('back', 'div', cardEl);
    backEl.classList.add('card_face');
  }
} // class Endpoint

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

  let endpoints_csv = get("endpoints_csv");
  if (endpoints_csv != undefined) {
    let endpoints_array = csv2array(endpoints_csv);
    let email_re = get("email_re");
    endpoints = getEndpointsForEmail(endpoints_array, email_re);
  }

  // add "OTHER" to the bottom of the list (most common)
  let ñendpoints = modifySortedEndpoints(endpoints);
  return ñendpoints;
}

function appendEndpoint(parent, endpoint, role) {
  // TODO: check against a less permissive regexp
  if (endpoint == "") {
    return;
  }
  let endpointEl = document.createElement('sd-endpoint');
  endpointEl.setAttribute('endpoint', endpoint);
  endpointEl.setAttribute('role', role);
  endpointEl.commitAttributes();
  parent.appendChild(endpointEl);
}

function appendEndpointFiller(parent, role) {
  appendEndpoint(parent, 'filler', role);
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

  let alwaysPresentEndpoints = get('always_present_endpoints') || '';
  let alwaysEndpoints = alwaysPresentEndpoints.trim().split(/\s*,\s*/);

  let ñsources = augmentSortedEndpoints(endpoints.sources, alwaysEndpoints, IS_SOURCE);
  let ñdestinations = augmentSortedEndpoints(endpoints.destinations, alwaysEndpoints, !IS_SOURCE);
  let ñendpoints = {sources: ñsources, destinations: ñdestinations};
  return ñendpoints;
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
  let value = get(key);
  if (value != undefined) {
    value = "";
  }
  return value;
}

/*
 * isSource (if not is_source, tha assumed is_destination)
 */
function populateScroller(scroller, endpoints, role) {
  for (let f in [1, 2, 3, 4]) {
    appendEndpointFiller(scroller, role);
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
}
*/

function keypadChanged(e) {
  let value = e.target.value;
  document.$('#amount').stringValue = value;
  updateCurrencyConversion();
}

/*
function currencykeyclick(e) {
  let currency_key_elements = document.$$('.currency_key')
  for (let currency_key_element of currency_key_elements) {
    currency_key_element.classList.remove('selected');
  }
  e.target.classList.add('selected');
}
*/

function keydown(e) {
  document.getElementById('console-log').innerHTML += `${e.key}<br>`;
}

function noScroll() {
  window.scrollTo(0, 0);
}

/*
 * Tries to fetch from url and call func(restult.text).
 * An error in fetching or in calling func() will cause a throw.
 */
function httpsGet(url, func, noCORS) {
  // TODO: Better error handling when the request fails.
  if (!url || !(url.match('^https://.*') || url.match('^[.]{1,2}/.*'))) {
    return;
  }
  console.log(['prefetch', url]);
  fetch(url, {mode: noCORS ? 'no-cors' : 'cors'})
    .then((response) => {
      console.log(['back', response.sd, JSON.stringify(response)]);
      if (!noCORS && !response.ok) {
        throw new Error(`Fetch response not OK for ${url}`);
      }
      return response.text();  // A promise that provides the response as text.
    })
    .then(func)
    .catch((error) => {
      console.error("ERROR calling httpsGet: ", error);
    });
}

function updateLocalStorageFromUrl(key, url, ttl_s) {
  let item = get(key);
  let key_s = `${key}_s`;
  let item_s = get(key_s) || 0;
  var now = new Date();
  var now_s = Math.round(now.getTime() / 1000);
  var age_s = now_s - item_s;
  if (!!item && (ttl_s > age_s)) {
    return;
  }
  httpsGet(url, (data_text) => {
    set(key, data_text);
    set(key_s, now_s);
  });
}

function PWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
      "../sw.js?version=20230504081258",
       // {scope: 'http://localhost:3000'}
       {scope: 'https://anerb.github.io/spendior/'}
    )
  }
}

function WebComponents() {
  console.log("WebComponents");
  customElements.define("sd-staged-attributes", StagedAttributes);
  customElements.define("sd-endpoint", Endpoint);
  customElements.define("sd-keypad", Keypad);
  customElements.define("sd-price-display", PriceDisplay);
}

function BuildPage() {
  // HACKY: This implicitly depends on settings.
  generateEndpoints();
}

// Default to updating after a minimum of 6 hours.
function LoadSettings(ttl_s = 6) {

  updateLocalStorageFromUrl("CHF", "https://v6.exchangerate-api.com/v6/9f6f6bfda75673484596f7ab/latest/CHF", ttl_s);
  updateLocalStorageFromUrl("endpoints_csv", get("published_endpoints_url"), ttl_s);
  // TODO: Add a button in settings to refresh exchange rate and published endpoints.

  // TODO: Add the currency based on the locale timestamp and/or location.
}

function ApplySettings() {
  // Applying the settings at startup.  This is why a refresh is needed when settings change.
  document.$("#static_header").classList.add(get('keypad_location'));
  document.body.style.backgroundColor = get('background_color');
  document.$("#username").innerHTML = get('username') || "pick a username";
}

function AddEventListeners() {
  window.onscroll = noScroll;
  for (let element of document.$$('.y-scroller')) {
    element.addEventListener('click', selectEndpoint);
  }

  let input_elements = document.$$('input')

  document.$('#gear').addEventListener('click', goToSettings);

  if (get('username') == undefined) {
    document.$('#username').addEventListener('click', goToSettings);
  }

  document.$('sd-keypad').addEventListener('change', keypadChanged);
  document.$('#currency').addEventListener('change', updateCurrencyConversion);
}


async function wakeUpServiceWorker() {
  let reg = await navigator.serviceWorker.ready;
  reg.active.postMessage("Wake up.");
}

function sendIt() {
  let server_id = get("server_id");
  let server_revision = get("server_revision");
  let state = "PENDING";
  let record = captureRecord();
  let record_json = JSON.stringify(record);

  db.records.put(
    {server_id, server_revision, state, record_json}
  ).then(
      wakeUpServiceWorker
  ).catch (function (e) {
    console.log ("Error putting record in db", e);
  });

  StartingPlaces();
}

function showNotification(title, body) {
  Notification.requestPermission((result) => {
    if (result === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
            body: body,
            icon: '../images/eur.png',
//            vibrate: [200, 100, 200, 100, 200, 100, 200],
//            tag: "vibration-sample",
        });
      });
    }
  });
}

function randomNotification(title, body) {
  const notifImg = '../images/eur.png';
  const options = {
    body: body,
    icon: notifImg,
  };

}

/*
 * Generates a random id out of 2^64 possible ids.
 * Uses the characters from plus-codes so the id will not form unpleasant words by accident.
 */
function createRandomId() {
  // There are 20 plus-code characters, so each one takes about 4.321 bits to encode.
  let plusCodeChars = '23456789CFGHJMPQRVWX';
  let id = '';
  for (let c = 0; c < Math.floor(64/4.321); c++) {
    id += plusCodeChars[Math.floor(20*Math.random())];
  }
  return id;
}

// HACKY: Find a better name.
// This puts all the scrolling/focus/orientation/animations in place to start.
// TODO: StartingPlaces() should probably be combined with PostSend().
function StartingPlaces() {
  getLocation(); 
  set('server_id', createRandomId());
  set('server_revision', 0);
  set('status', 'READY');
  scrollEndpointsToBottom();
  document.$("#keypad").clear();
}

function InitialzeDB() {
  db.version(1).stores({
    records: "[server_id+server_revision],state,record_json",
    settings: "[key],value",
  });
}

window.onload = () => {
  console.log("onload");
  InitialzeDB();
  PWA();
  WebComponents();
  LoadSettings();

  // FRAGILE: This needs to come after LoadSettings() to get the latest published_endpoints for the specific email_address.
  BuildPage();
  ApplySettings();
  AddEventListeners();
  StartingPlaces();
}


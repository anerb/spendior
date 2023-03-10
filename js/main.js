'use strict';

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
  let scroller = document.querySelector(id_selector);
  let parent_bottom = source.getBoundingClientRect().bottom;
  let source_endpoints = document.querySelectorAll(id_selector + " sd-endpoint");
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

function ready() {
  let body = {};
  let today = new Date();
  body.sheet_name = getSetting("sheet_name");
  body.date_first = formatDate(today);
  body.date_final = formatDate(today);
  body.source = getScrollerValue("source");
  body.amount = document.querySelector("#amount").value;
  body.currency = document.querySelector("#currency").value;
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
  document.querySelector("#sendlink").href = href;

  // Update exchange rate
  let converter = document.querySelector("#converter");
  if (body.currency == "CHF" || body.currency == "OTH") {
    converter.classList.add("display_none");
  }
  if (body.currency != "CHF") {
    let chf = window.localStorage.getItem('CHF');
    if (chf) {
      chf = JSON.parse(chf);
      let rate = chf.conversion_rates[body.currency];
      let chf_value = body.amount / rate;
      chf_value = Math.round(chf_value * 100) / 100;
      converter.innerHTML = "= " + chf_value + " CHF";
      converter.classList.remove("display_none");
    }
  }
}

function updateSource() {
  source_value = document.querySelector('input[name="source"]:checked').value;
  document.querySelector("#source_text").value = source_value;
}


function updateDestination() {
  destination_value = document.querySelector('input[name="destination"]:checked').value;
  document.querySelector("#destination_text").value = destination_value;
}

function selectEndpoint(e) {
  let card = e.closest(".endpoint_card");
  if ('endpoint_card_flipped' in card.classList) {
    return;
  }
  let initial_bottom = e.target.getBoundingClientRect().bottom;
  let parentElement = e.target.closest(".y-scroller");
  let parent_bottom = parentElement.getBoundingClientRect().bottom;
  let scroll_needed = initial_bottom - parent_bottom;
  let initial_scroll = parentElement.scrollTop;
  parentElement.scrollTo({ top: initial_scroll + scroll_needed, behavior: 'smooth' });
  ready();
}

function scrollEndpointsToBottom() {
  let source = document.querySelector("#source");
  source.scrollTo({top: source.scrollHeight, behavior: 'smooth' });
  let destination = document.querySelector("#destination");
  destination.scrollTo({top: destination.scrollHeight, behavior: 'smooth' });
}

function chooseImageFile(e) {
  e.preventDefault();
  e.target.parentElement.querySelector("input").click();
}

function updateEndpointSrc(e) {
  let sdEndpoint = e.target.closest("sd-endpoint");
  let endpoint = sdEndpoint.getAttribute('endpoint');
  let card = sdEndpoint.querySelector('.endpoint_card');
  let img = sdEndpoint.querySelector("img");  //  TODO:change to a class
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
      card.classList.remove('endpoint_card_flipped');
    },
    false
  );

  if (file) {
    reader.readAsDataURL(file);
  }
}


function flipCard(e) {
  e.preventDefault();
  e.target.closest(".slot").querySelector(".endpoint_card").classList.toggle('endpoint_card_flipped');
}


class PriceDisplay extends HTMLElement {

  // takes a string, returns a string
  addCommas = function(whole) {
    let ñwhole = "";
    // Iterate in reverse;
    for (let d = whole.length - 1; d >= 0; d--) {
      ñwhole = whole[d] + ñwhole;  // prepend
      if (d % 3 == 0 && d != 0) {
        ñwhole = ',' + ñwhole;  // prepend
      }
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

  // emitted as a string, which is strange
  get value() {
    let ñdollars = this.dollars.innerHTML;
    ñdollars = ñdollars.replace('/,/', '');
    let renderedValue = `${ñdollars}.${this.dimes.innerHTML}${this.pennies.innerHTML}`
  }

  set value (v) {
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
        let key = this.querySelector(`.role_${role}`);
        key.classList.remove('disabled');
      }
      this.querySelector('.role_0').classList.remove('disabled');
      // Show a disabled dot.  There is no need to clear a cleared value_
      this.querySelector('.role_dot').classList.add('disabled');
      this.querySelector('.role_dot').classList.remove('display_none');

      this.querySelector('.role_clear').classList.add('display_none');
    }

    // The only valid key is '.'  (clear should not be visible)
    if (this.value_ == "0") {
      for (let role in roles) {
        let key = this.querySelector(`.role_${role}`);
        key.classList.add('disabled');
      }
      this.querySelector('.role_0').classList.add('disabled');
      this.querySelector('.role_dot').classList.remove('disabled');
      this.querySelector('.role_dot').classList.remove('display_none');
      this.querySelector('.role_clear').classList.add('display_none');
    }

    // A valid integer appears
    // Waiting for 0-9 or dot
    if (this.value_.match(/^[1-9][0-9]*$/) != null) {
      // all keys are enabled.
      for (let role in roles) {
        let key = this.querySelector(`.role_${role}`);
        key.classList.remove('disabled');
      }
      this.querySelector('.role_0').classList.remove('disabled');
      this.querySelector('.role_dot').classList.remove('disabled');
      this.querySelector('.role_dot').classList.remove('display_none');
      this.querySelector('.role_clear').classList.add('display_none');
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
        let key = this.querySelector(`.role_${role}`);
        key.classList.remove('disabled');
      }
      this.querySelector('.role_0').classList.remove('disabled');
      this.querySelector('.role_dot').classList.add('disabled');
      this.querySelector('.role_dot').classList.add('display_none');
      this.querySelector('.role_clear').classList.remove('display_none');
    }

    // 0.12
    // 0.00
    // 1.20
    // Nothing more to type. Only clear is an option.
    if (this.value_.match(/[0-9]+[.][0-9][0-9]/) != null) {
      // all keys are enabled.
      for (let role in roles) {
        let key = this.querySelector(`.role_${role}`);
        key.classList.add('disabled');
      }
      this.querySelector('.role_0').classList.add('disabled');
      this.querySelector('.role_dot').classList.add('disabled');
      this.querySelector('.role_dot').classList.add('display_none');
      this.querySelector('.role_clear').classList.remove('display_none');
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

class Endpoint extends HTMLElement {
  constructor() {

    // Always call super first in constructor
    super();


    // HACK to stop multiple constructor calls
    this.addEventListener('click', selectEndpoint);  // I think eventlisteners are removed when the element is taken out of the dom (before being reinserted right away again);
    this.addEventListener('contextmenu', flipCard);
    let fileChild = this.querySelector("input");
    if (fileChild) {
      fileChild.addEventListener('change', updateEndpointSrc);
    }
    if (this.children.length > 0) {
      return;
    }

    const endpoint = this.getAttribute('endpoint');
    const title = this.getAttribute('title');
    const img_src = this.getAttribute('img_src');

    const card = document.createElement('div');
    card.classList.add('endpoint_card');

    const front = document.createElement('div');
    front.classList.add('endpoint_front');
    front.classList.add('endpoint_card_face');

    const img = document.createElement('img');
    img.setAttribute('class', 'endpoint_image');
    img.src = img_src;
    img.setAttribute('alt', endpoint);
    img.setAttribute('title', title)

    const label = document.createElement('div');
    label.innerHTML = title;
    label.setAttribute('class', 'endpoint_label');

    front.appendChild(img);
    front.appendChild(label);

    const back = document.createElement('div');
    back.classList.add('endpoint_back');
    back.classList.add('endpoint_card_face');

    const fileButton = document.createElement('div');
    fileButton.classList.add('endpoint_file_button');
    fileButton.innerHTML = 'Choose an Image';

    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.classList.add('endpoint_input');
    fileInput.addEventListener('change', updateEndpointSrc);

    fileButton.appendChild(fileInput);

    back.appendChild(fileButton);

//    front.innerHTML = "FRONT";
//    back.innerHTML = "back";

    card.appendChild(front);
    card.appendChild(back);

    this.appendChild(card);
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

  return {
    sources: sortInventory(ĩsources),
    destinations: sortInventory(ĩdestinations),
  }

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

function appendEndpoint(parent, endpoint, img_src, title) {
  // TODO: check against a less permissive regexp
  if (endpoint == "") {
    return;
  }
  let html = `<sd-endpoint class="slot" endpoint="${endpoint}" img_src="${img_src}" title="${title}"></sd-endpoint>`;
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
  let images = tbody.querySelectorAll("img");
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
  let trs = tbody.querySelectorAll("tr");
  for (let tr of trs) {
    let row = [];
    let tds = tr.querySelectorAll("td");
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

  let lis = desired_body.querySelectorAll('li[id*="sheet-button-"]');
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

/*
 * For isSource,
 * Try source:endpoint, then destination:endpoint, then the hardcoded ../images/endpoint.png
 */
function chooseEndpointImageSrc(endpoint, isSource) {
  let prefix = isSource ? `source:` : `destination:`;
  let unprefix = isSource ? `destination:` : `source:`;
  let candidateKeys = [
    `${prefix}${endpoint}`,
    `${unprefix}${endpoint}`,
    endpoint,
  ]

  // The default value of getItem is null, but in JS, I think it should be undefined.
  let chosenSrc = undefined;
  if (chosenSrc == undefined) {
    chosenSrc = window.localStorage.getItem(`${prefix}${endpoint}`) || undefined;
  }
  if (chosenSrc == undefined) {
    chosenSrc = window.localStorage.getItem(`${unprefix}${endpoint}`) || undefined;
  }
  if (chosenSrc == undefined) {
    chosenSrc = `../images/lineart/${endpoint}.png`;
  }
  return chosenSrc;
}

/*
 * isSource (if not is_source, tha assumed is_destination)
 */
function populateScroller(scroller, endpoints, isSource) {
  let image_mapping = retrieveEndpointsImageMapping();

  for (let endpoint of endpoints) {
    let img_src = chooseEndpointImageSrc(endpoint, isSource);
    let title = snake_case2PascalCase(endpoint);
    appendEndpoint(scroller, endpoint, img_src, title);
  }
}

function generateEndpoints() {
  let endpoints = getSortedEndpoints();
  populateScroller(document.querySelector("#source"), endpoints.sources, true);
  populateScroller(document.querySelector("#destination"), endpoints.destinations, false);
}

function navToEmail() {
//  window.open("mailto:anerbenartzi@gmail.com?subject=Howdy&Body=Pardner", "_blank");
  document.querySelector("#sendlink").click();
}


/**
 * A keypad for entering in a currency amount.
 * Some unusual behavior for which I ask forgiveness:
 *   - The decimal can only be pressed once.  After that it becomes a "clear" button.
 *   - There is no indication of how to clear until pressing the decimal.
 * A visual hint is attempted where the "cleared" state uses an outline font.
 
function keyclick(e) {
  let amount = document.querySelector("#amount");
  let click_value = e.target.innerHTML;
  let decimal_clear = document.querySelector("#decimal_clear");
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
  document.querySelector('#amount').value = value;
}

function currencykeyclick(e) {
  let currency_key_elements = document.querySelectorAll('.currency_key')
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

function updateLocalStorageFromUrl(key, url) {
  // TODO: Better error handling when the request fails.
  if (!url || !url.match('^https://.*')) {
    return;
  }
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Fetch response not OK for ${key}, ${url}`);
      }
      return response.text();  // A promise that provides the response as text.
    })
    .then((data_text) => {
      window.localStorage.setItem(key, data_text);
    })
    .catch((error) => {
      console.error("ERROR calling updateLocalStorageFromUrl: ", error);
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

function LoadSettings() {

  // TODO: Only do these if the old ones are more than a couple of hours old.
  updateLocalStorageFromUrl("CHF", "https://v6.exchangerate-api.com/v6/9f6f6bfda75673484596f7ab/latest/CHF");
  updateLocalStorageFromUrl("endpoints_csv", getSetting("published_endpoints_url"));
  // TODO: Add a button in settings to refresh exchange rate and published endpoints.

  // TODO: Add the currency based on the locale timestamp and/or location.
}

function ApplySettings() {
  // Applying the settings at startup.  This is why a refresh is needed when settings change.
  document.querySelector("#static_header").classList.add(getSetting("keypad_location"));
  document.body.style.backgroundColor = getSetting("background_color");
}

function AddEventListeners() {
  window.onscroll = noScroll;
  for (let element of document.querySelectorAll('.y-scroller')) {
    element.addEventListener('scroll', ready);
  }

  let input_elements = document.querySelectorAll('input')
  for (let input_element of input_elements) {
    input_element.addEventListener('input', ready);
  }

  let currency_key_elements = document.querySelectorAll('.currency_key')
  for (let currency_key_element of currency_key_elements) {
    currency_key_element.addEventListener('click', currencykeyclick);
  }

  let keypad = document.querySelector('sd-keypad');
  keypad.addEventListener('change', keypadChanged);

  const state = document.visibilityState;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState == 'visible') {
      StartingPlaces();
    }
  });

}

function sendIt() {

}

// HACKY: Find a better name.
// This puts all the scrolling/focus/orientation/animations in place to start.
// TODO: StartingPlaces() should probably be combined with PostSend().
function StartingPlaces() {
  scrollEndpointsToBottom();
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
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
  body.spreadsheet_id = getSetting("spreadsheet_id");
  body.sheet_name = getSetting("sheet_name");
  body.date_first = formatDate(today);
  body.date_final = formatDate(today);
  body.source = getScrollerValue("source");
  body.amount = document.querySelector("#amount").innerHTML;
  body.currency = document.querySelector("#currency").value;
  body.destination = getScrollerValue("destination");
  body.description = "DESCRIPTION";
  
  let subject = `${body.source} > [${body.amount} ${body.currency}] >  ${body.destination}`;

  let body_json = JSON.stringify(body);
  body_json = body_json.replace(/,/g, ",\n  ");
  body_json = body_json.replace(/:/g, ":  ");
  body_json = body_json.replace(/{/, "{\n  ");
  body_json = body_json.replace(/}/, "\n}");
  let finalValues = [
    'mailto:' + encodeURIComponent(getSetting("processing_email_address")) + '?subject=' + encodeURIComponent(subject),
    'body=' + encodeURIComponent(body_json),
  ];

  let mailtourl = finalValues.join('&');
//  let sendItem = document.querySelector("#send-email");
//  sendItem.action = finalValues.join('&'); 
   document.querySelector("#sendlink").href = mailtourl;

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

class Endpoint extends HTMLElement {
  constructor() {

    // Always call super first in constructor
    super();


    // HACK to stop multiple constructor calls
    this.addEventListener('click', selectEndpoint);  // I think eventlisteners are removed when the element is taken out of the dom (before being reinserted right away again);
    if (this.children.length > 0) {
      return;
    }

    // Create a shadow root
    //    const shadow = this.attachShadow({mode: 'open'});
    // Create spans
    //    const wrapper = document.createElement('div');
    //    wrapper.setAttribute('class', 'wrapper');

    const endpoint = this.getAttribute('endpoint');
    const title = this.getAttribute('title');
    const img_src = this.getAttribute('img_src');

    const img = document.createElement('img');
    img.setAttribute('class', 'endpoint');
    img.src = img_src;
    img.setAttribute('alt', endpoint);
    img.setAttribute('title', title)

    const label = document.createElement('div');
    label.innerHTML = title;
    label.setAttribute('class', 'endpoint_label');

    // Create some CSS to apply to the shadow dom
    const style = document.createElement('style');

    // Attach the created elements to the shadow dom
//    shadow.appendChild(style);
//    shadow.appendChild(wrapper);
      this.appendChild(img);
      this.appendChild(label);
////    wrapper.appendChild(source_radio);
//    wrapper.appendChild(img);
//    wrapper.appendChild(label);
//    wrapper.appendChild(destination_radio);
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

function getEndpointsForEmail(arr, email_re) {
  // This will hold the index of the column for a header value.
  // E.G. header[source] is 0 or 1 ... header[anerbenartzi@outlook.com] is 4 or something like it.
  let sources = {};
  let destinations = {};
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
    if (!(source in sources)) {
      sources[source] = 0;
    }
    sources[source]+=count;
    if (!(destination in destinations)) {
      destinations[destination] = 0;
    }
    destinations[destination]+=count;
  }

  let less_than = function(a, b) {
    if (a.count == b.count) {
      if (a.name == b.name) {
        return 0;
      }
      return a.name < b.name ? -1 : 1;
    }
    return a.count < b.count ? -1 : 1;
  };

  let sources_sorted = [];
  for (let source in sources) {
    sources_sorted.push({name: source, count: sources[source]});
  }
  sources_sorted.sort(less_than);
  let source_names = [];
  for (let source of sources_sorted) {
    if (source.count <= 0) {
      continue;
    }
    source_names.push(source.name);
  }
  let destinations_sorted = [];
  for (let destination in destinations) {
    destinations_sorted.push({name: destination, count: destinations[destination]});
  }
  destinations_sorted.sort(less_than);
  let destination_names = [];
  for (let destination of destinations_sorted) {
    if (destination.count <= 0) {
      continue;
    }
    destination_names.push(destination.name);
  }
  return {sources: source_names, destinations: destination_names}

}

function getEndpointsCsv() {
  let endpoints_text = window.localStorage.getItem("endpoints_csv");
  if (!endpoints_text) {
    endpoints_text = 
    [
    "source,destination,any@example.com",
    "credit_card,store,1",
    "credit_card,credit_card,1",
    "bank,credit_card,11",
    "bank,store,1",
    "cash,store,1",
    "bank,cash,1",
    "cash,person,1",
    "person,cash,1",
  ].join("\n");
  }
}


// TODO: Perhaps formalize the store/retrieve pattern separate from fetch/refetch
function retrieveEndpointsArray() {
  let json = window.localStorage.getItem("endpoints_array");
  let endpoints_array = [];
  try {
    endpoints_array = JSON.parse(json);
  } catch(e) {}
  return endpoints_array;
}

function getSortedEndpoints() {
  let email_re = getSetting("email_re");
  let endpoints_array = retrieveEndpointsArray();
  let endpoints = getEndpointsForEmail(endpoints_array, email_re);
  // add "OTHER" to the bottom of the list (most common)
  modifyEndpointsOther(endpoints);
  return endpoints;
}

function appendEndpoint(parent, endpoint, img_src, title) {
  // TODO: check against a less permissive regexp
  if (endpoint == "") {
    return;
  }
  let html = `<sd-endpoint class="slot" endpoint="${endpoint}" img_src="${img_src}" title="${title}"></sd-endpoint>`;
  parent.innerHTML += html;
}


// Originally, I set "other" to be at the start (farthest from the most popular).
// However, that made it so the most popular were pre-selected in endpoints, which means open,digits,send would erronously capture the endpoints.
function modifyEndpointsOther(endpoints) {
  let other_index = endpoints.sources.indexOf("FromOTHER");
  if (other_index >= 0) {
    endpoints.sources.splice(other_index, 1);
  }
  endpoints.sources.push("FromOTHER");

  other_index = endpoints.destinations.indexOf("ToOTHER");
  if (other_index >= 0) {
    endpoints.destinations.splice(other_index, 1);
  }
  endpoints.destinations.push("ToOTHER");
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

// HACK: assumes all values are strings, and no complex quoting.
// TODO: make the base setting a JSON(array) instead of csv.
function array2csv(arr) {
  let csv_rows = [];
  for (let row of arr) {
    let csv_row = row.join(",");
    csv_rows.push(csv_row);
  }
  let csv = csv_rows.join("\n");
  return csv;
}

function tbody2csv(tbody) {
  let arr = tbody2array(tbody);
  let csv = array2csv(arr);
  return csv;
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

// Inside the HTML, there is a script that has text which describes the desired body.
// FRAGILE: Relies on the way Google Sheets generates a published spreadsheet html.
function getDesiredBodyFromPublishedSpreadsheet() {
  let published_spreadsheet_text = memoFetch("published_spreadsheet_text");
  if (published_spreadsheet_text.indexOf("<body") < 0) {
    published_spreadsheet_text = "<body></body>";
  }
  let desired_body_text = published_spreadsheet_text.slice(
    published_spreadsheet_text.indexOf("<body"),
    published_spreadsheet_text.indexOf("</body") + "</body>".length
  );
  let parser = new DOMParser();
  let desired_body = parser.parseFromString(desired_body_text, "text/html");
  return desired_body;
}

function getTbodyByName(name) {
  let desired_body = getDesiredBodyFromPublishedSpreadsheet();
  let sheet_names = getSheetNames(desired_body);
  let gid = sheet_names[name];  // FRAGILE (hardcoded key)
  if (!gid) {
    // not necessarily an error if no images where published
    return undefined;
  }
  // Everything we need is in the tbodys that each represent a published sheet.
  let tbody = desired_body.querySelector(`div[id="${gid}"] tbody`);
  return tbody;
}

function storeEndpointsImageMapping() {
  let tbody = getTbodyByName("images");
  if (tbody === undefined) {
    return;
  }
  let image_mapping = tbody2imageMapping(tbody)
  window.localStorage.setItem("endpoints_image_mapping", JSON.stringify(image_mapping));
}

// EARLIER: This was going to store the final ordering,
// but that depends on the email_re
function storeEndpointsArray() {
  let tbody = getTbodyByName("endpoints");
  if (tbody === undefined) {
    return;
  }
  let endpoints_array = tbody2array(tbody);
  window.localStorage.setItem("endpoints_array", JSON.stringify(endpoints_array));
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

function populateScroller(scroller, endpoints) {
  let image_mapping = retrieveEndpointsImageMapping();

  for (let endpoint of endpoints) {
    let img_src = image_mapping[endpoint] || `../images/${endpoint}.png`;
    let title = snake_case2PascalCase(endpoint);
    appendEndpoint(scroller, endpoint, img_src, title);
  }
}

function generateEndpoints() {
  let endpoints = getSortedEndpoints();

  populateScroller(document.querySelector("#source"), endpoints.sources);
  populateScroller(document.querySelector("#destination"), endpoints.destinations);
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
 */
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
  fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.text();  // A promise that provides the response as text.
      } else {
        console.error(["NETWORK RESPONSE ERROR", key, url]);  // is there a response.errorcode?
      }
    })
    .then((data_text) => {
      window.localStorage.setItem(key, data_text);
    })
    .catch((error) => console.error("FETCH ERROR:", error));
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
}

function BuildPage() {
  // HACKY: This implicitly depends on settings.
  generateEndpoints();
}

function LoadSettings() {
  // TODO: Only do these if the old ones are more than a couple of hours old.
  updateLocalStorageFromUrl("CHF", "https://v6.exchangerate-api.com/v6/9f6f6bfda75673484596f7ab/latest/CHF");
  updateLocalStorageFromUrl("published_spreadsheet_text", getSetting("published_spreadsheet_url"));
  storeEndpointsArray();
  storeEndpointsImageMapping();
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
  let key_elements = document.querySelectorAll('.key')
  for (let key_element of key_elements) {
    key_element.addEventListener('click', keyclick);
  }

  let currency_key_elements = document.querySelectorAll('.currency_key')
  for (let currency_key_element of currency_key_elements) {
    currency_key_element.addEventListener('click', currencykeyclick);
  }

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
  while (  document.querySelector("#amount").innerHTML != "0.00") {
    document.querySelector("#decimal_clear").click();
  }
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
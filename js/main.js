// @import url("./currency.js");

function scrollerMoved(e) {
  console.log([e, e.scrollLeft, e.scrollTop]);
}

function reclick(e) {
  e.click()
};

function refocus(e) {
  e.focus()
};


function selectItem(item) {
  item.classList.add('selected');
}

function postSend() {
  document.querySelector("#amount").value = "";
  document.querySelector("#what").value = "";
  return true;
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
      value = c.getAttribute("institution");
    }
  }
  return value;
}

function ready() {
  console.log("ready");
  let body = {
    source: "",
    destination: "",
    amount: "",
    currency: "",
    what: "",
  }
  body.source = getScrollerValue("source");
  body.destination = getScrollerValue("destination");
  body.currency = document.querySelector("#currency").value;
  body.amount = document.querySelector("#amount").innerHTML;
  body.what = document.querySelector("#what").value;
  
  subject = body.source + " > " + body.amount + " (" + body.what + ") > " + body.destination;

  let body_json = JSON.stringify(body);
  let finalValues = [
    'mailto:anerbenartzi+email2sheet@gmail.com?subject=' + encodeURIComponent(subject),
    'cc=' + encodeURIComponent('"16I2ldN2v_an0u5c09zYpr_bKAw0DBeTH53NRnxtvFkw" <anerbenartzi+email2sheet@gmail.com>'),
    'bcc=' + encodeURIComponent('"entries" <anerbenartzi+email2sheet@gmail.com>'),
    'body=' + encodeURIComponent(body_json),
  ];

  let sendItem = document.querySelector("#send-email");
  sendItem.action = finalValues.join('&'); 
}

function updateSource() {
  source_value = document.querySelector('input[name="source"]:checked').value;
  document.querySelector("#source_text").value = source_value;
}


function updateDestination() {
  destination_value = document.querySelector('input[name="destination"]:checked').value;
  document.querySelector("#destination_text").value = destination_value;
}


class Endpoint extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();

    // Create a shadow root
//    const shadow = this.attachShadow({mode: 'open'});

    // Create spans
  //  const wrapper = document.createElement('div');
  //  wrapper.setAttribute('class', 'wrapper');

    const institution = this.getAttribute('institution');
    const description = this.getAttribute('description');

    /*
    const source_radio = document.createElement('input');
    source_radio.setAttribute('class', 'source_radio');
    source_radio.setAttribute('type', 'radio');
    source_radio.setAttribute('name', 'source');
    source_radio.setAttribute('value', institution);
    source_radio.addEventListener('input', updateSource);
  */

    const img = document.createElement('img');
    img.setAttribute('class', 'endpoint');
    img.src = './images/' + institution + ".png";
    img.setAttribute('alt', description);

    const label = document.createElement('div');
    label.innerHTML = description;
    label.setAttribute('class', 'endpoint_label');
/*
    const destination_radio = document.createElement('input');
    destination_radio.setAttribute('class', 'destination_radio');
    destination_radio.setAttribute('type', 'radio');
    destination_radio.setAttribute('name', 'destination');
    destination_radio.setAttribute('value', institution);
    destination_radio.addEventListener('input', updateDestination);
*/
    // Create some CSS to apply to the shadow dom
    const style = document.createElement('style');

    style.textContent = `
    .endpoint2 {
      width: 200px;
      height: 120px;
    }
    .source_radio2 {
      transform: translate(14px, -50px) scale(4);
    }
    .destination_radio2 {
      transform: translate(-14px, -50px) scale(4);
    }
  //  .wrapper {
  //    }
    `;

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


function generateEndpoints() {
  let endpoint_map = {
    ubs_visa_debit: "UBS Visa (debit)",
    bofa_visa: "Bank of America Visa",
    ubs_twint: "UBS Twint",
    cash: "cash",
    ayelet_twint: "Ayelet Twint",
    editte_twint: "Editte Twint",
    migros: "Migros",
    coop: "Coop:",
    lidl: "Lidl",
  };

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

window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }

  customElements.define("sd-endpoint", Endpoint);

  window.onscroll = noScroll;

  generateEndpoints();

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
  document.querySelector("#what").addEventListener('keydown', keydown);

/*
  const height = window.visualViewport.height;
const viewport = window.visualViewport;

window.addEventListener("scroll", () => input.blur());
window.visualViewport.addEventListener("resize", resizeHandler);

function resizeHandler() {
//    if (!/iPhone|iPad|iPod/.test(window.navigator.userAgent)) {
//      height = viewport.height;
//    }
    button.style.bottom = `${height - viewport.height + 10}px`;
  }

*/
}
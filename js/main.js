

function selectItem(item) {
  item.classList.add('selected');
}

function postSend() {
  document.querySelector("#amount").value = "";
  document.querySelector("#notes").value = "";
  document.querySelector("#what").value = "";
  return true;
}

function ready() {
  console.log("ready");
  let body = {
    source: "",
    destination: "",
    amount: "",
    currency: "",
    what: "",
    notes: "",
  }
  
  // TODO: surround each endpoint with some data for the human-friendly version.
  source_element = document.querySelector('input[name="source"]:checked');
  if (source_element.value == "other1") {
    source_element = document.querySelector("#other_endpoint1");
  }
  if (source_element.value == "other2") {
    source_element = document.querySelector("#other_endpoint2");
  }
  body.source = source_element.value;
  document.querySelector('#from_helper').innerHTML = body.source;

  destination_element = document.querySelector('input[name="destination"]:checked');
  if (destination_element.value == "other1") {
    destination_element = document.querySelector("#other_endpoint1");
  }
  if (destination_element.value == "other2") {
    destination_element = document.querySelector("#other_endpoint2");
  }
  body.destination = destination_element.value;
  document.querySelector('#to_helper').innerHTML = body.destination;

  body.currency = document.querySelector('input[name="currency"]:checked').value;
  if (body.currency == "other") {
    body.currency = document.querySelector("#other_currency").value;
  }
  body.amount = document.querySelector("#amount").value;
  body.notes = document.querySelector("#notes").value;
  body.what = document.querySelector("#what").value;
  
  subject = body.source + " > " + body.amount + " (" + body.what + ") > " + body.destination;

  let body_json = JSON.stringify(body);
  var finalValues = [
    'mailto:anerbenartzi+email2sheet@gmail.com?subject=' + encodeURIComponent(subject),
    'cc=' + encodeURIComponent('"16I2ldN2v_an0u5c09zYpr_bKAw0DBeTH53NRnxtvFkw" <anerbenartzi+email2sheet@gmail.com>'),
    'bcc=' + encodeURIComponent('"entries" <anerbenartzi+email2sheet@gmail.com>'),
    'body=' + encodeURIComponent(body_json),
  ];

  var sendItem = document.querySelector("#send-email");
  sendItem.href = finalValues.join('&');  
  sendItem.style.color = "black";
}


class Endpoint extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();

    // Create a shadow root
    const shadow = this.attachShadow({mode: 'open'});

    // Create spans
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper');

    const institution = this.getAttribute('institution');

    const source_radio = document.createElement('input');
    source_radio.setAttribute('class', 'source_radio2');
    source_radio.setAttribute('type', 'radio');
    source_radio.setAttribute('name', 'source');
    source_radio.setAttribute('value', institution);

    const img = document.createElement('img');
    img.setAttribute('class', 'endpoint2');
    img.src = './images/' + institution + ".png";
    img.setAttribute('alt', institution.toUpperCase());

    const destination_radio = document.createElement('input');
    destination_radio.setAttribute('class', 'destination_radio2');
    destination_radio.setAttribute('type', 'radio');
    destination_radio.setAttribute('name', 'destination');
    destination_radio.setAttribute('value', institution);


    const img = document.createElement('img');
    img.src = imgUrl;
    icon.appendChild(img);

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
    .wrapper {
      }
    `;

    // Attach the created elements to the shadow dom
    shadow.appendChild(style);
    shadow.appendChild(wrapper);
    wrapper.appendChild(source_radio);
    wrapper.appendChild(img);
    wrapper.appendChild(destination_radio);
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

window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }

  CustomElementRegistry.define("sd-endpoint", Endpoint);

  generateEndpoints();

  let input_elements = document.querySelectorAll('input')
  for (let input_element of input_elements) {
    input_element.addEventListener('input', ready);
  }
}
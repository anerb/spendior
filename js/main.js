window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
}

function selectItem(item) {
  item.classList.add('selected');
}

function ready() {
  var paymentMethod = "NA";
  var amount = 0;
  var currency = "NA";
  var vendor = "NA";
  var notes = "NA";
  
  var paymentMethodItem = document.querySelector(".payment-method.selected");
  if (paymentMethodItem !== null) {
    paymentMethod = paymentMethodItem.id;
  }
  
  var amountItem = document.querySelector("#amount");
  amount = amountItem.value;
  
  var currencyItem = document.querySelector(".currency.selected");
  currency = currencyItem.innerHTML;
  
  var vendorItem = document.querySelector(".vendor.selected");
  if (vendorItem === null) {
    vendorItem = document.querySelector("#vendor-other");
    vendor = vendorItem.value;
  } else {
    vendor = vendorItem.id;
  }
  notesItem = document.querySelector("#notes");
  notes = notesItem.value;
  
  var sendItem = document.querySelector("#send-email");
  
  var finalValue = "mailto:anerbenartzi+spend@gmail.com?subject=" + vendor + " " + amount + " " + currency + "&body=" + paymentMethod + ":" + notes;
  
  sendItem.href = finalValue;
  sendItem.style.display = "inline"
}

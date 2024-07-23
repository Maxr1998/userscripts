// ==UserScript==
// @name         Google Play Console Helpers
// @namespace    https://github.com/Maxr1998/userscripts
// @supportURL   https://github.com/Maxr1998/userscripts/issues
// @downloadURL  https://github.com/Maxr1998/userscripts/raw/master/google_play_console_helpers.user.js
// @version      2024-06-07
// @description  try to take over the world!
// @author       Maxr1998
// @match        https://play.google.com/console/u/0/developers/*/orders*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const fetchOrdersRequestRegex = /v1\/developer\/\d*\/orders:fetch/i;

    XMLHttpRequest.prototype.nativeSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        this.addEventListener('loadend', function () {
            if (this.responseURL.match(fetchOrdersRequestRegex)) {
                try {
                    const responseJson = JSON.parse(this.responseText);
                    handleOrdersResponse(responseJson);
                } catch (err) {
                    console.log(err);
                }
            }
        }, false);
        this.nativeSend.apply(this, arguments);
    };

    function findOrdersFilterBlock() {
        const elements = document.getElementsByTagName("orders-filter");
        return elements.length === 1 ? elements[0] : null;
    }

    function handleOrdersResponse(response) {
        if (!1 in response) {
            return;
        }

        const rawOrders = response[1];
        const ordersMap = new Map();

        rawOrders.forEach((order) => {
            // These numbers are object keys, not array indices!
            const purchaseToken = order[2];
            const orderId = order[1];
            if (!ordersMap.has(purchaseToken)) {
                ordersMap.set(purchaseToken, orderId);
            }
        });

        const orders = Array.from(ordersMap.entries().map((order) => {
            return {"purchaseToken": order[0], "orderId": order[1]};
        }));

        const ordersFilterBlock = findOrdersFilterBlock();
        if (ordersFilterBlock === )
    }
})();
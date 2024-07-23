// ==UserScript==
// @name         Google Play Console Helpers
// @namespace    https://github.com/Maxr1998/userscripts
// @supportURL   https://github.com/Maxr1998/userscripts/issues
// @downloadURL  https://github.com/Maxr1998/userscripts/raw/master/google_play_console_helpers.user.js
// @updateURL    https://github.com/Maxr1998/userscripts/raw/master/google_play_console_helpers.user.js
// @version      2024-06-07
// @description  Extract useful data from the Google Play Console more quickly
// @author       Maxr1998
// @match        https://play.google.com/console/u/0/developers*
// @grant        window.onurlchange
// ==/UserScript==

(function () {
    'use strict';

    const ordersPageUrlRegex = /https:\/\/play.google.com\/console\/u\/0\/developers\/\d+\/orders\/GPA\.\d{4}-\d{4}-\d{4}-\d{5}(..\d)?/ig;
    const fetchUserOrdersRequestRegex = /v1\/developer\/\d*\/orders:fetchUserLatestOrders?/i;

    XMLHttpRequest.prototype.nativeSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        this.addEventListener("loadend", function () {
            if (this.responseURL.match(fetchUserOrdersRequestRegex)) {
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

    addEventListener("urlchange", event => {
        if (event.url.matchAll(ordersPageUrlRegex)) {
            injectCopyAllOrdersButton();
        }
    });

    function injectCopyAllOrdersButton() {
        let copyAllOrdersButton = document.querySelector("button[debug-id='copy-all-orders-button']");
        if (copyAllOrdersButton) {
            return copyAllOrdersButton;
        }

        const copyPurchaseTokenButton = document.querySelector("button[debug-id='copy-purchase-token-button']");
        if (!copyPurchaseTokenButton) {
            return null;
        }

        const container = copyPurchaseTokenButton.parentNode;
        if (!container) {
            return null;
        }

        const newContainer = container.cloneNode();
        container.parentNode.append(newContainer);

        copyAllOrdersButton = copyPurchaseTokenButton.cloneNode(true);
        copyAllOrdersButton.querySelector("span").innerText = "Copy all orders";
        copyAllOrdersButton.setAttribute("debug-id", "copy-all-orders-button");
        copyAllOrdersButton.setAttribute("disabled", "");
        newContainer.append(copyAllOrdersButton);

        return copyAllOrdersButton;
    }

    function handleOrdersResponse(response) {
        if (!1 in response) {
            return;
        }

        const rawOrders = response[1];
        if (!Array.isArray(rawOrders)) {
            return;
        }

        const ordersMap = new Map();

        rawOrders.forEach((order) => {
            // These numbers are object keys, not array indices!
            const purchaseToken = order[2];
            const orderId = order[1];
            if (purchaseToken && !ordersMap.has(purchaseToken)) {
                ordersMap.set(purchaseToken, orderId);
            }
        });

        const orders = Array.from(ordersMap.entries().map((order) => {
            return {"purchaseToken": order[0], "orderId": order[1]};
        }));

        const copyAllOrdersButton = injectCopyAllOrdersButton();

        copyAllOrdersButton.addEventListener("click", (e) => {
            navigator.clipboard.writeText(JSON.stringify(orders));
        });

        copyAllOrdersButton.removeAttribute("disabled");
    }
})();
// ==UserScript==
// @name         HelpScout Click2Copy
// @namespace    https://github.com/Maxr1998/userscripts
// @supportURL   https://github.com/Maxr1998/userscripts/issues
// @downloadURL  https://github.com/Maxr1998/userscripts/raw/master/helpscout_click_to_copy.user.js
// @version      2024-01-28
// @description  Allows to quickly copy UUIDs and Google Play order IDs in HelpScout messages.
// @author       Maxr1998
// @icon         https://www.google.com/s2/favicons?domain=helpscout.net&sz=256
// @match        https://secure.helpscout.net/conversation/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // RegExp for a single quoted UUIDv4
    const uuidRegex = /'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'/ig;

    // RegExp for a Google Play order ID
    const orderIdRegex = /(GPA\.\d{4}-\d{4}-\d{4}-\d{5})(?:\.\.\d+)?/g;

    const replacement = '<code><span class="copyable" style="cursor: copy;">$1</span></code>';

    $(window).on("load", function () {
        $('section.messageBody').each(function (_) {
            const $el = $(this);
            let content = $el.html();
            content = content.replaceAll(uuidRegex, replacement);
            content = content.replaceAll(orderIdRegex, replacement);
            $el.html(content);
        });

        $('span.copyable').click(function () {
            navigator.clipboard.writeText($(this).text());
        });
    });
})();
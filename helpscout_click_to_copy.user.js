// ==UserScript==
// @name         HelpScout Click2Copy
// @namespace    https://github.com/Maxr1998/userscripts
// @supportURL   https://github.com/Maxr1998/userscripts/issues
// @downloadURL  https://github.com/Maxr1998/userscripts/raw/master/helpscout_click_to_copy.user.js
// @version      2024-01-30_1
// @description  Allows to quickly copy UUIDs and Google Play order IDs in HelpScout messages.
// @author       Maxr1998
// @icon         https://www.google.com/s2/favicons?domain=helpscout.net&sz=256
// @match        https://secure.helpscout.net/mailbox/*
// @match        https://secure.helpscout.net/conversation/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // RegExp for a single quoted UUIDv4
    const uuidRegex = /'?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'?/ig;

    // RegExp for a Google Play order ID
    const orderIdRegex = /(GPA\.\d{4}-\d{4}-\d{4}-\d{5})(?:\.\.\d+)?/g;

    const devIdStorageKey = 'GOOGLE_PLAY_DEVELOPER_ID';

    // Query order ID
    let developerId = localStorage.getItem(devIdStorageKey);
    if (developerId === null) {
        do {
            developerId = window.prompt('Please enter your Google Play developer ID.');
        } while (!(developerId !== null && /^\d+$/.test(developerId)));

        localStorage.setItem(devIdStorageKey, developerId);
    }

    // Generic HTML replacement string for copyable elements
    const copySpanReplacement = '<code><span class="copyable" style="cursor: copy;">$1</span></code>';

    // HTML replacement for Google Play Console links to specific orders
    const orderLinkReplacement = ' <sup>[<a ' +
        'title="View order on Google Play Developer Console" ' +
        `href="https://play.google.com/console/u/0/developers/${developerId}/orders/$1" ` +
        'target="_blank">view</a>' +
        ']</sup>';

    // Mutation observers to detect dynamic page changes
    const messageContentObserver = new MutationObserver(onMessagesUpdated);
    const pageContentObserver = new MutationObserver(onPageChanged);

    function onMessagesUpdated() {
        $('section.messageBody:not(.messageProcessed)').each(function (_) {
            const $el = $(this);

            // Make UUIDs and order numbers copyable
            let content = $el.html();
            content = content.replaceAll(uuidRegex, copySpanReplacement);
            content = content.replaceAll(orderIdRegex, copySpanReplacement + orderLinkReplacement);
            $el.html(content);

            // Ensure messages aren't processed more than once
            $el.addClass('messageProcessed');
        });

        $('span.copyable').click(function () {
            navigator.clipboard.writeText($(this).text());
        });
    }

    function onPageChanged() {
        // Initial content replacement
        onMessagesUpdated();

        // Use mutation observer handle messages loaded on demand
        const tkContent = document.getElementById('tkContent');
        if (tkContent) messageContentObserver.observe(tkContent, {
            childList: true,
        });
    }

    $(window).on("load", function () {
        // Initial page change
        onPageChanged();

        // Use mutation observer to detect page changes
        const jsWrap = document.getElementById('js-wrap');
        if (jsWrap) pageContentObserver.observe(jsWrap, {
            childList: true,
        });
    });
})();
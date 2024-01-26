// ==UserScript==
// @name         Qobuz Purchase List Extractor
// @namespace    https://github.com/Maxr1998/userscripts
// @supportURL   https://github.com/Maxr1998/userscripts/issues
// @downloadURL  https://github.com/Maxr1998/userscripts/raw/master/qobuz_extract_purchases.user.js
// @version      0.1.1
// @description  Extracts simple metadata about purchased albums from your Qobuz account.
// @author       Maxr1998
// @match        https://www.qobuz.com/profile/downloads*
// @grant        none
// ==/UserScript==
//
(function () {
    'use strict';

    const purchasePageHeaderQuery = '.account-purchases__header';
    const purchaseRowQuery = '.account-purchases__table-row';
    const albumTitleQueryNoLink = 'span.account-purchases__album-title';
    const albumTitleQuery = `${albumTitleQueryNoLink} > a`;
    const trackFavoritesQuery = 'a.account-purchases__track--favorites';
    const artistQuery = 'span.account-purchases__album-artist > a';
    const paginatorQuery = '.account-purchases__pagination.store-paginator';
    const paginatorNextButtonQuery = 'a.store-paginator__button[rel="next"]';

    const $extractPurchasesButton = $('<button>', {
        text: 'Extract purchases',
        id: 'extract-purchases',
        click: extractAllPurchases,
    });

    const $resultModal = $(`
        <div class="modal" id="modalPurchases" tabindex="-1" role="dialog" style="display: none; height: 95%;">
            <div class="modal__wrapper">
                <span class="modal__close pct-close" data-dismiss="modal"></span>
                <div class="modal__content">
                    <button id="copy-purchases">Copy</button>
                    <p>
                        <code style="white-space: pre;"></code>
                    </p>
                </div>
            </div>
        </div>
    `);

    async function extractAllPurchases() {
        console.log('Starting purchase extraction…');
        $extractPurchasesButton.hide();

        const albums = await getDownloads(
            (page) => `https://www.qobuz.com/profile/downloads?page=${page}`,
            processAlbumPurchaseRow
        );
        const tracks = await getDownloads(
            (page) => `https://www.qobuz.com/profile/downloads/track?page=${page}`,
            processTrackPurchaseRow
        );
        console.log('Finished extracting purchases.');
        $extractPurchasesButton.show();

        const results = {albums, tracks};
        const resultJson = JSON.stringify(results, null, 2);
        const $modalContent = $('.modal__content p code', $resultModal);
        const $modalCopyButton = $('#copy-purchases', $resultModal);

        $modalContent[0].innerText = resultJson;
        $modalCopyButton.click(() => {
            navigator.clipboard.writeText(resultJson);
        });
        $resultModal.modal();
    }

    async function getDownloads(urlProvider, rowExtractor) {
        const results = [];
        let hasNext = true;
        for (let page = 1; hasNext; page++) {
            const $pageContent = await loadPageContent(urlProvider(page));
            const purchases = $(purchaseRowQuery, $pageContent).map((idx, $el) => rowExtractor($el)).toArray();
            results.push(...purchases);

            const $paginator = $(paginatorQuery, $pageContent);
            hasNext = $(paginatorNextButtonQuery, $paginator).length > 0
        }
        return results;
    }

    function loadPageContent(url) {
        return new Promise((resolve, reject) => {
            $('<div>').load(url, function (_, textStatus, __) {
                if (textStatus !== 'error') {
                    resolve($(this));
                } else {
                    reject(new Error());
                }
            });
        });
    }

    function processAlbumPurchaseRow($purchaseRow) {
        const album = $(albumTitleQuery, $purchaseRow).attr('title') ??
            $(albumTitleQueryNoLink, $purchaseRow).text().trim();
        const artist = $(artistQuery, $purchaseRow).attr('title');
        let url = $(albumTitleQuery, $purchaseRow).attr('href');
        if (url && url.startsWith('/')) {
            url = `https://www.qobuz.com${url}`
        }
        return {album, artist, url};
    }

    function processTrackPurchaseRow($purchaseRow) {
        // Qobuz uses the album title row for the track title…
        const track = $(albumTitleQuery, $purchaseRow).attr('title') ??
            $(albumTitleQueryNoLink, $purchaseRow).text().trim();
        // The "track" contains the album title
        const album = $(trackFavoritesQuery, $purchaseRow).text().trim();
        const artist = $(artistQuery, $purchaseRow).attr('title');
        let url = $(trackFavoritesQuery, $purchaseRow).attr('href');
        if (url && url.startsWith('/')) {
            url = `https://www.qobuz.com${url}`
        }
        return {track, album, artist, url};
    }

    function insertPageElements() {
        const $pageHeader = $(purchasePageHeaderQuery);
        if ($pageHeader.length) {
            $pageHeader.append($extractPurchasesButton);
        }
        const $footer = $('footer');
        if ($footer.length) {
            $footer.append($resultModal);
        }
    }

    $(document).ready(insertPageElements);
})();
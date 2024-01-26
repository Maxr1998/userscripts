// ==UserScript==
// @name         Qobuz Purchase List Extractor
// @namespace    https://github.com/Maxr1998/userscripts
// @supportURL   https://github.com/Maxr1998/userscripts/issues
// @downloadURL  https://github.com/Maxr1998/userscripts/raw/master/qobuz_extract_purchases.user.js
// @version      0.1
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
    const albumTitleQueryNoLink = '.account-purchases__album-title';
    const albumTitleQuery = `${albumTitleQueryNoLink} > a`;
    const artistQuery = '.account-purchases__album-artist > a';
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

        const results = [];
        let hasNext = true;
        for (let page = 1; hasNext; page++) {
            const $pageContent = await getDownloadsPage(page);
            const purchases = extractPurchases($pageContent);
            results.push(...purchases);
            console.log(`Extracted page ${page}.`)

            const $paginator = $(paginatorQuery, $pageContent);
            hasNext = $(paginatorNextButtonQuery, $paginator).length > 0
        }
        console.log('Finished extracting purchases.');
        $extractPurchasesButton.show();

        const resultJson = JSON.stringify(results, null, 2);
        const $modalContent = $('.modal__content p code', $resultModal);
        const $modalCopyButton = $('#copy-purchases', $resultModal);

        $modalContent[0].innerText = resultJson;
        $modalCopyButton.click(function () {
            navigator.clipboard.writeText(resultJson);
        });
        $resultModal.modal();
    }

    function getDownloadsPage(page) {
        return new Promise((resolve, reject) => {
            $('<div>').load(`https://www.qobuz.com/profile/downloads?page=${page}`, function (_, textStatus, __) {
                if (textStatus !== 'error') {
                    resolve($(this));
                } else {
                    reject(new Error());
                }
            });
        });
    }

    function extractPurchases($downloadsPageContent) {
        return $(purchaseRowQuery, $downloadsPageContent).map(function (idx, $el) {
            const album = $(albumTitleQuery, $el).attr('title') ??
                $(albumTitleQueryNoLink, $el).text().trim();
            const artist = $(artistQuery, $el).attr('title');
            let url = $(albumTitleQuery, $el).attr('href');
            if (url && url.startsWith('/')) {
                url = `https://www.qobuz.com${url}`
            }
            return {album, artist, url};
        }).toArray();
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
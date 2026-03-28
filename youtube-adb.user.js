// ==UserScript==
// @name         youtube-adb
// @namespace    https://github.com/Hunter-Lam/youtube-adb
// @version      1.0
// @description  YouTube 去廣告
// @match        *://*.youtube.com/*
// @exclude      *://accounts.youtube.com/*
// @exclude      *://www.youtube.com/live_chat_replay*
// @grant        none
// @run-at       document-start
// @license      MIT
// @downloadURL  https://github.com/Hunter-Lam/youtube-adb/raw/main/youtube-adb.user.js
// @updateURL    https://github.com/Hunter-Lam/youtube-adb/raw/main/youtube-adb.user.js
// ==/UserScript==

(function () {
    'use strict';

    /* =========================
       1. UI 廣告隱藏（只處理靜態區塊）
    ========================== */
    const style = document.createElement('style');
    style.textContent = `
        #masthead-ad,
        ytd-display-ad-renderer,
        ytd-ad-slot-renderer,
        ytd-promoted-sparkles-web-renderer,
        .ytd-video-masthead-ad-v3-renderer,
        ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
        ad-slot-renderer,
        ytm-companion-ad-renderer {
            display: none !important;
        }
    `;
    document.documentElement.appendChild(style);

    /* =========================
       2. 廣告判斷（YouTube 唯一穩定標誌）
    ========================== */
    function isAdPlaying() {
        const player = document.getElementById('movie_player');
        if (!player) return false;
        return player.classList.contains('ad-showing');
    }

    /* =========================
       3. 核心：直接跳到影片結尾（只在廣告時）
    ========================== */
    function skipAd(video) {
        if (!video) return;

        // 可跳過按鈕
        const skipBtn = document.querySelector(
            '.ytp-ad-skip-button,' +
            '.ytp-ad-skip-button-modern,' +
            '.ytp-skip-ad-button'
        );

        if (skipBtn) {
            skipBtn.click();
            return;
        }

        // 不可跳過廣告
        if (isAdPlaying()) {
            video.currentTime = video.duration || 9999;
        }
    }

    /* =========================
       4. 綁定 video（只綁一次）
    ========================== */
    function hookVideo(video) {
        if (!video || video.dataset.adbHooked) return;
        video.dataset.adbHooked = '1';

        // 廣告出現時自動跳過
        const observer = new MutationObserver(() => {
            if (isAdPlaying()) {
                skipAd(video);
            }
        });

        observer.observe(document.getElementById('movie_player'), {
            attributes: true,
            attributeFilter: ['class']
        });

        // 廣告時間更新時再補跳一次（防止新機制）
        video.addEventListener('timeupdate', () => {
            if (isAdPlaying()) {
                video.currentTime = video.duration || 9999;
            }
        });
    }

    /* =========================
       5. 監聽 video 出現（支援 SPA）
    ========================== */
    function watchVideo() {
        const observer = new MutationObserver(() => {
            const video = document.querySelector('video.html5-main-video');
            if (video) hookVideo(video);
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    /* =========================
       6. 移除反廣告彈窗
    ========================== */
    function removePopup() {
        document.querySelectorAll('ytd-enforcement-message-view-model')
            .forEach(el => el.remove());

        document.querySelectorAll('tp-yt-iron-overlay-backdrop')
            .forEach(el => el.remove());

        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    }

    setInterval(removePopup, 1000);

    /* =========================
       7. 初始化
    ========================== */
    watchVideo();

})();

// ==UserScript==
// @name         YouTube Shorts Limiter
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Жёсткий и минималистичный блокировщик Shorts. Без кнопок сброса и активации. Мгновенный редирект при попытке зайти после исчерпания лимита.
// @author       Poeno
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const KEYS = {
        LIMIT: 'yt_shorts_limit_min',
        TIME_SPENT: 'yt_shorts_time_spent_sec',
        LAST_DATE: 'yt_shorts_last_date',
        LIMIT_REACHED: 'yt_shorts_limit_reached'
    };

    function getLimit() { return parseInt(localStorage.getItem(KEYS.LIMIT)) || 15; }
    function getTimeSpent() { return parseInt(localStorage.getItem(KEYS.TIME_SPENT)) || 0; }
    function isLimitReached() { return localStorage.getItem(KEYS.LIMIT_REACHED) === 'true'; }

    function setLimit(val) { localStorage.setItem(KEYS.LIMIT, val); }
    function setTimeSpent(val) { localStorage.setItem(KEYS.TIME_SPENT, val); }
    function setLimitReached(val) { localStorage.setItem(KEYS.LIMIT_REACHED, val); }

    function checkDailyReset() {
        const today = new Date().toDateString();
        if (localStorage.getItem(KEYS.LAST_DATE) !== today) {
            setTimeSpent(0);
            setLimitReached(false);
            localStorage.setItem(KEYS.LAST_DATE, today);
        }
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function createUI() {
        if (document.getElementById('yt-shorts-limiter-ui')) {
            return document.getElementById('yt-shorts-limiter-ui');
        }

        const ui = document.createElement('div');
        ui.id = 'yt-shorts-limiter-ui';
        // Минималистичный, тёмный, неброский стиль
        ui.style.cssText = `
            all: initial;
            position: fixed; top: 60px; right: 16px; z-index: 2147483647;
            background: rgba(30, 30, 30, 0.9); color: #b0b0b0;
            border: 1px solid #444; border-radius: 6px;
            font-family: Roboto, Arial, sans-serif; font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5); min-width: 180px;
            backdrop-filter: blur(4px);
        `;

        const header = document.createElement('div');
        header.style.cssText = 'padding: 8px 10px; cursor: pointer; font-weight: 500; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; color: #e0e0e0;';

        const headerText = document.createElement('span');
        headerText.textContent = 'Shorts Limiter';

        const icon = document.createElement('span');
        icon.textContent = '−';

        header.appendChild(headerText);
        header.appendChild(icon);
        ui.appendChild(header);

        const content = document.createElement('div');
        content.style.cssText = 'padding: 10px; display: block;';

        if (isLimitReached()) {
            const lockedMsg = document.createElement('div');
            lockedMsg.style.cssText = 'color: #ff8a80; font-weight: 500; text-align: center; padding: 8px 0;';
            lockedMsg.textContent = 'Лимит исчерпан. Возврат в 00:00.';
            content.appendChild(lockedMsg);

            const hint = document.createElement('div');
            hint.style.cssText = 'font-size: 11px; color: #666; text-align: center; margin-top: 4px;';
            content.appendChild(hint);
        } else {
            const limitRow = document.createElement('div');
            limitRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;';

            const limitLabel = document.createElement('span');
            limitLabel.textContent = 'Лимит (мин):';

            const limitInput = document.createElement('input');
            limitInput.type = 'number';
            limitInput.value = getLimit();
            limitInput.min = '1';
            limitInput.max = '120';
            limitInput.style.cssText = 'width: 50px; background: #222; color: #e0e0e0; border: 1px solid #555; border-radius: 4px; padding: 3px; text-align: center; font-size: 12px;';

            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'OK';
            saveBtn.style.cssText = 'background: #444; color: #e0e0e0; border: 1px solid #555; border-radius: 4px; padding: 3px 8px; cursor: pointer; font-size: 11px; margin-left: 6px;';
            saveBtn.onclick = () => {
                const val = parseInt(limitInput.value);
                if (val > 0) {
                    setLimit(val);
                    updateTimeDisplay();
                }
            };

            limitRow.appendChild(limitLabel);

            const inputWrap = document.createElement('div');
            inputWrap.appendChild(limitInput);
            inputWrap.appendChild(saveBtn);
            limitRow.appendChild(inputWrap);
            content.appendChild(limitRow);

            const timeRow = document.createElement('div');
            timeRow.style.cssText = 'text-align: center; color: #e0e0e0; font-size: 13px; padding: 6px 0; border-top: 1px solid #444;';

            const timeBold = document.createElement('b');
            timeBold.id = 'yt-shorts-time-display';
            timeBold.style.color = '#81c784';
            timeBold.textContent = formatTime(getTimeSpent());

            timeRow.appendChild(document.createTextNode('Потрачено: '));
            timeRow.appendChild(timeBold);
            timeRow.appendChild(document.createTextNode(` / ${getLimit()} мин`));
            content.appendChild(timeRow);
        }

        ui.appendChild(content);
        document.body.appendChild(ui);

        header.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            icon.textContent = isHidden ? '−' : '+';
        });
    }

    function updateTimeDisplay() {
        const el = document.getElementById('yt-shorts-time-display');
        if (el) el.textContent = formatTime(getTimeSpent());
    }


    function hideShortsElements() {
        document.querySelectorAll('ytd-guide-entry-renderer').forEach(el => {
            if (el.querySelector('#label')?.textContent?.trim() === 'Shorts') el.style.display = 'none !important';
        });
        document.querySelectorAll('ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer').forEach(el => {
            el.style.display = 'none !important';
        });
        document.querySelectorAll('ytd-video-renderer[is-shorts]').forEach(el => {
            el.style.display = 'none !important';
        });
    }


    function enforceBlock() {
        if (isLimitReached() && location.pathname.startsWith('/shorts')) {
            window.location.replace('/');
        }
    }

    function startTracking() {
        checkDailyReset();
        createUI();
        hideShortsElements();
        enforceBlock();

        const domObserver = new MutationObserver(() => {
            hideShortsElements();
            if (!document.getElementById('yt-shorts-limiter-ui')) createUI();
        });
        domObserver.observe(document.body, { childList: true, subtree: true });

        setInterval(() => {
            enforceBlock();

            if (location.pathname.startsWith('/shorts') && !isLimitReached()) {
                let currentTime = getTimeSpent() + 1;
                setTimeSpent(currentTime);
                updateTimeDisplay();

                if (currentTime >= (getLimit() * 60)) {
                    setLimitReached(true);
                    window.location.replace('/');
                }
            }
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startTracking);
    } else {
        startTracking();
    }

})();
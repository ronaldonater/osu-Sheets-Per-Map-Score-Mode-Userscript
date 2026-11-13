// ==UserScript==
// @name         osu! Sheets - Per-map Score Modes
// @namespace    damian.osusheets.map-modes
// @version      1.0.1
// @description  Click the per-map header to cycle score and roster modes.
// @match        https://osusheets.com/*
// @match        https://www.osusheets.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  const KEY = 'osuSheets.perMapMode.v1';
  const modes = [
    'Per-Map Averages',
    'Per-Map Tops',
    'Main Roster Per-Map Averages',
    'Main Roster Per-Map Tops'
  ];

  let mode = 0;

  try {
    mode = Number(localStorage.getItem(KEY)) || 0;
  } catch {}

  if (!Number.isInteger(mode) || mode < 0 || mode > 3) {
    mode = 0;
  }

  const children = el => el ? [...el.children] : [];

  const heading = (root, text) =>
    [...root.querySelectorAll('h1')].find(
      el => el.textContent.trim() === text
    );

  function avatarID(img) {
    if (!img) return null;

    const match = (img.getAttribute('src') || '')
      .split('?')[0]
      .match(/\/(\d+)(?:\.[a-z]+)?\/?$/i);

    return match ? match[1] : null;
  }

  function score(cell, label) {
    const span = [...cell.querySelectorAll('span')].find(
      el => el.textContent.trim() === label
    );

    const raw = span?.previousElementSibling?.textContent
      .trim()
      .replace(/,/g, '');

    return raw && /^\d+(?:\.\d+)?$/.test(raw)
      ? Number(raw)
      : null;
  }

  function scoreColor(value) {
    if (value === null) return '#7594A3';
    if (value >= 850000) return '#60A5FF'; // Blue
    if (value >= 650000) return '#43CF3C'; // Green
    if (value >= 450000) return '#FFD258'; // Yellow
    if (value >= 250000) return '#FF9F43'; // Orange
    return '#FF4040';                     // Red
  }

  const style = document.createElement('style');

  style.textContent = `
    .osm-mode-button {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      border-radius: inherit;
      background: #0e1316;
      color: #fff;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      padding: 4px;
      white-space: normal;
      line-height: 1.25;
    }

    .osm-mode-button:hover {
      background: #243842;
    }

    .osm-mode-button:focus-visible {
      outline: 2px solid #28a8df;
      outline-offset: -2px;
    }

    .osm-active {
      position: relative;
    }

    .osm-active > :not(.osm-value) {
      visibility: hidden;
    }

    .osm-value {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      pointer-events: none;
    }

    .osm-value > span {
      width: 100%;
      border-radius: 4px;
      background: #212c32;
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      line-height: 14px;
    }
  `;

  document.head.append(style);

  let timer;

  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(render, 80);
  });

  function observe() {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['src', 'alt', 'title']
    });
  }

  function render() {
    observer.disconnect();

    try {
      const headers = [...document.querySelectorAll('h1')].filter(
        el =>
          el.dataset.osmHeader === '1' ||
          el.textContent.trim().toLowerCase() === 'per-map averages'
      );

      for (const header of headers) {
        const column = header.parentElement;
        const group = column.parentElement;
        const scoresHeading = heading(group, 'Scores');

        if (!scoresHeading) continue;

        const scoresColumn =
          scoresHeading.parentElement.parentElement;

        const playerHeaders = children(
          scoresHeading.parentElement.children[1]
        );

        const players = playerHeaders.map(el => ({
          id: avatarID(el.querySelector('img')),
          name: el.firstElementChild?.textContent.trim() || 'Player'
        }));

        const scoreRows = children(scoresColumn.children[1]);

        const rosterHeading = heading(group, 'Roster');
        const rosterColumn =
          rosterHeading?.parentElement.parentElement;

        const rosterLabels = children(
          rosterHeading?.parentElement.children[1]
        );

        const mainIndex = rosterLabels.findIndex(
          el => el.textContent.trim() === 'Main'
        );

        const mainRows = children(
          rosterColumn?.children[1]?.children[mainIndex]
        );

        const rows = children(column.children[1]);

        header.dataset.osmHeader = '1';

        let button = header.querySelector('.osm-mode-button');

        if (!button) {
          button = document.createElement('button');
          button.type = 'button';
          button.className = 'osm-mode-button';

          button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            mode = (mode + (event.shiftKey ? 3 : 1)) % 4;

            try {
              localStorage.setItem(KEY, String(mode));
            } catch {}

            render();
          });

          header.append(button);
        }

        button.textContent = modes[mode];

        button.title =
          `${modes[mode]}\n` +
          'Click: next mode. Shift+click: previous mode.\n' +
          'Blank scores are excluded; real zero scores count.\n' +
          'Hover a result for details.';

        button.setAttribute('aria-label', button.title);

        rows.forEach((row, index) => {
          row.querySelector('.osm-value')?.remove();
          row.classList.remove('osm-active');

          // Keep the site's original calculation and colors in default mode.
          if (mode === 0) return;

          const cells = children(scoreRows[index]);

          const mainIDs = new Set(
            [...(mainRows[index]?.querySelectorAll('img') || [])]
              .map(avatarID)
              .filter(Boolean)
          );

          const mainOnly = mode >= 2;
          const label = mode === 1 || mode === 3 ? 'best' : 'avg.';

          const missingStructure =
            cells.length !== players.length ||
            !players.length ||
            (
              mainOnly &&
              (
                !mainRows[index] ||
                players.some(player => !player.id)
              )
            );

          const included = missingStructure
            ? []
            : cells.flatMap((cell, i) => {
                if (mainOnly && !mainIDs.has(players[i].id)) {
                  return [];
                }

                const value = score(cell, label);

                return value === null
                  ? []
                  : [{ name: players[i].name, value }];
              });

          const mean = included.length
            ? included.reduce((sum, player) => sum + player.value, 0) /
              included.length
            : null;

          const overlay = document.createElement('div');
          overlay.className = 'osm-value';

          const pill = document.createElement('span');

          pill.textContent =
            mean === null ? '—' : `${Math.round(mean / 1000)}k`;

          // Apply thresholds to the exact average before rounding.
          pill.style.color = scoreColor(mean);

          overlay.append(pill);
          row.classList.add('osm-active');
          row.append(overlay);

          if (missingStructure) {
            row.title = 'Cannot match the score/roster layout safely.';
          } else if (mean === null) {
            row.title = 'No eligible recorded scores for this map.';
          } else {
            row.title =
              `${modes[mode]}: ` +
              mean.toLocaleString(undefined, {
                maximumFractionDigits: 2
              }) +
              `\n${included.length} recorded score(s)\n` +
              included
                .map(player =>
                  `${player.name}: ${player.value.toLocaleString()}`
                )
                .join('\n');
          }

          row.dataset.osmCustomTitle = '1';
        });

        if (mode === 0) {
          rows.forEach(row => {
            if (row.dataset.osmCustomTitle) {
              row.removeAttribute('title');
              delete row.dataset.osmCustomTitle;
            }
          });
        }
      }
    } catch (error) {
      console.warn('[osu! Sheets map modes]', error);
    } finally {
      observe();
    }
  }

  render();
})();
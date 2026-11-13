# osu! Sheets - Per-Map Score Modes Userscript

A Tampermonkey userscript for [osu! Sheets](https://osusheets.com/) that lets you switch the **Per-map averages** column between four score summaries by clicking its header.

Compare everyone's average scores, everyone's personal bests, or only the players assigned to **Main** for each map.

## Features

- Four display modes, accessible from the existing column header.
- Per-map Main roster filtering using player avatar IDs.
- Score colors based on the exact calculated average.
- Hover details showing the exact average, included players, and their scores.
- Automatic recalculation when score or roster elements change.
- Remembered mode selection in your browser.
- Local display changes only: no score submissions, roster edits, or additional network requests.

## Installation

1. Install the Tampermonkey browser extension.
2. Open Tampermonkey and select **Create a new script**.
3. Copy the contents of `osusheets-map-modes.user.js` from this repository.
4. Replace the starter code in the editor, then save.
5. Open or refresh your team sheet on osu! Sheets.

The userscript runs on `https://osusheets.com/*` and `https://www.osusheets.com/*`.

## Usage

Click the **Per-map averages** header to cycle through the modes below. **Shift + click** cycles backward.

| Mode | Scores used | Players included |
| --- | --- | --- |
| Per-Map Averages | The site's original average calculation | The site's default player selection |
| Per-Map Tops | Each player's **best** score | All players with a recorded best score |
| Main Roster Per-Map Averages | Each player's **avg.** score | Players assigned to **Main** for that map |
| Main Roster Per-Map Tops | Each player's **best** score | Players assigned to **Main** for that map |

Your selection is saved automatically in browser local storage and reused across sheets on the same origin.

Hover over a calculated result to see its exact value, the number of included scores, and a breakdown by player.

## How calculations work

The three added modes calculate an arithmetic mean of the eligible player scores:

```text
Per-map result = sum of eligible player scores / number of eligible scores
```

- **Tops** means the average of each eligible player's personal best. It does not select just the highest-scoring players.
- **Main** eligibility is determined separately for each map from its Main roster column. Players listed only under Sub are excluded.
- Missing scores are excluded instead of treated as zero. Recorded zero scores count.
- Each included player has equal weight. A player's displayed average is not weighted by their number of attempts.
- Results are displayed in rounded thousands, such as `674k`. Hover details show the more precise result.
- A dash (`—`) indicates no eligible recorded scores or a layout the script cannot safely match. The tooltip explains which applies.
- The default mode preserves the site's original calculation and colors.

### Example

| Player | Average | Best | Roster for this map |
| --- | ---: | ---: | --- |
| Player A | 600,000 | 800,000 | Main |
| Player B | 700,000 | 900,000 | Main |
| Player C | 500,000 | 700,000 | Sub |

The added modes produce:

| Mode | Result |
| --- | ---: |
| Per-Map Tops | 800,000 |
| Main Roster Per-Map Averages | 650,000 |
| Main Roster Per-Map Tops | 850,000 |

## Score colors

The added modes use these thresholds:

| Exact average | Color | Hex |
| --- | --- | --- |
| 850,000 and above | Blue | `#60A5FF` |
| 650,000 to below 850,000 | Green | `#43CF3C` |
| 450,000 to below 650,000 | Yellow | `#FFD258` |
| 250,000 to below 450,000 | Orange | `#FF9F43` |
| Below 250,000 | Red | `#FF4040` |
| No eligible score | Muted gray | `#7594A3` |

Colors use the exact result before rounding. For example, an average of 849,600 displays as `850k` but remains green.

To customize the thresholds or colors, edit the `scoreColor()` function in the userscript.

## Privacy and permissions

The script reads the scores and roster information already rendered on the page. It stores only the selected display mode in local storage and makes no additional network requests.

It uses `@grant none` and does not modify the sheet's stored scores or roster assignments.

## Compatibility and troubleshooting

The script targets the osu! Sheets team layout with **Scores**, **best**, **avg.**, **Roster**, **Main**, and **Per-map averages** labels. Changes to the site's layout, labels, or avatar URL format may require an update.

If the toggle does not appear:

1. Confirm the script is enabled in Tampermonkey.
2. Confirm your browser allows Tampermonkey to run userscripts on the site.
3. Refresh the page and open the team scores view.

If a Main roster mode displays `—`, check that the map has Main assignments and that those players have recorded scores. Hover over the result to check for a layout-matching warning.

For debugging, check your browser console for messages beginning with `[osu! Sheets map modes]`.

## Disclaimer

This is an unofficial community userscript and is not affiliated with osu! or osu! Sheets.

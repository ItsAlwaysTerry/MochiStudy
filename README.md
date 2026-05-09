# MochiStudy

MochiStudy is a local-first study tracker for high-school learning. It helps students record practice, keep focus sessions, review learning archives, unlock achievements, and grow a small subject-based farm.

## Features

- Study record import with subject, knowledge point, question count, stars, pain point, and routine
- Focus timer with free focus and timed focus modes
- Rest reminder overlay with selectable Web Audio reminder sounds
- Learning archive organized by subject and knowledge point
- Achievement system based on study records, focus logs, and farm progress
- Three-subject farm driven by imported study records
- Local data backup and restore
- Debug/config panel available with `index.html?debug=1`

## Tech Stack

- Native HTML, CSS, and JavaScript
- Browser `localStorage` for all data
- No backend service required

## Run Locally

Open `index.html` directly in a browser.

For the debug panel, open:

```text
index.html?debug=1
```

## Data

All user data is stored locally in the browser. Important keys include:

- `study_log`
- `farm_state`
- `mochi_state`
- `focus_log`
- `school_holidays`
- `holiday_mode_override`
- `game_config`
- `sound_reminder_enabled`
- `focus_end_sound`
- `rest_reminder_sound`

Use the settings page to export or restore a backup JSON file.

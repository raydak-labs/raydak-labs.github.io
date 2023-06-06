# raydak Homepage

## Setup

1. Install nodejs and yarn
2. `yarn` to install the dependencies

## Usage

Run `yarn dev` to start a local live-reloading dev server running on http://localhost:1313.

After cloning the repo you might see a page that does not look right, in this case stop and execute the command above again.
Hugo generates a `hugo_stats.json` file for tailwind to generate the css classes, but as this file is missing after the initial clone it behaves incorrectly at least right now.
Subsequent changes to the code are correctly detected.

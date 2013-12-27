#!/bin/sh
browserify -r coax -r ./assets/data.js:syncState > ./assets/modules.js

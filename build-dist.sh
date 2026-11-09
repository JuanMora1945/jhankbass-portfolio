#!/bin/sh
# Copies only the files the site needs into dist/ (for Netlify Drop)
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp index.html styles.css main.js favicon.svg robots.txt sitemap.xml site.webmanifest netlify.toml dist/
cp -R img video dist/
du -sh dist

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/bootstrap-ruby.sh

# The platform's initial Ruby only starts the build; the site uses 4.0.8.
ruby -v
ruby -ropenssl -rpsych -e 'puts "OpenSSL and Psych loaded successfully"'
if ! gem list --local --installed bundler --version 4.0.20 >/dev/null; then
  gem install bundler --version 4.0.20 --no-document
fi
export BUNDLE_PATH="${K365_BUNDLE_PATH:-$PWD/node_modules/.cache/bundle}"
export BUNDLE_FROZEN=true
bundle _4.0.20_ install --jobs 2 --retry 3
bundle _4.0.20_ exec ruby scripts/generate.rb
JEKYLL_ENV=production bundle _4.0.20_ exec jekyll build --trace

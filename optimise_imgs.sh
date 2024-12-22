#!/bin/bash
set -uo pipefail

git ls-files '*.svg' | xargs -I '{}' svgo --multipass -i'{}'

git ls-files '*.png' | xargs oxipng -Zaso max

git ls-files '*.jpg' '*.jpeg' | xargs jpegoptim --strip-com -m85

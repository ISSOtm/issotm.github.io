#!/bin/bash
set -uo pipefail

git ls-files '*.svg' | xargs -I '{}' svgo --multipass -i'{}'

git ls-files '*.png' '*.jpg' | while read -r file; do
	orig=$(wc -c <"$file")
	if [[ "$file" = *.jpg ]]; then
		convert "$file" "${file%.jpg}.png"
	fi
	oxipng -Zaso max "${file%.*}.png"
	new=$(wc -c <"${file%.*}.png")
	printf '%s: %u → %u\n' "$file" "$orig" "$new"
	if [[ "$file" = *.jpg ]]; then
		if [[ "$new" -lt "$orig" ]]; then
			git rm "$file"
			git add "${file%.jpg}.png"
		else
			rm "${file%.jpg}.png"
		fi
	elif [[ "$new" -gt "$orig" ]]; then
		git restore "$file"
	fi
done

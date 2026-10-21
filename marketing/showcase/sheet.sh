#!/bin/sh
# usage: sheet.sh film t1,t2,...  -> out/stills/sheet-film.png
cd "$(dirname "$0")"
AT=$2 node render.mjs $1 --stills >/dev/null
ins=""; n=0
for t in $(echo $2 | tr , ' '); do ins="$ins -i out/stills/$1-$(printf %.1f $t).png"; n=$((n+1)); done
ffmpeg -v error -y $ins -filter_complex "hstack=inputs=$n,scale=2400:-1" out/stills/sheet-$1.png

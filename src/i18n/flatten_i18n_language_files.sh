#!/bin/bash

USAGE="Usage: $(basename $0) {en,de} GLOB_PATTERN\nUse GLOB_PATTERN=*.json to flatten all language files"

if [[ $# -ne 2 ]]; then
  echo -e "Invalid arguments. ${USAGE}"
  exit 1
fi

for jsonfile in $(find . -name $2); do
  cat $jsonfile | jq ".${1}" | jq --arg delim '.' 'reduce (tostream|select(length==2)) as $i ({};
      [$i[0][]|tostring] as $path_as_strings
          | ($path_as_strings|join($delim)) as $key
          | $i[1] as $value
          | .[$key] = $value
  )' | jq -r 'values[]'
done

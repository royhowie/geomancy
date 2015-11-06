#!/bin/bash
# taken from https://www.exratione.com/2014/09/nodejs-is-too-inefficient-to-monitor-files-so-use-bash-scripts-instead/

# directories to monitor
MONITOR=()
MONITOR+=( "./geomancy.es6.js")
MONITOR+=( "./index.jade")

# timestamp reference point
TIMESTAMP_FILE="/tmp/file-monitor-ts"

# interval in seconds between each check
INTERVAL_SECONDS=1
# seconds in the past to set the timestamp to on the reference file for comp
LOOKBACK_SECONDS=5

# so we don't update too often
LAST_UPDATES=""

while [[ true ]] ; do
  # OS X has a different date command than Linux does
  if [[ ${OSTYPE} =~ ^darwin ]]; then
    TIMESTAMP=`date +%s`
    TIMESTAMP=$(( ${TIMESTAMP} - ${LOOKBACK_SECONDS} ))
    TIMESTAMP=`date -r ${TIMESTAMP} +%m%d%H%M.%S`
  else
    TIMESTAMP=`date -d "-${LOOKBACK_SECONDS} sec" +%m%d%H%M.%S`
  fi

  # Create or update the reference timestamp file.
  touch -t ${TIMESTAMP} "${TIMESTAMP_FILE}"

  # Identify updates by comparison with the reference timestamp file.
  # find files to u
  UPDATES=`find ${MONITOR[*]} -type f -newer ${TIMESTAMP_FILE}`

  if [[ "${UPDATES}" ]] ; then
    # Pass the updates through ls or stat in order to add a timestamp for
    # each result. Thus if the same file is updated several times over several
    # monitor cycles it will still trigger when compared to the prior set of
    # updates.
    if [[ ${OSTYPE} =~ ^darwin ]]; then
      UPDATES=`stat -F ${UPDATES}`
    else
      UPDATES=`ls --full-time ${UPDATES}`
    fi

    # if there are new changes in this monitor cycle
    if [[ "${UPDATES}" != "${LAST_UPDATES}" ]] ; then # do the following
      echo -e 'compiling jade file to ./output/index.html'
      jade < index.jade > ./output/index.html
      
      echo -e 'compiling jade file to ./output/pretty.html'
      jade -P < index.jade > ./output/pretty.html

      node transform.js
    fi
  fi

  LAST_UPDATES="${UPDATES}"
  sleep ${INTERVAL_SECONDS}
done

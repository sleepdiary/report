#!/bin/sh

SLEEPDIARY_NAME=report

cmd_build() {
    if [ -n "$FORCE" ]
    then make -B build
    else make    build
    fi
}

cmd_test() {
    # this repository doesn't have any tests yet
    true
}

cmd_run() {
    find src/ -type f -print0 | \
        xargs -0 inotifywait -q -e CLOSE_WRITE -m | \
        while read REPLY
        do make build
        done
}

. /build-sleepdiary.sh "$@"

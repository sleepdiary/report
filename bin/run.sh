#!/bin/sh

set -e

if [ -e /opt/sleepdiary/utils.sh ]
then . /opt/sleepdiary/utils.sh
else printf '\033[1;31m/opt/sleepdiary/utils.sh not found - some checks bypassed.\033[0m\n'
fi

do_build() {

    echo

    if [ -n "$FORCE" ]
    then make -j -B build
    else make -j    build
    fi

}

checked_build() {

    set +e
    do_build
    case "$?" in
        0) printf '\033[1;32mSuccess!\033[0m\n' ;;
        1) printf '\033[1;33mNon-fatal errors occurred!\033[0m\n' ;;
        *) printf '\033[1;31mFailed!\033[0m\n' ;;
    esac
    set -e

}

case "$1" in

    build)
        do_build
        ;;

    test)
        generic_tests
        exit "$WARNED"
        ;;

    serve)
        DIRECTORIES=src
        checked_build
        inotifywait -r -q -e CLOSE_WRITE -m $DIRECTORIES | \
            while read REPLY
            do checked_build
            done
        ;;

    upgrade)
        npm upgrade
        rm -f yarn.lock
        yarn import
        ;;

    *)
        echo "Usage: $0 < build | test | serve | upgrade >"
        exit 2
        ;;

esac

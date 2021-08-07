#!/bin/sh

do_build() {

    echo

    if [ -n "$FORCE" ]
    then make -j -B build
    else make -j    build
    fi

}

if [ -e /opt/sleepdiary/utils.sh ]
then . /opt/sleepdiary/utils.sh
else printf '\033[1;31m/opt/sleepdiary/utils.sh not found - some checks bypassed.\033[0m\n'
fi

case "$1" in

    build)
        npm ci --silent
        do_build
        ;;

    test)
        generic_tests
        exit "$WARNED"
        ;;

    serve)
        DIRECTORIES=src
        do_build
        inotifywait -r -q -e CLOSE_WRITE -m $DIRECTORIES | \
            while read REPLY
            do
                do_build
                case "$?" in
                    0) printf '\033[1;32mSuccess!\033[0m\n' ;;
                    1) printf '\033[1;33mNon-fatal errors occurred!\033[0m\n' ;;
                    *) printf '\033[1;31mFailed!\033[0m\n' ;;
                esac
            done
        ;;

    *)
        exit 2
        ;;

esac

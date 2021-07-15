#!/bin/sh

if [ -z "$container" ]
then
    echo "Please run this inside a container"
    exit 2
fi

# Make sure everything is up-to-date and run the tests:
make -B
MAKE_RESULT="$?"

# fix permissions for any modified files, and check the make succeeded:
if [ "$MAKE_RESULT" != 0 ]
then
    echo
    echo "Please fix the above errors"
    exit "$MAKE_RESULT"
fi
echo

# Make sure we're going to push what we expected to:
git diff @{u}
echo
git log --oneline --graph @{u}...HEAD

echo
echo "Please review the above changes, then do: git push"

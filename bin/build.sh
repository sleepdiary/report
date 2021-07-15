#!/bin/sh
#
# Build the documentation
#
# Called from .github/workflows

set -v # verbose mode - print commands to stderr
set -e # exit if any of the commands below return non-zero

#
# Check if there's anything to do
#

if ! git rev-list HEAD..origin/main | grep -q .
then
    echo "'main' has already been merged - stopping"
    exit 0
fi

#
# Merge changes from main
#

git merge --strategy-option=theirs --no-edit origin/main

#
# Initialise the build environment
#

npm install -g jsdoc google-closure-compiler

git clone --depth 1 https://github.com/wolfcw/libfaketime.git /tmp/libfaketime
sed -i -e 's/\/usr\/local/\/tmp\/libfaketime/' /tmp/libfaketime/Makefile /tmp/libfaketime/*/Makefile
make -j -C /tmp/libfaketime/src
ln -s . /tmp/libfaketime/lib
ln -s src /tmp/libfaketime/faketime

#
# Run the build itself
#

make -B build

#
# Add/commit/push changes
#

git add .
if git diff --quiet HEAD
then echo "No changes to commit"
else git commit -a -m "Build updates from main branch"
fi
git push

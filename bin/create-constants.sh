#!/bin/sh
#
# Generate constants used by the sleep diary report
#
# Copyright (C) 2021 Sleepdiary Developers <sleepdiary@pileofstuff.org>
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; version 2
# of the License.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.


cat > constants.js <<EOF
const REPORT_VERSION = "$( sed -ne '$ s/[^0-9].*//p' version_history.txt )";
const SOFTWARE_VERSION = "$( git rev-parse --short HEAD )";
EOF

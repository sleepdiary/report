/**
 * @preserve
 * @brief Sleep Diary Report - summary of a sleep diary for use by doctors
 * @copyright (C) 2021 Sleepdiary Developers <sleepdiary@pileofstuff.org>
 *
 * @license
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2
 * of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

"use strict";


var diary_loader = new DiaryLoader(
        (diary,source) => {

            diary = diary.to("Standard");

            var timezone = source.timezone || "Etc/GMT",
                activities = diary.daily_activities(
                    timezone,
                    undefined,
                    undefined,
                    1000*60*60,
                ),
                recent_activities = activities.slice(Math.max(activities.length-14,0)),
                cutoff = recent_activities[0].start,
                report = sleepdiary_report({
                    pdf: new jspdf.jsPDF(),
                    timezone: timezone,
                    software_version: diary.software_version(),
                    recent: {
                        activities     : recent_activities,
                        schedule       : diary.summarise_schedule(                             r => r.start>=cutoff, undefined, timezone ),
                        summary_days   : diary.summarise_days    (                             r => r.start>=cutoff ),
                        summary_asleep : diary.summarise_records ( r => r.status=="asleep"     &&   r.start>=cutoff ),
                        sleeps_per_day : diary.total_per_day     ( r => r.status=="asleep"   , r => r.start>=cutoff ),
                        meds_per_day   : diary.total_per_day     ( r => r.status=="sleep aid", r => r.start>=cutoff ),
                    },
                    long_term: {
                        activities     : activities,
                        schedule       : diary.summarise_schedule( undefined, undefined, timezone),
                        summary_days   : diary.summarise_days    (),
                        summary_asleep : diary.summarise_records ( r => r.status == "asleep" ),
                        sleeps_per_day : diary.total_per_day     ( r => r.status == "asleep" ),
                        meds_per_day   : diary.total_per_day     ( r => r.status == "sleep aid" ),
                    },
                });

            var a = document.createElement("A");
            a.setAttribute( "download", report.filename );
            a.setAttribute(
                "href",
                report.pdf.output('datauristring', { filename: report.filename })
            );
            a.click();

        },
        (raw,source) => {
            alert("Sorry, we can't read diaries in this format.\nPlease try another file.");
        }
    );

document.getElementById("diary-input-link")
    .addEventListener( "click", () => document.getElementById("diary-input").click() );

document.getElementById("diary-input")
    .addEventListener( "change", event => diary_loader.load(event) );

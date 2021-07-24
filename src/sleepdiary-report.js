/*
 * @brief Sleep Diary Report - summary of a sleep diary for use by doctors
 *
 * Copyright (C) 2021 Andrew Sayers <sleepdiary@pileofstuff.org>
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

(
    ( typeof module !== "undefined" && module.exports )
    ? module.exports = {}
    : self
)["sleepdiary_report"] = function( options ) {

    const ONE_HOUR = 1000*60*60,
          activities_all = options["long_term"]["activities"    ],
          schedule_all   = options["long_term"]["schedule"      ],
          summary_all    = options["long_term"]["summary_days"  ],
          summary_asleep = options["long_term"]["summary_asleep"],
          summary_sleeps = options["long_term"]["sleeps_per_day"],
          summary_meds   = options["long_term"]["meds_per_day"  ],
          activities_recent     = options["recent"]["activities"    ],
          schedule_recent       = options["recent"]["schedule"      ],
          summary_recent        = options["recent"]["summary_days"  ],
          summary_recent_asleep = options["recent"]["summary_asleep"],
          summary_recent_sleeps = options["recent"]["sleeps_per_day"],
          summary_recent_meds   = options["recent"]["meds_per_day"  ],
          pdf = options["pdf"],
          timezone = options["timezone"],
          engine_software_version = options["software_version"],
          WAKE_ACTIVITIES = {
              "snack"     : 'S',
              "meal"      : 'M',
              "alcohol"   : 'A',
              "chocolate" : 'C',
              "caffeine"  : 'C',
              "sleep aid" : 'P',
              "exercise"  : 'X',
              "toilet"    : 'T',
              "noise"     : 'N',
              "alarm"     : 'W',
          },
          SLEEP_ACTIVITIES = {
              "in bed"    : '\u00AF',
              "out of bed": '\u00AD',
          },
          zero_pad = n => (n>9)?n:'0'+n
    ;

    /*
     * SUMMARY PAGE
     */

    pdf["text"]( "Sleep Report", 105, 37, { "align": "center" } );

    pdf["setFontSize"](12);
    pdf["text"]( "Recent"             ,  80,  53, { "align": "center" } );
    pdf["text"]( "Long-term"          , 120,  53, { "align": "center" } );
    pdf["text"]( "Graph"              , 160,  53, { "align": "center" } );
    pdf["text"]( "Date began"         ,  20,  60 );
    pdf["text"]( "Total Sleep Time"   ,  20,  70 );
    pdf["text"]( "Wake At"            ,  20,  80 );
    pdf["text"]( "Asleep At"          ,  20,  90 );
    pdf["text"]( "Day Length"         ,  20, 100 );
    pdf["text"]( "Sleeps Per Day"     ,  20, 110 );
    pdf["text"]( "Medications Per Day",  20, 120 );

    pdf["text"]( "Timezone:", 20, 135 );
    pdf["line"]( 42, 136, 127, 136 ); // long enough to hold "America/Argentina/ComodRivadavia"

    const text_a = [
        "The numbers above show mean ± standard deviation, calculated from the digital diary.",
        "Sleeps Per Day and Medications Per Day are calculated based on biological days,",
        "so a 36-hour day with an 8-hour primary sleep and a 4-hour secondary sleep",
        "counts as two sleeps per day.",
        "",
        "Total Sleep Time includes naps, but Wake At and Asleep At do not.",
        "",
        "The black lines in the graph show the 14-day rolling average.",
        "The grey dots in the graph show a single event.",
    ], text_b = [
        "",
        "We would like to thank the Centre of Sleep and Chronobiology, University of Toronto",
        "for the original concept of the Sleep Disorder Patient Chart",
        "originated by Moldofsky/MacFarlane © 1990",
        "",
    ], text_c = [
        "Please send feedback to",
        "Software version: " + SOFTWARE_VERSION + '/' + engine_software_version,
        "Report version: " + REPORT_VERSION,
    ],
          text = text_a.concat(text_b,text_c)
    ;

    pdf["text"]( text, 20, 150 );

    pdf["setTextColor"]( 0, 0, 255 );
    pdf["textWithLink"](
        'sleepdiary.github.io',
        67.2, 150 + 4.875 * (text_a.length+text_b.length) - 0.1,
        { url: 'https://sleepdiary.github.io' }
    );
    pdf["setTextColor"]( 0 );

    pdf["setFont"]( "Courier" );

    pdf["text"]( activities_recent[0]["id"].split("T")[0],  80, 60, { "align": "center" } );
    pdf["text"]( activities_all   [0]["id"].split("T")[0], 120, 60, { "align": "center" } );

    function draw_sleep_bars(
        activity,
        day_left, day_width, bar_width,
        horizontal_top,
        vertical_top, vertical_height
    ) {
        switch ( activity["type"] ) {
        case "start-unknown": {
            const duration = Math.min( 0.1, 1 - activity["offset_start"] );
            for ( let n=0; n+0.01 <= duration; n+=0.02 ) {
                pdf["rect"](
                    day_left + day_width*(activity["offset_start"]+n), horizontal_top,
                    day_width*Math.min(0.01,duration-n), bar_width,
                    'F'
                );
            }
            break;
        }
        case "unknown-end": {
            const duration = Math.min( activity["offset_end"], 0.1 );
            for ( let n=0; n+0.01 <= duration; n+=0.02 ) {
                pdf["rect"](
                    day_left + day_width*(activity["offset_end"]-duration+n), horizontal_top,
                    day_width*Math.min(0.01,duration-n), bar_width,
                    'F'
                );
            }
            break;
        }
        default: {
            const duration = activity["offset_end"] - activity["offset_start"];
            pdf["rect"](
                day_left + day_width*activity["offset_start"], horizontal_top,
                day_width*duration, bar_width,
                'F'
            );
        }
        }
        if ( !activity["type"].search(/^start-/) ) {
            pdf["rect"](
                day_left-0.1+ day_width*activity["offset_start"], vertical_top,
                bar_width, vertical_height,
                'F'
            );
        }
        if ( activity["type"].search(/-end$/) != -1 ) {
            pdf["rect"](
                day_left+0.1 + day_width*activity["offset_end"] - bar_width, vertical_top,
                bar_width, vertical_height,
                'F'
            );
        }
    }

    function to_duration(value) {
        const hours = Math.floor( value / ONE_HOUR ),
              minutes = Math.floor( value / (60*1000) ) % 60
        ;
        return (
            hours +
                ( minutes < 10 ? ":0" : ":" ) +
                minutes
        );
    }

    [
        [ summary_recent_asleep   , summary_asleep       , 0 ],
        [ schedule_recent["wake"] , schedule_all["wake"] , 0 ],
        [ schedule_recent["sleep"], schedule_all["sleep"], 0 ],
        [ summary_recent          , summary_all          , 0 ],
        [ summary_recent_sleeps   , summary_sleeps       , 1 ],
        [ summary_recent_meds     , summary_meds         , 1 ],
    ].forEach( (schedules,n) => {

        if ( schedules[0] && schedules[1] ) {

            let y    = 70 + n*10,
                mode = schedules.pop()
                ;

            /*
             * Text columns
             */
            schedules.forEach( (s,m) => {
                const x = 80 + m*40,
                      mean_str = mode ? s["mean"].toFixed(2) : to_duration(s["mean"]),
                      sd_str   = mode ? s["standard_deviation"].toFixed(2) : to_duration(s["standard_deviation"])
                ;
                pdf["text"]( mean_str, x-2, y    , { "align": "right"  } );
                pdf["setFontSize"](10);
                pdf["text"]( "±" , x  , y-0.2, { "align": "center" } );
                pdf["setFontSize"](12);
                pdf["text"]( sd_str  , x+2, y    , { "align": "left"   } );
            });

            /*
             * Graph
             */
            let graph_top = y - 5,
                graph_left = 140,
                graph_width = 40,
                graph_height = 7,
                graph_bottom = graph_top + graph_height,
                columns = activities_all,
                column_width = (columns.length>1) ? graph_width / ( columns.length-1) : 0,
                current_column = 0,
                prev,
                prev_column = Infinity,
                column_pos = timestamp => {
                    while ( current_column < columns.length && (columns[current_column]||{end:0}).end <= timestamp ) {
                        ++current_column;
                    }
                    return graph_left + column_width*current_column;
                },
                day_lengths = schedules[1]["durations"].filter( d => d !== undefined ).sort( (a,b) => a-b ),
                y_modifier = (
                    mode
                    ? day_lengths[ day_lengths.length-1 ] || 1
                    : Math.ceil( // whole number of hours
                        Math.max(
                            day_lengths[ Math.floor( day_lengths.length * 0.95 ) ],
                            86400000,
                        )
                    )
                ) / graph_height,
                max_rolling_difference = graph_height / 2,
                rolling_average = []
            ;

            pdf["setDrawColor"]( 220 );
            // axes:
            pdf["line"]( graph_left, graph_top       , graph_left      , graph_top+graph_height );
            pdf["line"]( graph_left, graph_top+graph_height, graph_left+graph_width, graph_top+graph_height );
            if ( !mode ) {
                // 24 hour mark:
                pdf["line"]( graph_left, graph_bottom - 86400000/y_modifier, graph_left-1, graph_bottom - 86400000/y_modifier );
            }
            pdf["setDrawColor"]( 0 );

            pdf["setFillColor"]( 220 );
            schedules[1]["durations"].forEach( (d,n) => {
                if ( d !== undefined ) {
                    pdf["circle"](
                        column_pos(schedules[1]["timestamps"][n]),
                        graph_bottom - d / y_modifier,
                        0.25,
                        'F'
                    );
                }
            });
            pdf["setFillColor"]( 0 );

            current_column = 0;
            schedules[1]["rolling_average"].forEach( (average,n) => {
                if ( average !== undefined ) {
                    const x = column_pos(schedules[1]["timestamps"][n]),
                          value = graph_bottom - average / y_modifier;
                    if (
                        Math.abs( prev - value ) > max_rolling_difference || // Y gap is too large
                        prev_column < x-7 // X gap is too large
                    ) {
                        prev_column = Infinity;
                    } else {
                        if ( prev_column < x ) {
                            pdf["line"]( prev_column, prev, x, value );
                        }
                        prev_column = x;
                    }
                    prev = value;
                }
            });

        } else {

            pdf["text"]( "(no data)", 100, 70 + n*10 - 0.2, { "align": "center" } );

        }

    });

    pdf["text"]( timezone || "GMT", 44, 135 );

    /*
     * SHORT-TERM CHART
     */
    pdf["setDrawColor"]( 0 );
    activities_recent.forEach( (day,n) => {

        pdf["setFont"]( "Helvetica" );

        if ( !(n%7) ) {
            pdf["addPage"]();
            pdf["setFontSize"](16);
            pdf["text"]( "Week " + ((n/7)+1), 105, 37, { "align": "center" } );
            pdf["setFontSize"](10);
            pdf["text"]( "Date began:", 25, 47 );
            pdf["line"]( 45, 48, 71, 48 );
        }

        const offset = 61+(n%7)*30,
              date = day["id"].split("T")[0],
              date_obj = new Date(date + "T00:00:00.000Z")
        ;

        switch ( date_obj.getUTCDay() ) {
        case 0:
        case 6:
            pdf["setFont"]( "Helvetica", "bold" );
            break;
        default:
            pdf["setFont"]( "Helvetica", "normal" );
        }
        pdf["text"](
            new Intl.DateTimeFormat(undefined, { "weekday": "short", "day": "numeric" } ).format(date_obj),
            7.5, offset-4
        );
        pdf["setFont"]( "Helvetica", "normal" );

        pdf["setFillColor"](234);

        pdf["rect"](22, offset+0, 163, 14 );
        pdf["rect"](22, offset+7, 163, 7, 'DF' );
        pdf["setFontSize"](10);
        pdf["text"]( "pm", 22, offset-6 );
        pdf["text"]( "6" , 22, offset-2 );
        let state = 0;
        for ( let n=1; n<day["segments"].length; ++n ) {
            const x = 22+(163*n/(day["segments"].length)),
                  hour = day["segments"][n]["hour"],
                  dst_state = day["segments"][n]["dst_state"]
            ;
            pdf["line"]( x, offset+0, x, offset+14 );
            if ( !(n%2) ) {
                switch ( state ) {
                case 0: // before midnight
                    if ( hour < 12 ) {
                        pdf["text"]( "midnight", x, offset-6, { "align": "center" } );
                        state = 1;
                    }
                    break;
                case 1: // at midnight
                    pdf["text"]( "am", x, offset-6 );
                    state = 2;
                case 2: // before noon
                    if ( hour >= 12 ) {
                        pdf["text"]( "noon", x, offset-6 );
                        state = 0;
                    }
                };
            }
            switch ( dst_state ) {
            case "change-forward":
                pdf["setFont"]( "ZapfDingbats" );
                pdf["text"]( "\u00F3", x, offset-2, { "align": "center" } );
                pdf["setFont"]( "Helvetica" );
                break;
            case "change-back":
                pdf["setFont"]( "ZapfDingbats" );
                pdf["text"]( "\u00F3", x+2.5, offset-4.5, { "align": "center", "angle": 180 } );
                pdf["setFont"]( "Helvetica" );
                break;
            default:
                if ( !(hour%2) ) {
                    pdf["text"]( ""+((hour%12)||12), x, offset-2 )
                }
            }
        }
        pdf["text"]( "pm", 185, offset-6, { "align": "right" } );
        pdf["text"]( "6", 185, offset-2, { "align": "right" } );

        pdf["setFontSize"](7);
        pdf["text"]( "ACTIVITIES", 21, offset+4, { "align": "right" } );
        pdf["text"]( [ "SLEEP", "TIME" ], 21, offset+10, { "align": "right" } );

        pdf["text"]( "LIGHTS OUT", 25, offset+18 );
        pdf["line"]( 40, offset+19, 56, offset+19 );
        pdf["text"]( "am", 57, offset+18 );
        pdf["text"]( "pm", 62, offset+18 );

        pdf["text"]( "TOTAL SLEEP TIME", 137, offset+18 );
        pdf["line"]( 161, offset+19, 177, offset+19 );
        pdf["text"]( "hrs", 178, offset+18 );

        /*
         * Populate values
         */

        pdf["setFont"]( "Courier" );
        pdf["setFontSize"](10);

        if ( !(n%7) ) {
            pdf["text"]( date, 58, 47, { "align": "center" } );
        }

        pdf["setFillColor"](0);
        pdf["setFontSize"](16);
        day["activities"].forEach( a => {
            if ( WAKE_ACTIVITIES[a["record"]["status"]] ) {
                pdf["text"](
                    WAKE_ACTIVITIES[a["record"]["status"]],
                    22 + 163*a["offset_time"],
                    offset+5,
                    { "align": "center" },
                );
            } else if ( a["record"]["status"] == 'asleep' ) {
                draw_sleep_bars(
                    a,
                    22, 163, 0.5,
                    offset+10,
                    offset+8, 5
                );
            } else if ( SLEEP_ACTIVITIES[a["record"]["status"]] ) {
                pdf["setFont"]( "Symbol" );
                pdf["text"](
                    SLEEP_ACTIVITIES[a["record"]["status"]],
                    22 + 163*a["offset_time"],
                    offset+13,
                    { "align": "center" },
                );
                pdf["setFont"]( "Courier" );
            }
        });
        pdf["setFontSize"](10);

        if ( day["activity_summaries"].hasOwnProperty("lights off") ) {
            const time = day["activity_summaries"]["lights off"][
                day["activity_summaries"]["lights off"].hasOwnProperty("last_start")
                ? "last_start"
                : "last_end"
            ];
            pdf["text"](
                time.replace( /.*T(..):(..).*/, (_,h,m) => ((parseInt(h,10)%12)||12) + ':' + m ),
                48, offset+18,
                { "align": "center" },
            );
            if ( time.search( /T(?:0|10|11)/ ) == -1 ) {
                pdf["circle"]( 63.7, offset+17.3, 2.1)
            } else {
                pdf["circle"]( 58.7, offset+17.3, 2.1)
            }
        }

        const sleep_duration = (day["activity_summaries"]["asleep"] || { "duration": NaN })["duration"];
        if ( !isNaN(sleep_duration) ) {
            pdf["text"](
                sleep_duration ? (sleep_duration/ONE_HOUR).toFixed(1) : "(none)" ,
                169, offset+18,
                { "align": "center" }
            );
        }

    });

    /*
     * LONG-TERM GRAPH
     */

    let half_years = [],
        is_first = 0
    ;
    activities_all.forEach( day => {
        const half_year = (
            half_years[day["year"]*2 + ((day["month"]<6)?0:1) ] =
            half_years[day["year"]*2 + ((day["month"]<6)?0:1)] || []
        )
        ;
        (
            half_year[ day["month"] %6 ] =
            half_year[ day["month"] %6 ] || []
        )[day["day"]] = day;
    });

    half_years.forEach( half_year => {
        pdf["addPage"]( 'a4', 'l' );
        half_year.forEach( (month,n) => {
            const top =      (n<3) ? 9 : 111,
                  left = 12 + (n%3) * 93,
                  width = 82,
                  height = 88,
                  example = month.find( d => d )
            ;
            pdf["setFont"]( "Helvetica" );
            pdf["setFontSize"](10);
            pdf["text"]( '6pm', left, top+4 );
            pdf["text"]( example.year + '-' + zero_pad(example.month+1), left + width/2, top+4, { "align": "center" } );
            pdf["text"]( '6pm', left + width, top+4, { "align": "right" } );
            pdf["setFontSize"](8);
            month.forEach( (day,n) => {
                switch ( new Date( example.year + '-' + zero_pad(example.month+1) + '-' + zero_pad(n+1) + 'T00:00:00.000Z' ).getUTCDay() ) {
                case 0:
                case 6:
                    pdf["setFont"]( "Helvetica", "bold" );
                    break;
                default:
                    pdf["setFont"]( "Helvetica", "normal" );
                }
                pdf["text"]( ''+(n+1), left-1, top + 7.75 + n*2.75, { "align": "right" } )
            });
            pdf["setFont"]( "Helvetica", "normal" );
            pdf["setFillColor"](234);
            month.forEach( (day,n) => {
                pdf["rect"]( left, top + 5 + n*2.75, width, 2.75, 'F' );
                pdf["setDrawColor"]( 192 );
                for ( let m=1; m!=4; ++m ) {
                    pdf["line"](
                        left + width*m/4, top + 5 +  n   *2.75,
                        left + width*m/4, top + 5 + (n+1)*2.75,
                        'DF'
                    );
                }
                pdf["setDrawColor"]( 0 );
                pdf["rect"]( left, top + 5 + n*2.75, width, 2.75, 'D' );
            });
            pdf["setFillColor"](0);
            month.forEach(
                (day,n) => day["activities"]
                    .filter( a => a["record"]["status"] == 'asleep' )
                    .forEach( a =>
                        draw_sleep_bars(
                            a,
                            left, width, 0.25,
                            top + 5 + n*2.75 + 1.25,
                            top + 5 + n*2.75 + 0.25, 2.25,
                        )
                    )
            )
        });
    });

    /*
     * OUTPUT
     */

    return {
        "pdf": pdf,
        "filename": "sleep diary (" + activities_all[ activities_all.length - 1]["id"].split('T')[0] + ").pdf"
    };

}

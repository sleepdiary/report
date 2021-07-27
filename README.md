# Sleep Diary Report

As part of the [Sleep Diary Project](https://sleepdiary.github.io/), this repository provides a report for use by sleep doctors.  At the present time, this includes:

* _Summary data_ - statistics and graphs describing sleep
* _Short-term sleep chart_ - a Moldofsky/MacFarlane-like Sleep Disorder Patient Chart
* _Long-term sleep chart_ - sleep events over the course of years

Here are some useful links:

* [the sleep diary dashboard](../dashboard) lets you build a diary from multiple sources, and can generate reports through the _Printable report_ option
* [the sleep diary info](https://github.com/sleepdiary/info) contains information and tools to analyse sleep
* <a href="#diary-input" id="diary-input-link">upload your own diary</a> to see a report
* [contact us](https://github.com/sleepdiary/report/issues/new/choose)
<input id="diary-input" type="file" style="display:none">

This project aims to provide a resource for doctors to understand their patients' sleeping disorders.  If there is something more we could do, please [describe it in a new issue](https://github.com/sleepdiary/report/issues/new).  Please include the relevant software version if possible.

## Version History

The summary data includes the version identifier for the report, and for the software that generated it.

Software versions allow developers to detect the exact software version used to build a report.  This includes changes that don't affect the report itself, like changes to copyright dates.  They are based on the lists of source code commits available in the software library that builds the data (usually [Sleep Diary Library](https://github.com/sleepdiary/library/commits/built)) and in [the report itself](https://github.com/sleepdiary/report/commits/built).

Report versions indicate changes to the report that are visible to doctors and patients.  A complete list is available in [the version history](version_history.txt).

# Information for developers

## Moldofsky/Macfarlane Sleep Disorder Patient Charts

The Sleep Disorder Patient Chart, pioneered by [Harvey Moldoysky](http://sites.utoronto.ca/pain/about-us/profile/harvey-moldofsky.html) and [James G. Macfarlane](https://www.psychiatry.utoronto.ca/faculty/james-g-macfarlane) in the early 1990's, has come to be widely used by sleep doctors around the world.  It asks patients to record the following activities:

* `A` - each alcoholic drink
* `C` - each caffeinated drink (includes coffee, tea, chocolate, cola)
* `P` - every time you take a sleeping pill, tranqulisier, or other medication to aid sleep
* `M` - meals
* `S` - snacks
* `X` - exercise
* `T` - use of toilet during sleep-time
* `N` - noise that disturbs your sleep
* `W` - time of wake-up alarm (if any)
* `↓` - each time you got into bed
* `↑` - each time you got out of bed
* `|` - the time you began and the time you ended your sleep
* `|` - the time you began and the time you ended any naps, either in a chair or in bed

Programs that generate sleep diaries are encouraged to let users log all of the above, so the data can be converted to a Sleep Disorder Patient Chart.

Although not currently required, programs are encouraged to let users log _primary sleeps_ (usually about 8 hours at night), _secondary sleeps_ (usually an hour or two during the afternoon) and _tertiary sleeps_ (usually ten minutes at any time of day).  Future versions of this program may use that information to examine quality of sleep.

Sleep Disorder Patient Charts are paper documents designed to be filled out by patients each morning.  The exact layout differs slightly between organisations, but they all closely resemble this report's short-term sleep chart.

## Using this project

Download [sleepdiary-report.min.js](sleepdiary-report.min.js) and optionally [sleepdiary-report.min.js.map](sleepdiary-report.min.js.map) into your project, then call `sleepdiary_report()` in your code.  Here is a minimal example:

    var report = sleepdiary_report({
      pdf: my_pdf,
      timezone: "Pacific/Apia",
      build_id: "...",
      recent: {
          activities     : [ ... ],
          schedule       : { ... },
          summary_days   : { ... },
          summary_asleep : { ... },
          sleeps_per_day : { ... },
          meds_per_day   : { ... },
      },
      long_term: {
          activities     : [ ... ],
          schedule       : { ... },
          summary_days   : { ... },
          summary_asleep : { ... },
          sleeps_per_day : { ... },
          meds_per_day   : { ... },
      }
    });

    var uri = report.pdf.output('datauristring', { filename: report.filename });

Reports are generally build with [jsPDF](https://github.com/MrRio/jsPDF), using data generated by the [Sleep Diary Library](https://github.com/sleepdiary/library).  As such, a more common example looks like:

    var diary = some_diary.to("Standard"),
        timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone,
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
            build_id: diary.build_id(),
            recent: {
                schedule       : diary.summarise_schedule(                             r => r.start>=cutoff, undefined, timezone ),
                summary_days   : diary.summarise_days    (                             r => r.start>=cutoff ),
                summary_asleep : diary.summarise_records ( r => r.status=="asleep"     &&   r.start>=cutoff ),
                sleeps_per_day : diary.total_per_day     ( r => r.status=="asleep"   , r => r.start>=cutoff ),
                meds_per_day   : diary.total_per_day     ( r => r.status=="sleep aid", r => r.start>=cutoff ),
            },
            long_term: {
                activities     : activities,
                schedule       : diary.summarise_schedule( undefined, undefined, timezone ),
                summary_days   : diary.summarise_days    (),
                summary_asleep : diary.summarise_records ( r => r.status == "asleep" ),
                sleeps_per_day : diary.total_per_day     ( r => r.status == "asleep" ),
                meds_per_day   : diary.total_per_day     ( r => r.status == "sleep aid" ),
            },
        });

    var uri = report.pdf.output('datauristring', { filename: report.filename });

When constructing the data used by the report, make sure to use 24-hour days starting at 6pm local time, and to generate one-hour segments.

## Compiling this project

The included [`Dockerfile`](Dockerfile) describes our build environment.  To recompile the project, build and run the environment like this:

    docker build --tag sleepdiary-report "/path/to/sleepdiary/report"
    docker run --rm -v "/path/to/sleepdiary/report":/app sleepdiary-report

This is run automatically by [our GitHub Actions script](.github/workflows/main.yml).  If you fork this project on GitHub, [enable GitHub Actions](https://docs.github.com/en/actions/managing-workflow-runs/disabling-and-enabling-a-workflow) to rebuild the project automatically whenever you push a change.

## License

Sleep Diary Report, Copyright © 2021 Sleepdiary Developers <sleepdiary@pileofstuff.org>

Sleep Diary Report comes with ABSOLUTELY NO WARRANTY.  This is free software, and you are welcome to redistribute it under certain conditions.  For details, see [the license statement](LICENSE).

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.3.1/jspdf.umd.min.js"></script>
<script src="../library/sleepdiary-library.min.js"></script>
<script src="sleepdiary-report.min.js"></script>
<script src="index.js"></script>

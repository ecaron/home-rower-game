# A Rowing Game, powered by the WaterRower's S4 USB Output

![David](https://img.shields.io/david/ecaron/waterrower-game)

This is a simple NodeJS application that connects to a [WaterRower](https://www.waterrower.com/us/) (with the [S4 module](https://www.waterrower.com/us/shop/accessories/commodule.html)) and creates charts & games that can be accessed by any web browser.

The app can run on hardware as small as a [Raspberry Pi](https://www.raspberrypi.org/) and connects to the WaterRower's S4 with a USB cable.

There are two modes: **Head-to-head competition** and **Real-time Charting**

### Head-to-head competition
Picking another rower's previous record, or your own personal best, you'll go side-by-side seeing who can row farther. The system measures & reports in realtime your current speed (in knots) and the total distance you've traveled.

Logbooks are kept & provided, per rower, to track total distance, maximum speed, and number of sessions in last 7 days, last 30 days and all-time.

### Real-time Charting
If you're not feeling like a competition, you can watch up to 6 different metrics at the same-time and watch your trendlines over the course of your current session.

#### Metrics tracked:
* Distance in meters
* Average time for a pull
* Average time for a whole stroke
* Stroke Count
* Total Distance in MPH

## Screenshots

### Realtime Competition
Watch your speed and distance against a competitor! Go side-by-side, seeing if you're outpacing them or need to catch up. Also the speed of the water changes related to your owner personal pace.
<img src="/docs/realtime-competition.gif">

### Realtime Graphs
If you're not feeling competitive and love a screen full of charts, then the realtime charts (powered by [Chart.js](https://www.chartjs.org/)) will let you select the metrics you want to see & trace your progress over the course of a row.
<img src="/docs/realtime-graphs.gif">

### Select Your Rower
Do multiple people use your rower? Great! Select who you are, and select who you want to row against! You can race against their best record or try to outdo your personal best!!
<img src="/docs/avatar-selector.png" width="640">

### Customize Your Rower
Using the great [Avataaars](https://getavataaars.com/) library, you can customize your rower to fit your style.
<img src="/docs/avatar-customize.png" width="640">


## Running
The application runs as `npm start`. Then the experience is available at http://localhost:8080 (or the IP of the device, if you're going headless).

If you create a `.env` file in the root directory, some features you can control:

Key | Purpose
------------ | -------------
PORT | By default 8080. Remember that lower ports might require root.
SESSION_SECRET | Basic housekeeping for cookie-managed sessions.
FAKE_ROWER | If you're developing and not connected to a rower, this does fake measurements.
SAVE_FAKE_RESULTS | If you're using *FAKE_ROWER* and want race results saved to the database, set this.


### Installation
After you've installed [Node](https://nodejs.org/en/download/), then just download this package and run `npm install`.

### *Operating System Support*
This application has only been tested on Linux. That said, the only complicated piece is using [SerialPort](https://serialport.io/) to talk to the WaterRower, and that's been thoroughly tested on Windows and Mac.

If you follow the [Installing SerialPort](https://serialport.io/docs/guide-installation#installation-special-cases) documentation, that'll cover the nuances to get this to run.

You'll also want to make sure the user running this app has read & write permissions to the WaterRower's port (such as /dev/ttyACM0).

### Running On Startup

The decision was made to exclude any "just add this service" scripts to this project. There are many great articles that tell you how
to configure your script to run automatically at boot. Some recommendations are:
* https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04
* https://www.linuxuprising.com/2018/04/how-to-install-and-configure-nodejs-and.html

## Troubleshooting
See the (page on the wiki)[https://github.com/ecaron/waterrower-game/wiki/Troubleshooting).

## Related Projects
* https://github.com/olympum/waterrower-ble/ (inspiration for this package)
* https://www.nohrd.com/uk/we-row/

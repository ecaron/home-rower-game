# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1]
### Changed
* If `PORT` is defined & unavailable, or 8080 is unavailable, it'll randomly test ports until it finds one available.
* If running within an Electron process, it saves the two databases to the userProfile directory

## [2.0]
This release is a breaking change from the v1.0 database. If you were a user of v1 and want your previous rowing records ported to v2, please email me the JSON and I'll convert it for you.

### Added
* Now supports multiple race modes!! (marathon, various time & distance trials)
* Ability to race by yourself
* Real-time indicator of proximity to the "finish" line
* Current Time Clock while doing a race
* sequelize & sqlite for database support, along with migration & seeding scripts
* Different water backgrounds & varying color tones
* Launch screen is a subtle animation to make things feel playful
* Bootstrap libraries (both CSS and icons)

### Changed
* Race starts at first row, rather than clicking "Start" button
* "Fake Mode" rower now has a correlation between speed & distance
* Underlying way that the data is structured for v2.1 functionaliy

### Removed
* Material design libraries (both CSS and icons)
* nedb database, since it is 3+ years without update & had security flaws
* Darkmode CSS. It wasn't working that great, but it'll come back when Bootstrap v6 is released

## [1.0]

Initial release

### Added
- Real-time charting of all data reported by S4
- Preseed with one rower who has a record on file
- Create & edit rower with custom avatar
- Race head-to-head with another rower's recorded record
- Race is based on who can row the farthest
- Cannot select rowers who have not yet been active

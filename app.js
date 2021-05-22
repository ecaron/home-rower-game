require('dotenv').config()
const debug = require('debug')('home-rower-game:main')
const express = require('express')
const session = require('express-session')
const NedbStore = require('express-nedb-session')(session)
const nunjucks = require('nunjucks')
const http = require('http')
const path = require('path')

const db = require('./lib/db')
const routes = require('./routes')
const websocket = require('./lib/websocket')
const S4 = require('./s4')

const app = express()

app.set('views', path.join(__dirname, 'views'))
nunjucks.configure('views', {
  express: app,
  autoescape: true
})
app.set('view engine', 'njk')

const sessionParser = session({
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || 'forgotToSetEnv',
  resave: false,
  cookie: { path: '/', httpOnly: true, maxAge: 365 * 24 * 3600 * 1000 },
  store: new NedbStore({ filename: path.join(__dirname, 'db', 'sessions') })
})

app.use(sessionParser)
app.use(express.urlencoded({
  extended: true
}))

app.use('/chart', express.static(path.join(__dirname, 'node_modules', 'chart.js', 'dist')))
app.use('/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')))
app.use('/materialize', express.static(path.join(__dirname, 'node_modules', 'materialize-css', 'dist')))
app.use('/nosleep.js', express.static(path.join(__dirname, 'node_modules', 'nosleep.js', 'dist')))

app.use(function (req, res, next) {
  if (!process.env.FAKE_ROWER && !S4.rower.connected) {
    res.render('rower-not-connected')
    return
  }
  next()
})

app.use('/compete', routes.compete)
app.get('/realtime', routes.realtime)
app.use('/rower', routes.rower.modify)
app.use('/register', routes.rower.register)
app.post('/login', routes.rower.login)
app.delete('/logout', routes.rower.logout)
app.get('/', routes.rower.home)

app.use(express.static(path.join(__dirname, 'public')))

const run = async function (app) {
  if (!process.env.FAKE_ROWER) {
    S4.init()
  }
  await db.init()

  const server = http.createServer(app)

  websocket.init(server, sessionParser)

  server.listen(process.env.PORT || 8080, function () {
    debug(`Listening on http://localhost:${process.env.PORT || 8080}`)
  })
}
run(app)

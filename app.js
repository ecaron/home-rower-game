require('dotenv').config()
const debug = require('debug')('home-rower-game:main')
const express = require('express')
const session = require('express-session')
const Sequelize = require('sequelize')
const nunjucks = require('nunjucks')
const http = require('http')
const path = require('path')

const routes = require('./routes')
const websocket = require('./lib/websocket')
const S4 = require('./s4')

const app = express()

const SequelizeStore = require('connect-session-sequelize')(session.Store)

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'db', 'session.sqlite'),
  logging: false
})

app.set('views', path.join(__dirname, 'views'))
nunjucks.configure('views', {
  express: app,
  autoescape: true
})
app.set('view engine', 'njk')

const sessionStore = new SequelizeStore({
  db: sequelize
})

const sessionParser = session({
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET || 'forgotToSetEnv',
  store: sessionStore,
  cookie: { path: '/', httpOnly: true, maxAge: 365 * 24 * 3600 * 1000 },
  resave: false
})

app.use(sessionParser)
sessionStore.sync()

app.use(express.urlencoded({
  extended: true
}))

app.use('/animate.css', express.static(path.join(__dirname, 'node_modules', 'animate.css')))
app.use('/chart', express.static(path.join(__dirname, 'node_modules', 'chart.js', 'dist')))
app.use('/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')))
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')))
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons', 'font')))
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

  const server = http.createServer(app)

  websocket.init(server, sessionParser)

  server.listen(process.env.PORT || 8080, function () {
    debug(`Listening on http://localhost:${process.env.PORT || 8080}`)
  })
}
run(app)

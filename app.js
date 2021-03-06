require('dotenv').config()
const debug = require('debug')('waterrower-game:main')
const express = require('express')
const session = require('express-session')
const NedbStore = require('express-nedb-session')(session)
const nunjucks = require('nunjucks')
const http = require('http')
const path = require('path')

const routes = require('./routes')
const websocket = require('./lib/websocket')

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
app.use('/materialize', express.static(path.join(__dirname, 'node_modules', 'materialize-css', 'dist')))

app.use('/compete', routes.compete)
app.get('/', routes.player.home)
app.use('/rower/', routes.player.modify)
app.use('/register/', routes.player.register)
app.post('/login', routes.player.login)
app.delete('/logout', routes.player.logout)

app.use(express.static(path.join(__dirname, 'public')))

const server = http.createServer(app)

websocket.init(server, sessionParser)

server.listen(process.env.PORT || 8080, function () {
  debug(`Listening on http://localhost:${process.env.PORT || 8080}`)
})

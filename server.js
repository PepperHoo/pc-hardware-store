import express from 'express'

import jsonServer from 'json-server'

const server = express()

const router =
  jsonServer.router('db.json')

const middlewares =
  jsonServer.defaults()

// BODY LIMIT
server.use(
  jsonServer.bodyParser
)

server.use((req, res, next) => {

  req.headers[
    'content-length'
  ] = '200mb'

  next()
})

// CUSTOM LARGE LIMIT
server.use(
  express.json({
    limit: '200mb'
  })
)

server.use(
  express.urlencoded({
    extended: true,
    limit: '200mb'
  })
)

// MIDDLEWARE
server.use(middlewares)

// ROUTER
server.use(router)

const PORT = 3000

server.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  )
})
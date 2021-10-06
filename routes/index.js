var express = require('express')
var router = express.Router()
const { getConstituency, getCoordinates } = require('../lib/lib.js')

router.get('/', async function (req, res, next) {
  const response = await getCoordinates(req.query.address).then((data) =>
    getConstituency(data).then((data) => ({
      data: data,
    }))
  )
  res.send(response)
})

module.exports = router

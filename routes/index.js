var express = require('express')
var router = express.Router()
const { getConstituency, getCoordinates, cache } = require('../lib/lib.js')

router.get('/', cache(10), async function (req, res) {
  const response = await getCoordinates(req.query.address).then((data) =>
    getConstituency(data).then((data) => ({
      data: data,
    }))
  )
  res.send(response)
})

module.exports = router

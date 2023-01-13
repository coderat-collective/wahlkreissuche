require('dotenv').config()

const axios = require('axios')
const { geoContains } = require('d3')
const fs = require('fs').promises

const { results } = require('../data/dwe-votes.js')
const { deputees } = require('../data/deputees')

const mcache = require('memory-cache')

exports.cache = () => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(JSON.parse(cachedBody))
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        mcache.put(key, body)
        res.sendResponse(body)
      }
      next()
    }
  }
}

exports.getCoordinates = async (address) => {
  let config = {
    method: 'post',
    url: `https://maps.googleapis.com/maps/api/geocode/json?key=${
      process.env.API_KEY
    }&address=${encodeURIComponent(address + ', Berlin')}`,
    headers: {},
  }
  const data = await axios(config)
    .then((res) => {
      let {
        geometry: { location_type, location },
      } = res.data.results[0]

      let result =
        location_type === 'ROOFTOP' || location_type === 'RANGE_INTERPOLATED'
          ? {
              addressFormatted: res.data.results[0]?.formatted_address,
              coordinates: [location.lng, location.lat],
            }
          : {
              addressFormatted: 'not found',
              coordinates: [0, 0],
            }

      return result
    })
    .catch((err) => {
      console.log(err)
    })
  return data
}

exports.getConstituency = async ({ coordinates, addressFormatted }) => {
  if (addressFormatted !== 'not found') {
    try {
      const result = await fs.readFile('./data/wahlkreise-2021.geojson')
      const wahlkreise2021 = JSON.parse(result)
      const wahlkreis = []
      wahlkreise2021.features.forEach(
        (d) => geoContains(d, coordinates) && wahlkreis.push(d.properties)
      )

      const deputee = deputees.find(
        ({ constituencyID }) => constituencyID === wahlkreis[0].AWK
      )

      return wahlkreis.length > 0
        ? {
            status: 'address found',
            AWK: wahlkreis[0].AWK,
            name: wahlkreis[0].wahlkreis_name,
            coordinates: coordinates,
            addressFormatted: addressFormatted.replace(', Germany', ''),
            result: results[wahlkreis[0].id],
            deputee: deputee,
          }
        : { status: 'address not found', coordinates: coordinates }
    } catch (e) {
      console.error(e)
    }
  } else {
    return { status: 'address not found' }
  }
}

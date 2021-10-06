require('dotenv').config()

const axios = require('axios')
const { geoContains } = require('d3')
const fs = require('fs').promises

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
      return (
        res.data.results[0]?.geometry.location_type ===
          ('ROOFTOP' || 'RANGE_INTERPOLATED') && {
          addressFormatted: res.data.results[0]?.formatted_address,
          coordinates: [
            res.data.results[0]?.geometry.location.lng,
            res.data.results[0]?.geometry.location.lat,
          ],
        }
      )
    })
    .catch((err) => {
      console.log(err)
    })
  return data
}

exports.getConstituency = async ({ coordinates, addressFormatted }) => {
  try {
    const result = await fs.readFile('./data/wahlkreise-2021.geojson')
    const wahlkreise2021 = JSON.parse(result)
    const wahlkreis = []
    wahlkreise2021.features.forEach(
      (d) => geoContains(d, coordinates) && wahlkreis.push(d.properties)
    )
    return wahlkreis.length > 0
      ? {
          status: 'address found',
          AWK: wahlkreis[0].AWK,
          name: wahlkreis[0].wahlkreis_name,
          coordinates: coordinates,
          addressFormatted: addressFormatted.replace(', Germany', ''),
        }
      : { status: 'address not found', coordinates: coordinates }
  } catch (e) {
    console.error(e)
  }
}

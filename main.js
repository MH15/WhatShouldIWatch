'use strict'

const Hapi = require('hapi')
const Findango = require('findango-api')
const request = require('request')
const Vision = require('vision')
const Ejs = require('ejs')
const geoip = require('geoip-lite')

const server = Hapi.server({
    port: process.env.PORT || 3000
})

const init = async () => {

	await server.register([
		require('inert')
	])
	await server.register([
		require('vision')
	])

	server.views({
        engines: { ejs: Ejs },
        relativeTo: __dirname,
        path: 'views'
    })

	// Route public files such as CSS/JS
	// and images. SASS is compiled to 
	// raw CSS in the file gulpfile.js
    server.route({
	    path: "/public/{path*}",
	    method: "GET",
	    handler: {
	        directory: {
	            path: "./public",
	            listing: false,
	            index: false
	        }
	    }
	})

    await server.start()
    console.log(`Server running at: ${server.info.uri}`)
}

// Handle unhandled rejections and quit
process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()

// Main Page route
server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
    	const ip = request.info.remoteAddress
    	console.log("ip: " + ip)
    	console.log(request)
		let geo = geoip.lookup("140.254.77.153")
		console.log(geo)
		// Create a default zipcode if the
		// IP adress code isn't working
        let zipcode
        if (geo != null) {
        	if (geo.zip) {
        		zipcode = geo.zip
        	} else {
        		zipcode = 45459
        	}
        } else {
        	zipcode = 45459
        }

    	const findango = await FindangoData(zipcode)
    	const films = findango.films
    	const theater = findango.theater
    	const scored = await Score(films)

    	// move "N/A" ratings to the end of the list
    	let rated = [], unrated = []
    	scored.forEach(film => {
    		if (film.IMDB_rating != "N/A") {
    			rated.push(film)
    		} else {
    			unrated.push(film)
    		}
    	})

    	// sort by IMDB score
    	rated.sort((a, b) => {
    		return Number(b.IMDB_rating) - Number(a.IMDB_rating)
    	})

        return h.view('main', {
        	title: "What Should I Watch?",
        	rated: rated,
        	unrated: unrated,
        	theater: theater
        })
    }
})


// Gather a list of films playing in the area
function FindangoData(postal) { 
	return new Promise(resolve => {
		Findango.find({
			zipCode: postal
		}).then(theaters => {
		  resolve({
		  	films: theaters[0].films,
		  	theater: {
		  		name: theaters[0].name,
		  		location: theaters[0].location
		  	}
		  })
		})
	})
}

async function processArray(array) {
	// map array to promises
	const promises = array.map(delayedLog)
	// wait until all promises are resolved
	await Promise.all(promises)
}

async function Score(films) {
	let out = []

	const promises = films.map(async (film) => {
		try {
			let data = await GetOMDB(film.title).catch(error => console.log(error))
			if (data.Title) {
				let obj = {
					Title: film.title,
					Fandango_URL: film.url,
					Film_URL: data.website,
					IMDB_rating: data.imdbRating,
					IMDB_votes: data.imdbVotes,
					Metacritic: data.Metascore,
					IMDB_ID: data.imdbID,

					Poster: data.Poster,
					Plot: data.Plot,


					Actors: data.Actors,
					Writer: data.Writer,
					Released: data.Released,
					Runtime: data.Runtime,

				}
				out.push(obj)
			}
		} catch(e) {
			console.log("failed to get data for this film")
		}

	})
	// wait until all promises are resolved
	await Promise.all(promises)
	// console.log(out.length + " movies were retrieved from OMDB")
	return out

}

// Get-request the data from OMDB's servers
// OMDb API Key: 1945957c
function GetOMDB(title) {
	return new Promise((resolve, reject) => {
		request(`http://www.omdbapi.com/?t=${title}&apikey=1945957c`, (error, response, body) => {
			// TODO: error handling!
			// console.log("TITLE: " + title)
			let json = null
			if (IsJsonString(body)) {
				resolve(JSON.parse(body))
			} else {
				reject('invalid json format')
			}
		})
	})
}

function IsJsonString(str) {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}
'use strict';

const Hapi = require('hapi')
const Findango = require('findango-api')
const request = require('request')
const Vision = require('vision')
const Ejs = require('ejs')

const server = Hapi.server({
    port: process.env.PORT || 3000
});


//
// Fandago API nonsense
// key: 4a95u4bkk7sm8j6ur2phq35w
// secret: kdfVXU2Mwq
//



server.route({
    method: 'GET',
    path: '/{name}',
    handler: (request, h) => {

        return 'Hello, ' + encodeURIComponent(request.params.name) + '!';
    }
});

const init = async () => {
	await server.register({
	    plugin: require('hapi-geo-locate')
	})
	await server.register(Vision);

	await server.register([
		require('inert'),
	])

	server.views({
        engines: { ejs: Ejs },
        relativeTo: __dirname,
        path: 'views'
    });

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
	});



    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();

// Real App Code
server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
    	const location = request.location
    		
    	console.log("NODE_ENV = " + process.env.NODE_ENV)
    	if (process.env.NODE_ENV === 'development') {
			location.postal = 45459
		} 
		if (process.env.NODE_ENV === 'production') {
			console.log("Location")
	    	console.log(location)
	    	if (!location.postal) {
	    		location.postal = 45459
	    	}
		}

    	// TODO: error handle location data
    	const findango = await FindangoData(location.postal)
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
        	unrated: unrated
        })
    }
});


// Gather a list of films playing in the area
function FindangoData(postal) { 
	return new Promise(resolve => {
		Findango.find({
		  zipCode: postal
		}).then(theaters => {
			// console.log(theaters)
		  // Theatres have the format:
		  // {
		  //  name: '…',              // Name of theatre
		  //  location: '…',          // Theatre address
		  //  films: [{
		  //    title: "Movie Title"  // Title of film
		  //    url: '…'              // Fandango URL for showtimes
		  //  }]
		  // }
		  resolve({
		  	films: theaters[0].films,
		  	theater: {
		  		name: theaters[0].name,
		  		location: theaters[0].location
		  	}
		  })
		});
	});
}


async function processArray(array) {
	// map array to promises
	const promises = array.map(delayedLog);
	// wait until all promises are resolved
	await Promise.all(promises)
}

// Create object including IMBD score
// omdb key: 1945957c
async function Score(films) {
	let out = []

	const promises = films.map(async (film) => {
		let data = await GetOMDB(film.title)
		// console.log(data)
		// console.log(omdb_data.imdbRating)
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
			// console.log(obj)
			out.push(obj)
		}
	});
	// wait until all promises are resolved
	await Promise.all(promises);

	// console.log(out.length + " movies were retrieved from OMDB")
	return out

}


// Get-request the data from OMDB's servers
function GetOMDB(title) {
	return new Promise((resolve, reject) => {
		request(`http://www.omdbapi.com/?t=${title}&apikey=1945957c`, function (error, response, body) {
			// TODO: error handling!
			resolve(JSON.parse(body))
		});
	})
}






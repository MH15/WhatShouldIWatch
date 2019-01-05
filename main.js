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

	server.views({
        engines: { ejs: Ejs },
        relativeTo: __dirname,
        path: 'views'
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
    	const films = await FindangoData()

    	const scored = await Score(films)
    	// console.log(scored)

    	// move "N/A" ratings to the end of the list
		scored.sort((a, b) => {
    		return Number(b.IMDB_rating) - Number(a.IMDB_rating)
    	})

    	let rated = [], unrated = []
    	scored.forEach(film => {
    		if (film.IMDB_rating != "N/A") {
    			rated.push(film)
    		} else {
    			unrated.push(film)
    		}
    	})

    	rated.sort((a, b) => {
    		return Number(b.IMDB_rating) - Number(a.IMDB_rating)
    	})

    	console.log("yeeeeeeeeeet")
    	// console.log(scored)
    	// console.log(scored)

        return h.view('main', {
        	title: "yeet",
        	rated: rated,
        	unrated: unrated
        })
    }
});


// Gather a list of films playing in the area
function FindangoData() { 
	return new Promise(resolve => {
		Findango.find({
		  zipCode: '45459'
		}).then(theatres => {
		  // Theatres have the format:
		  // {
		  //  name: '…',              // Name of theatre
		  //  location: '…',          // Theatre address
		  //  films: [{
		  //    title: "Movie Title"  // Title of film
		  //    url: '…'              // Fandango URL for showtimes
		  //  }]
		  // }
		  resolve(theatres[0].films)
		});
	});
}


async function processArray(array) {
	// map array to promises
	const promises = array.map(delayedLog);
	// wait until all promises are resolved
	await Promise.all(promises);
	console.log('Done!');
}

// Create object including IMBD score
// omdb key: 1945957c
async function Score(films) {
	let out = []

	const promises = films.map(async (film) => {
		let omdb_data = await GetOMDB(film.title)
		// console.log(omdb_data.Title)
		// console.log(omdb_data.imdbRating)
		if (omdb_data.Title) {
			let obj = {
				Title: film.title,
				IMDB_rating: omdb_data.imdbRating,
				IMDB_votes: omdb_data.imdbVotes,
				Metacritic: omdb_data.Metascore,

				Poster: omdb_data.Poster,
				Plot: omdb_data.Plot
			}
			// console.log(obj)
			out.push(obj)
		}
	});
	// wait until all promises are resolved
	await Promise.all(promises);

	console.log(out.length + " movies were retrieved from OMDB")
	return out

}


// Get-request the data from OMDB's servers
function GetOMDB(title) {
	return new Promise((resolve, reject) => {
		request(`http://www.omdbapi.com/?t=${title}&apikey=1945957c`, function (error, response, body) {
			resolve(JSON.parse(body))
		});
	})
}






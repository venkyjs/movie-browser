const express = require('express')

const app = express()

const movieLoader = require('./tamrock/movie-loader')

const port = 8080

app.use(express.static('dist'))

app.use('/files', express.static(__dirname + '/files/'))

let shouldScrap = false
if (process.argv) {
	process.argv.forEach(val => {
		if (val === 'scraping') {
			shouldScrap = true
			return false
		}
	})
}

if (shouldScrap) {
	movieLoader.load()
	setInterval(() => movieLoader.load(), 24 * 60 * 60 * 1000)
}

app.get('/api/reload', (req, res) => {
	const details = movieLoader.load()
	res.send({ success: true, details })
})

// respond with "hello world" when a GET request is made to the homepage
app.get('/api/data', (req, res) => {
	const { section, type } = req.query
	if (!section) {
		res.send({ error: "Please provide the 'section' as query parameter" })
	} else {
		const rawData = movieLoader.getData(section, type)
		if (rawData) {
			res.send({ data: rawData })
		} else {
			res.send({ data: [] })
		}
	}
})

app.get('/api/init', (req, res) => {
	const lastUpdated = movieLoader.getLastUpdated()
	res.send({ lastUpdated })
})

app.get('/api/getRips', (req, res) => {
	const { lang } = req.query
	const rips = movieLoader.getRips(lang)
	res.send(rips)
})

app.get('/api/getMovies', (req, res) => {
	const { lang, rip, top, latest } = req.query
	const rips = movieLoader.getMovies(
		lang,
		rip,
		Number(top),
		latest === 'true'
	)
	res.send(rips)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

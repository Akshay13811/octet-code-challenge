var express = require('express');
var cors = require('cors');
var forexHelper = require('./helpers/forex-helper');

var app = express();
app.use(cors({
	origin: true //Set to accept requests from all urls
}));

app.use(express.json());

//Mongodb database
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect("mongodb+srv://admin:LXPcIg6bdUNAC56u@cluster0.prbyn.mongodb.net/forex?retryWrites=true&w=majority", (err, client) => {
	if (err) return console.error(err)
	console.log('Connected to Database')

	const db = client.db('forex');

	forexHelper.startPeriodicForexRateUpdates(db);

	//Gets a list of forex rates
	app.get('/rates', function(req, res) {
		//Obtain forex rates
		db.collection('rates').find().toArray()
		.then((values) => {
			let markedupValues = [...values];
			//Obtain markup percentage
			db.collection('settings').findOne({_id: "markup"})
			.then((markupSetting => {
				//Calculate marked up forex rates
				for(let markedupValue of markedupValues) {
					markedupValue.rate = markedupValue.rate * ((100 - markupSetting.value) / 100)
				}
				
				//Send marked up forex rates in the response
				res.send({
					rates: markedupValues
				});
			}));
		})
		.catch(/* ... */)
	});

	//Gets the current markup percentage
	app.get('/markup', function(req, res) {
		db.collection('settings').findOne({_id: "markup"})
		.then((value) => {
			res.send(value);
		})
		.catch(/* ... */)
	});

	//Updates the current markup percentage
	app.post('/markup', function(req,res) {
		let value = Number(req.body.value);
		//Ensure value is a number and that it is >= 0
		if(!isNaN(value) && value >= 0) {
			db.collection('settings').updateOne({ 
				_id: "markup"
			}, {
				$set: {
					value: value
				}
			});
			res.send({
				status: "Updated markup value",
			});
		} else {
			res.status(400).json({error: "Invalid markup value"})
		}
	});

	//Starting the server
	let server = app.listen(8080, function() {
		var host = server.address().address;
		var port = server.address().port;
		console.log(`Listening to http://${host}:${port}`)
	});
});
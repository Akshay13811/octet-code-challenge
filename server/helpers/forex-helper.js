var moment = require('moment');
var fxmarketapi = require('./fxmarketapi-helper');

const SUPPORTED_CURRENCIES = ["AUDUSD", "AUDNZD", "AUDJPY", "AUDCNY"];

exports.SUPPORTED_CURRENCIES = SUPPORTED_CURRENCIES;

exports.startPeriodicForexRateUpdates = function(db) {
	checkIfUpdateRequired(db)
	.then((updateRequired) => {
		if(updateRequired) {
			console.log("A forex update is required");
			updateForexRates(db);
		} else {
			console.log("Forex rates are up to date");
			scheduleNextUpdate(db);
		}
	})
}

//Checks at startup whether an update is required
async function checkIfUpdateRequired(db) {
	let updateRequired = false;
	for(let key of SUPPORTED_CURRENCIES) {

		let result = await db.collection('rates').findOne({ _id: key });

		if(result) { //Update required as one or more supported currencies is out of date
			if(moment(result.lastUpdated) < moment().utc().startOf('hour')) {
				updateRequired = true;
				break;
			}
		} else { //Update required as one or more supported currencies is missing
			updateRequired = true;
			break;
		}
	}

	return updateRequired;
}

//Calls the 3rd party forex api helper to fetch the latest forex data
async function updateForexRates(db) {
	fxmarketapi.fetchForexData()
	.then((rates) => {
		updateMongoDB(db, rates);
	});
}

//Updates mongodb with the latest forex rates
async function updateMongoDB(db, rates) {
	let operations = [];

	let timestamp = moment().utc();

	//Creates an array of operations to perform on the collection
	for(let key of Object.keys(rates)) {

		let result = await db.collection('rates').findOne({ _id: key });

		if(result) { //Update existing document
			operations.push({
				updateOne: {
					"filter": { "_id" : key },
					"update": { $set : { "rate" : rates[key], "lastUpdated" : timestamp.toISOString() }}
				}
			});
		} else { //Insert new document
			operations.push({
				insertOne: {
					"document": { "_id" : key, "rate": rates[key], "lastUpdated" : timestamp.toISOString() },
				}
			});
		}
	}

	//Bulk executes the operations on the collection
	db.collection('rates').bulkWrite(operations)
	.then((value) => {
		if(value.result.ok) {
			console.log(`Forex rates updated successfully, inserted = ${value.result.nInserted}, updated = ${value.result.nMatched}`);
		} else {
			console.log("An error occurred updating the forex rates");
		}
	});

	scheduleNextUpdate(db);
}

//Schedules the next update for the next 'sharp' hour
function scheduleNextUpdate(db) {
	let nextHour = moment().utc().add(1,'hour').startOf('hour');
	let nextUpdate = moment.duration(nextHour.valueOf() - moment().utc().valueOf(), "ms");

	console.log(`Next update will occur in ${nextUpdate.minutes()} minutes and ${nextUpdate.seconds()} seconds`);
	setTimeout(() => {updateForexRates(db)}, nextUpdate.asMilliseconds());
}
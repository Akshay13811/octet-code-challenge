const fetch = require('node-fetch');
var forexHelper = require('./forex-helper');

const API_KEY = "icPkLQGUIy5xHCPJNo4x";

exports.fetchForexData = function() {
	let url = buildEndpointUrl();

	return new Promise((resolve, reject) => {
		fetch(url, { method: 'GET' })
		.then(res => res.json())
		.then((response) => {
			let rates = {};
			const currencies = forexHelper.SUPPORTED_CURRENCIES;
			for(let currency of currencies) {
				rates[currency] = response.price[currency];
			}
			resolve(rates);
		}, (error) => {
			reject(error);
		});
	});
}

function buildEndpointUrl() {
	let url = `https://fxmarketapi.com/apilive?api_key=${API_KEY}&currency=`
	const currencies = forexHelper.SUPPORTED_CURRENCIES;
	for(let i=0; i<currencies.length; i++) {
		url += `${currencies[i]}${i < (currencies.length - 1) ? ',' : ''}`
	}
	return url;
}
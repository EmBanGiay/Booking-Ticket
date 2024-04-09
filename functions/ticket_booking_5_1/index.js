'use strict';
const http = require("https");
const express = require("express");
const helmet = require('helmet');
var catalyst = require('zcatalyst-sdk-node');
const bodyParser = require('body-parser');
const $ = require('jquery');
const utils = require("./utils/utils");

const app = express();
app.use(express.json());
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			frameAncestors: [
				'https://creator.zoho.com',
				'https://creatorapp.zoho.com'
			]
		}
	},
	frameguard: false
}))
app.use(bodyParser.json());


//Variable
const HOST = 'accounts.zoho.com';
const ZCHOST = 'creator.zoho.com';
const PAYONHOST = 'sdk.payon.vn';
const REFRESHTOKEN = utils.Refresh_Token;
const CLIENTID = utils.Client_Id;
const CLIENTSECRET = utils.Client_Secret;
const PORT = process.env.PORT || 3001;


app.post("/getToken", async (req, res) => {

	const adminApp = catalyst.initialize(req, { scope: 'admin' });
	// catalyst app object with admin scope
	let data = await adminApp.zcql().executeZCQLQuery('select AccessToken from Token');
	res.status(200).send(data);
})

app.post("/generateToken", async (req, res) => {
	try {
		let urlPath = `/oauth/v2/token?grant_type=refresh_token` +
			`&client_id=${CLIENTID}` +
			`&client_secret=${CLIENTSECRET}` +
			`&refresh_token=${REFRESHTOKEN}`;

		const options = {
			hostname: HOST,
			//port: PORT,
			method: "POST",
			path: urlPath,

		};

		var data = "";
		const request = http.request(options, function (response) {
			response.on("data", function (chunk) {
				data += chunk;
			});

			response.on("end", async function () {
				try {
					console.log(response.statusCode);
					let dataJson = JSON.parse(data);
					let accessToken = dataJson.access_token;

					const userApp = catalyst.initialize(req, { scope: 'admin' });
					// catalyst app object with user scope 
					var updateResp = await userApp.zcql().executeZCQLQuery(`UPDATE Token SET AccessToken='${accessToken}'`);
					console.log(updateResp);

					res.setHeader("content-type", "application/json");
					res.status(200).send(updateResp);
				}
				catch (e) {
					console.log(e);
					res
						.status(500)
						.send({
							message: "Internal Server Error. Error in Update Token",
						});
				}
			});
		});
		request.end();
	} catch (err) {
		console.log(err);
		res
			.status(500)
			.send({
				message: "Internal Server Error. Please try again after sometime.",
			});
	}

})


app.post("/getVoucher", async (req, res) => {
	try {
		let urlPath = '/api/v2/firstsolution/ticket-booking/report/All_Vouchers' +
			`?criteria=%28Voucher%3D%3D%22${req.query.coupon_name}%22%29%26%26%28Status%3D%3D%22Active%22%29`;

		const options = {
			hostname: ZCHOST,
			method: "GET",
			path: urlPath,
			headers: {
				Authorization: `Zoho-oauthtoken ${req.query.access_token}`
			}
		};

		var data = "";
		const request = http.request(options, function (response) {
			response.on("data", function (chunk) {
				data += chunk;
			});

			response.on("end", function () {
				console.log(response.statusCode);
				res.setHeader("content-type", "application/json");
				res.status(200).send(data);
			});
		});
		request.end();
	} catch (err) {
		console.log(err);
		res
			.status(500)
			.send({
				message: "Internal Server Error. Please try again after sometime.",
			});
	}
})

app.post("/submitTicket", async (req, res) => {
	try {
		let urlPath = '/api/v2/firstsolution/ticket-booking/form/Ticket_Booking';

		const options = {
			hostname: ZCHOST,
			method: "POST",
			path: urlPath,
			headers: {
				Authorization: `Zoho-oauthtoken ${req.query.access_token}`,
				"Content-Type": "application/json"
			}
		};

		const request = http.request(options, function (response) {
			res.setHeader("content-type", "application/json");
			response.pipe(res);
		});

		request.write(JSON.stringify(req.body));

		request.end();
	} catch (err) {
		console.log(err);
		res
			.status(500)
			.send({
				message: "Internal Server Error. Please try again after sometime.",
			});
	}
})

app.post("/getEvent", async (req, res) => {
	try {
		let urlPath = `/api/v2/firstsolution/ticket-booking/report/Events_Report/${req.query.event_Id}`;

		const options = {
			hostname: ZCHOST,
			method: "GET",
			path: urlPath,
			headers: {
				Authorization: `Zoho-oauthtoken ${req.query.access_token}`
			}
		};

		var data = "";
		const request = http.request(options, function (response) {
			response.on("data", function (chunk) {
				data += chunk;
			});

			response.on("end", function () {
				console.log(response.statusCode);
				res.setHeader("content-type", "application/json");
				res.status(200).send(data);
			});
		});
		request.end();
	} catch (err) {
		console.log(err);
		res
			.status(500)
			.send({
				message: "Internal Server Error. Please try again after sometime.",
			});
	}
})

app.post("/createBankQRCode", async (req, res) => {
	try {
		let urlPath = '/v1/merchant/createQRCode';

		const options = {
			hostname: PAYONHOST,
			method: "POST",
			path: urlPath,
			headers: {
				Authorization: `Basic ${req.query.base_encode}`,
				"Content-Type": "application/json"
			}
		};

		const request = http.request(options, function (response) {
			res.setHeader("content-type", "application/json");
			response.pipe(res);
		});

		request.write(JSON.stringify(req.body));

		request.end();
	} catch (err) {
		console.log(err);
		res
			.status(500)
			.send({
				message: "Internal Server Error. Please try again after sometime.",
			});
	}
})

app.get("/", async (req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write('<h1>Hello from index.js<h1>');
})

app.post("/getVouchers", async (req, res) => {
	try {
		let urlPath = `/api/v2/firstsolution/ticket-booking/report/All_Vouchers` +
			`?criteria=%28Status%3D%3D%22Active%22%29%26%26%28Event_lookup%3D%3D${req.query.eventId}%29`;

		const options = {
			hostname: ZCHOST,
			method: "GET",
			path: urlPath,
			headers: {
				Authorization: `Zoho-oauthtoken ${req.query.access_token}`
			}
		};

		var data = "";
		const request = http.request(options, function (response) {
			response.on("data", function (chunk) {
				data += chunk;
			});

			response.on("end", function () {
				console.log(response.statusCode);
				res.setHeader("content-type", "application/json");
				res.status(200).send(data);
			});
		});
		request.end();
	} catch (err) {
		console.log(err);
		res
			.status(500)
			.send({
				message: "Internal Server Error. Please try again after sometime.",
			});
	}
})

app.post("/getPayon", async (req, res) => {
	try {
		let urlPath = `/api/v2/firstsolution/ticket-booking/report/Payon_Report/${req.query.payon_Id}`;

		const options = {
			hostname: ZCHOST,
			method: "GET",
			path: urlPath,
			headers: {
				Authorization: `Zoho-oauthtoken ${req.query.access_token}`
			}
		};

		var data = "";
		const request = http.request(options, function (response) {
			response.on("data", function (chunk) {
				data += chunk;
			});

			response.on("end", function () {
				console.log(response.statusCode);
				res.setHeader("content-type", "application/json");
				res.status(200).send(data);
			});
		});
		request.end();
	} catch (err) {
		console.log(err);
		res
			.status(500)
			.send({
				message: "Internal Server Error. Please try again after sometime.",
			});
	}
})

app.post("/submitErrorLog", async (req, res) => {
	try {
		let urlPath = '/api/v2/firstsolution/ticket-booking/form/Error_logs';

		const options = {
			hostname: ZCHOST,
			method: "POST",
			path: urlPath,
			headers: {
				Authorization: `Zoho-oauthtoken ${req.query.access_token}`,
				"Content-Type": "application/json"
			}
		};

		const request = http.request(options, function (response) {
			res.setHeader("content-type", "application/json");
			response.pipe(res);
		});

		request.write(JSON.stringify(req.body));

		request.end();
	} catch (err) {
		console.log(err);
		res
			.status(500)
			.send({
				message: "Internal Server Error. Please try again after sometime.",
			});
	}
})

module.exports = app;
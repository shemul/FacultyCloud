/**
 * Module dependencies.
 */
var result;
var express = require('express'),
	app = express(),
	routes = require('./routes');

var http = require('http').Server(app),
	bodyParser = require('body-parser'),
	path = require('path');

var mongodbUrl = "mongodb://localhost/cartdb";
var io = require('socket.io')(http);

var mongoose = require('mongoose');
mongoose.connect(mongodbUrl);


// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

//todo init dev only



// mongooes on
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback() {

	// data model
	var dataSchema = mongoose.Schema({
		
		fname: String,
		fdept: String,
		status: String
		
		
	});
	var Data = mongoose.model('cart', dataSchema);

	console.log("Successfully connected to database");


	// Default route
	app.get('/', function(req, res) {

		Data.find({}, function(err, result) {
			if (err) {
				h
				console.log(err);
			}
			else {

				res.render('index', {
					items: result,
					error: ''
				});

			}
		});


	});




	// start socket.io

	io.sockets.on('connection', function(socket) {


		// emit initial data from mongo to client who is currently listening to 'entrance'
		Data.find({}, function(err, result) {
			if (err) {
				console.log(err);
			}
			else {

				socket.emit('entrance', result);

			}
		});



		// Lisen from client emmited for data 
		socket.on('client', function(msg) {

			//console.log("msg");

			var newData = new Data({
				fname: msg.fname,
				fdept: msg.fdept,
				status: msg.status

			});

			newData.save(function(err, newData) {
				if (err) {
					console.log(err);
				}

				//console.log(newData);
				io.emit('item', {
					msg: newData
				}); // broadcast item.
				console.log("1 row inserted.");


			});


		});



		// Insert New item to data and socket
		app.post('/add', function(req, res) {

			var things = req.body;
			var name = req.body.name;
			var price = req.body.price;
			var qty = req.body.qty;

			var letters = /^[A-Za-z]+$/;
			var numbers = /^[0-9]+$/;


			// data 
			var newData = new Data({
				fname: name,
				fdept: price,
				status: qty

			});
			newData.save(function(err, newData) {
				if (err) {
					res.sendStatus(300, {
						'error': 'An error has occurred'
					});
				}

				socket.broadcast.emit('item', {
					msg: newData
				}); // broadcast item.
				console.log("1 row inserted.");
				res.sendStatus(200);

			});


		});

		// remove a data and socketing
		app.get('/:id', function(req, res) {
			var id = req.params.id;


			//remove from database mongoose
			Data.remove({
				"_id": id
			}, function(err, result) {
				if (err) {
					console.log(err);
				}
				else {
					console.log('' + result + ' row deleted');
					socket.broadcast.emit('id', {
						id: id
					}); // broadcast id 
					res.sendStatus(200);
				}
			});

		});

		// update a data and socketing
		app.post('/edit/:id', function(req, res) {


			var things = req.body;
			var id = req.body.hide;

			var name = req.body.name;
			var price = req.body.price;
			var qty = req.body.qty;

			// update database mongoose
			Data.update({
				"_id": id
			}, {
				"fname": name,
				"fdept": price,
				"status": qty
			}, function(err, result) {
				if (err) {
					res.sendStatus(300, {
						'error': 'An error has occurred'
					});
				}
				else {

					console.log("1 row updated");
					Data.find({
						"_id": id
					}, function(err, result) {


						socket.broadcast.emit('update', {
							item: [result]
						});
					})

				}

				res.sendStatus(200);


			});

		});

	});

});


http.listen(process.env.PORT, function() {
	console.log(process.env.PORT);
	var db = mongoose.connection;
});

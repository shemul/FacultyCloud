/**
 * Module dependencies.
 */
var result;
var cors = require('cors')

var express = require('express'),
	app = express(),
	routes = require('./routes'),
	errorHandler = require('express-error-handler');

var http = require('http').Server(app),
	bodyParser = require('body-parser'),
	path = require('path');

var mongodbUrl = "mongodb://localhost/facultyCloud";
var io = require('socket.io')(http);


app.use(cors());


var mongoose = require('mongoose');
mongoose.connect(mongodbUrl);
var colors = require('colors');

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

//todo init dev only

if ('development' == app.get('env')) {
  app.use(errorHandler());
}



// Matching TSF with Current time

//var currentDay = d.getDay();
//var currentTime ="01/01/2011" + " " + d.getHours() + ":" + d.getMinutes()+":" +d.getSeconds();
//var currentDay =0;
//var currentTime ="01/01/2011" + " " + "11" + ":" + "05"+":" +"00";

function MatchTime(tsf) {
	//console.log(tsf.length);
	var currentTSF;
	var flag = false ;
	var d = new Date();
	//var currentTime ="01/01/2011" + " " + "14" + ":" + "40"+":" +"00";
	var currentDay = d.getDay();
	var currentTime ="01/01/2011" + " " + d.getHours() + ":" + d.getMinutes()+":" +d.getSeconds();
	//var currentDay =1;
	
	for ( i =0 ; i < tsf.length; i++) {
		
		//console.log(i);
		
		var schedules_start_s = "01/01/2011" + " " + tsf[i].schedules_start+":00";
		var schedules_end_s = "01/01/2011" + " " + tsf[i].schedules_end+":00";
		
		
		if(currentDay==tsf[i].schedules_day) {
			
			//console.log(currentTime) ;
			//console.log(schedules_start_s);
			
			
			if(Date.parse(currentTime) >= Date.parse(schedules_start_s) && Date.parse(currentTime) < Date.parse(schedules_end_s)) {
				
					//console.log(tsf[i].schedules_name);
					
					try {
						 currentTSF = {
							currentCourse : tsf[i].schedules_name,
							currentCourseEnd : tsf[i].schedules_end,
							currentCourseRoom : tsf[i].schedules_room,
							nextCourseTime : tsf[i+1].schedules_start
						}
					} catch(err) {
						//console.log("Faculty has no next schedule today");
						 currentTSF = {
							currentCourse : tsf[i].schedules_name,
							currentCourseEnd : tsf[i].schedules_end,
							currentCourseRoom : tsf[i].schedules_room,
							nextCourseTime : "Bye"
						}
					}
					
					
					flag = true;
					break;
			} else {
				flag = false;
			}
		} else {
			flag = false;
		}
		
	
		
	}
	
	if(flag) {
		return currentTSF;
	} else {
		return 1 ;
	}
	
}


var FULL_TSF ;
var Data ;





// mongooes on
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback() {

	// data model
	var dataSchema = mongoose.Schema({
		f_id : String , 
		f_name : String ,
		f_dept : String ,
		f_email: String,
		f_phone : String,
		f_room : String ,
		f_others : [Number] ,
		f_ssid : String ,
		f_own_mac : String ,
		f_imei : String ,
		f_profile_pic : String,

	
		f_status : String ,
		serial : String,
		full_tsf : Array,
		auto_flag: Number
	});
	
	
	Data = mongoose.model('faculty', dataSchema);
	console.log("Successfully connected to Database Server".bold.blue);


	// Default route
	// the main route for web , as we don't need any web request .. 
	/*
	app.get('/', function(req, res) {

		Data.find({}, function(err, result) {
			if (err) {
				
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
	*/
	
	var auto_bot_timer = false ;
	var auto_bot_interval = 20000 ;
	
	io.sockets.on('connection', function(socket) {
	var auto_status_flag = 1 ;
	
	function fetStatus() {
			
			//console.log("Checking status again");
			
			Data.find({}, function(err, result) {
			if (err) {
				console.log(err);
			}
			else {
				
				for (var i = 0; i < result.length; i++) {
					//console.log(i);
					if(result[i].auto_flag==1) {
						//console.log(result[i].full_tsf);
						
						var currentTSF = 	MatchTime(result[i].full_tsf);
						
						var _id = result[i]._id;
						var f_ip = result[i].f_ssid;
						
						var room = currentTSF.currentCourseRoom;
						var nextSchedule = currentTSF.nextCourseTime;
						var facultyName = result[i].f_name;
						var courseName = currentTSF.currentCourse ;
						
						console.log(facultyName + " - " + currentTSF.currentCourse);
						
						 if(currentTSF!==1) {
						
						 	//console.log(facultyName + " is now at " + room);
						 	
						 	var newStatus = {
						 		"_id" : _id,
						 		"courseName" : courseName,
						 		"f_status" : "IN CLASS", 
						 		"f_room" : room,
						 		"next_scheule" : nextSchedule,
						 		"f_ip" : f_ip
						 	}
							socket.broadcast.emit('updateStatus', {
									item: [newStatus]
							});
							
						 }  else {
						 	console.log("else");
						 
						 }
					} else {
						//console.log("manual status");
					}
				}
			
			}
			
			});
				
				
	  		
	
	
					
	}
	
	
	if(!auto_bot_timer){
		console.log("Auto bot is starting");
		setInterval(fetStatus, auto_bot_interval);
		auto_bot_timer = true;
	}
	

	
	
	
	// Default route
	app.get('/api', function(req, res) {

		Data.find({}, function(err, result) {
			if (err) {
				
				console.log(err);
			}
			
			res.json(result);

		});


	});


		
		
	// start socket.io

	
		
		var isFaculty_id  ;;
		console.log("A client has been connected".bold.green);
	
		// emit initial data from mongo to client who is currently listening to 'entrance'
		Data.find({}, function(err, result) {
			if (err) {
				console.log(err);
			}
			else {
			
				// for (var i = 0; i < result.length; i++) {
				// 	var course = 	MatchTime(result[i].full_tsf);
					
				// 	if(course!=1) {
				// 		var current_course = {
				// 			"now_at" : course
				// 		}
				// 		result[i].f_status =course;
					
				// 	} 
				// }
				
			
				
				socket.emit('entrance', result);
				
			}
		});

	

		socket.on('disconnect', function () {
			if(isFaculty_id) {
				console.log("Faculty Disconnected , auto status set to Gone".bold.red);
						Data.update({
						"_id": isFaculty_id
					}, {
		
						"f_status" : "Gone"
					
					},
					function(err, result) {
						if (err) {
							console.log("Error occered while updating data " + err);
						}
						else {
				
							console.log("Faculty status has been updated".bold.magenta);
							Data.find({
								"_id": isFaculty_id
							}, function(err, result) {
								socket.broadcast.emit('update', {
									item: [result]
								});
							})
				
						}
					});
					}
			
		});
		
		
		// Android Version
		socket.on("android", function(data) {
			
				console.log("Device IMEI is : " + data);

				Data.find({"f_imei": data }, function(err, result) {
					if (err) {
						console.log(err);
					}
					else {
						
						// for (var i = 0; i < result.length; i++) {
							
						// 	//result[i].full_tsf
						// 	var course = 	MatchTime(result[i].full_tsf);
						// 	if(course!=1) {
						// 		var current_course = {
						// 			"now_at" : course
						// 		}
						// 		result[i].f_status =course;
							
						// 	} 
						// }
						socket.emit('android_socket', result);
					}
				}).sort({f_others : 1});
				
				
				
			
			
		});
		
		
		socket.on("facultyMode", function(data) {
			
			isFaculty_id = data;
			
		
		});
		
	
		
		
		
		socket.on("pc_client", function(data) {
			
			console.log(data);
			console.log(data._id);
			console.log(data.f_status);
			
			Data.update({
				"_id": data._id
			}, {

				"f_status" : data.f_status,
				"auto_flag" : data.auto_flag
			
			},
			function(err, result) {
				if (err) {
					console.log("Error occered while updating data " + err);
				}
				else {
		
					console.log("Faculty status has been updated".bold.magenta);
					Data.find({
						"_id": data._id
					}, function(err, result) {
						socket.broadcast.emit('update', {
							item: [result]
						});
					})
		
				}
			});
		
		});
		
		// Lisen from client emmited for data 
		socket.on('addFaculty', function(data) {

			console.log(data);

			var newData = new Data({
				
					f_id : 		data.f_id , 
					f_name : 	data.f_name ,
					f_dept : 	data.f_dept,
					f_email: 	data.f_email,
					f_phone : 	data.f_phone,
					f_room : 	data.f_room,
					f_others : 	data.f_others,
					f_ssid : 	data.f_dev_base_mac ,
					f_own_mac : data.f_dev_mac,
					f_imei : 	data.f_dev_imei,
					f_profile_pic : data.f_profile_pic_s,
				
					f_status : 	"Undefined" ,
					full_tsf : 	data.full_sch,
					auto_flag : data.auto_flag

			});

			newData.save(function(err, newData) {
				if (err) {
					console.log(err);
				}

				//console.log(newData);
				io.emit('item', {
					msg: newData
				}); // broadcast item.
				console.log("A Faculty has been added".bold.green);


			});


		});
		
				// Lisen from client emmited for data 
		socket.on('updateFaculty', function(data) {

			console.log(data);
		
			Data.update({
			"_id": data._id
			}, {
				"f_id": 		data.f_id,
				"f_name":		data.f_name ,
				"f_dept":		data.f_dept,
				"f_email" : 	data.f_email,
				"f_phone" : 	data.f_phone ,
				"f_type" :		data.f_type,
				"f_campus" :	data.f_campus,
				"f_floor" : 	data.f_floor,
				"f_room" : data.f_room,
				"f_others" : data.f_others,
				"f_ssid" : data.f_dev_base_mac,
				"f_own_mac" : data.f_dev_mac,
				"f_imei" : data.f_dev_imei ,
				"f_sch_name" : data.f_sch_name,
				"f_sch_day" : data.f_sch_day,
				"f_sch_start" : data.f_sch_start,
				"f_sch_end" : data.f_sch_end,
				"f_status" : data.f_status,
				"full_tsf" : data.full_sch,
				"auto_flag" : data.auto_flag
				
				
			
			},
			function(err, result) {
				if (err) {
					console.log("Error occered while updating data " + err);
				}
				else {
					auto_status_flag = data.auto_flag;
					if(data.auto_flag ==0) {
						console.log("An information has been Updated".bold.magenta);
					} else {
						console.log("An information has been Updated and Set to TSF Status ".bold.magenta);
					}
					Data.find({
						"_id": data._id
					}, function(err, result) {
						socket.broadcast.emit('update', {
							item: [result]
						});
					})
		
				}
			});


		});
		
		socket.on("change_auto_bot_interval" , function (data) {
			
			
			auto_bot_interval = data;
			console.log("Auto bot timer changed " + auto_bot_interval);
		})
		
		
		socket.on("reload_app" , function (data) {
			
			console.log("Forcing to reboot all sheilds");
			socket.broadcast.emit('reload_app', "Forcing to reboot all sheilds"); // broadcast id 
		})
		
		socket.on("get_sheilds" , function (data) {
			console.log("Asking for all distinct sheilds IMEI");
			Data.distinct(
				"f_imei", function(err, result) {
					socket.emit('get_sheild', {
						item: [result]
					});
			})
		})
		
		
		socket.on("ask_battery_status" , function (data) {
			socket.broadcast.emit('ask_me_for_battery', "From Server"); // broadcast id 
			
		})
		
		socket.on("here_the_battey_status" , function (data) {
			socket.broadcast.emit('here_you_go_battery', data);
		})
		
	
		socket.on("removeFaculty" , function (data) {
			
			console.log("delete");
			console.log(data);
			var id = data._id;


			//remove from database mongoose
			Data.remove({
				"_id": id
			}, function(err, result) {
				if (err) {
					console.log(err);
				}
				else {
					console.log('' + result + ' information has been removed'.bold.red);
					socket.broadcast.emit('removeThis', {
						id: id
					}); // broadcast id 
					
				}
			});
		})

		// Insert New item to data and socket
		
		app.post('/add', function(req, res) {

			var things = req.body;
			var fa_id = req.body.f_id;
			var fa_name = req.body.f_name;
			var fa_dept = req.body.f_dept;
			
		
			var fa_email = req.body.f_email;
			var fa_phone = req.body.f_phone;
			
			var fa_type = req.body.f_type;
			var fa_campus = req.body.f_campus;
			var fa_floor = req.body.f_floor;
			var fa_room = req.body.f_room;
			var fa_others = req.body.f_others;
			var fa_ssid = req.body.f_ssid;
			var fa_own_mac =req.body.f_own_mac;
			var fa_imei = req.body.f_imei;
			
			var fa_sch_name = req.body.f_sch_name;
			var fa_sch_day = req.body.f_sch_day;
			var fa_sch_start = req.body.f_sch_start;
			var fa_sch_end = req.body.f_sch_end;
		
			var fa_status = req.body.f_status;
			

			var letters = /^[A-Za-z]+$/;
			var numbers = /^[0-9]+$/;


			// data 
			var newData = new Data({
				
					f_id : 		fa_id , 
					f_name : 	fa_name ,
					f_dept : 	fa_dept,
					f_email: 	fa_email,
					f_phone : 	fa_phone,
					
					f_type : 	fa_type ,
					f_campus : 	fa_campus ,
					f_floor :	fa_floor ,
					f_room : 	fa_room,
					f_others : 	fa_others ,
					f_ssid : 	fa_ssid ,
					f_own_mac : fa_own_mac ,
					f_imei : 	fa_imei ,
					
					f_sch_name : 	fa_sch_name ,
					f_sch_day : 	fa_sch_day,
					f_sch_start : 	fa_sch_start,
					f_sch_end : 	fa_sch_end ,
				
					f_status : fa_status 

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
					socket.broadcast.emit('removeThis', {
						id: id
					}); // broadcast id 
					res.sendStatus(200);
				}
			});

		});


	
		// update a data and socketing
		app.post('/edit/:id', function(req, res) {

			console.log("I am in edit mode");
			console.log(req.body);
			var things = req.body;
			var id = req.body.hide;

			var f_id_u = req.body.f_id_e;
			console.log(f_id_u);
			var f_name_u = req.body.f_name_e;
			var f_dept_u = req.body.f_dept_e;
			var f_imei_u = req.body.f_imei_e;
			var f_ssid_u = req.body.f_ssid_e;
			var f_email_u = req.body.f_email_e;
			var f_routine_u = req.body.f_routine_e;
			var f_status_u = req.body.f_status_e;
			//console.log(f_dept_u);

			// update database mongoose
			Data.update({
				"_id": id
			}, {
				"f_id": f_id_u,
				"f_name": f_name_u ,
				"f_dept": f_dept_u,
				"f_imei" : f_imei_u,
				"f_ssid" : f_ssid_u ,
				"f_email" : f_email_u,
				"f_routine" : f_routine_u,
				"f_status" : f_status_u
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

var app = require('express')();
var http = require('http').Server(app);

var mongodbUrl = "mongodb://localhost/carts";
var io = require('socket.io')(http);


var mongoose = require('mongoose');
mongoose.connect(mongodbUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));



db.once('open', function callback() {
    
    var dataSchema = mongoose.Schema({
        status: String,
    });
    var Data = mongoose.model('data', dataSchema);
    
    console.log("Successfully connected to database");
    
    
    
    app.get('/', function(req, res){
      res.sendFile(__dirname + '/index.html');
    });
    
        
    io.on('connection', function(socket){
    
      //socket.broadcast.emit('hi');
      
      Data.find({}, function (err, result) {
              if (err) {
                  console.log(err);
              } else {
                 
                  socket.broadcast.emit('chat message', result );
              }
      });
          
      socket.on('chat message', function(msg){
        
          var newData = new Data({status: msg});
          newData.save();
          
          var objMsg = [
            { status :msg}
          ]
          
          
         
          io.emit('chat message' , objMsg);    
          
                
      });
      
      socket.on('disconnect', function(){
        io.emit('chat message','someone has left the conversation');
      });
      
      
      
    });

});


http.listen(process.env.PORT, function(){
  console.log(process.env.PORT);
});

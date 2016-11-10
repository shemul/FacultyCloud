// JavaScript Document

//call this function when click on remove link  
function removeData(val){
	var parent = val.parentNode.parentNode;	
	var id = parent.id;
	
	$.ajax({
		url: "/"+id,
		type: "GET", 
			/*success: function(){ 
			//console.log("data : "+ data );
			//total();
		}*/
	});
	
}

//call this function when click on edit link  
function editData(val){
	var parent = val.parentNode.parentNode;	
	var id = parent.id;
	
	$(document).ready(function(e) {
		$('.addT').css("display","none");
		$('.updateT').css("display","block");
		
		   
	
		$('#f_id_e').val( $("tr#"+id+" td.f_id_t").text() );
		$('#f_name_e').val( $("tr#"+id+" td.f_name_t").text() );
	//	console.log( $("tr#"+id+" td.f_dept_t").text());
		$('#f_dept_e').val("2");
		$('#f_imei_e').val( $("tr#"+id+" td.f_imei_t").text() );
		$('#f_ssid_e').val( $("tr#"+id+" td.f_ssid_t").text() );
		$('#f_email_e').val( $("tr#"+id+" td.f_email_t").text() );
		
		$('#f_phone_e').val( $("tr#"+id+" td.f_phone_t").text() );
		$('#f_type_e').val( $("tr#"+id+" td.f_type_t").text() );
		$('#f_campus_e').val( $("tr#"+id+" td.f_campus_t").text() );
		$('#f_floor_e').val( $("tr#"+id+" td.f_floor_t").text() );
		
		$('#f_room_e').val( $("tr#"+id+" td.f_room_t").text() );
		$('#f_others_e').val( $("tr#"+id+" td.f_others_t").text() );
		$('#f_own_mac_e').val( $("tr#"+id+" td.f_own_mac_t").text() );
		$('#f_sch_name_e').val( $("tr#"+id+" td.f_sch_name_t").text() );
		
		$('#f_sch_day_e').val( $("tr#"+id+" td.f_sch_day_t").text() );
		$('#f_sch_start_e').val( $("tr#"+id+" td.f_sch_start_t").text() );
		$('#f_sch_end_e').val( $("tr#"+id+" td.f_sch_end_t").text() );
		
		
		$('#f_status_e').val( $("tr#"+id+" td.f_status_t").text() );
		$('#hide').val(id);
		
	});
	
}

$(document).ready(function(e) {
	
	var socket = io.connect(); // socket connection 
	
	// calculate total price of all items
	function total(){	
		var length = $(".container tr").length;		
		var i,total = 0;
		
		for(i=1;i<=length+1;i++){
			
			var price = $(".container tr:nth-child("+i+") td.price").text();
			var qty = $(".container tr:nth-child("+i+") td.qty").text();
			total = total + Number(price)*Number(qty);			 	
		}
		
		$("div.total").text("Total Hour:"+total);				
	}
	
	// get item data from socket
	socket.on('item', function (data) {
		var items = data.msg;
			//console.log(items.fname);
			var i =0;
			// append item into table
			$(".container").append("<tr id='"+items._id+
			"'><td class='name'>"+items.f_id+"</td><td class='price'>"+
			items.f_name+"</td><td class='qty'>"+items.f_dept+
			"</td><td class='qty'>"+items.f_status+
			"</td>"+
			"</td><td><a href='#' onclick='removeData(this)' data="+
			items._id+" class='btnRemove'>Remove</a></td><td><a i="+i+
			" data="+items._id+" href='#' onclick='editData(this)'>Edit</a></td></tr>");
			
			//total();	
		});
	
   // get updated item data from socket
   socket.on('update', function (data) {
		
		
		   	var item = data.item;
		   	var obj = item[0];
		   	var id = obj[0]._id;
	   	
	   	
			// change item details from table
			$("tr#"+id+" td.f_id_t").text(obj[0].f_id);
			$("tr#"+id+" td.f_name_t").text(obj[0].f_name);
			$("tr#"+id+" td.f_dept_t").text(obj[0].f_dept); 
			$("tr#"+id+" td.f_imei_t").text(obj[0].f_imei);
			$("tr#"+id+" td.f_ssid_t").text(obj[0].f_ssid);
			$("tr#"+id+" td.f_email_t").text(obj[0].f_email); 
			$("tr#"+id+" td.f_routine_t").text(obj[0].f_routine);
			$("tr#"+id+" td.f_status_t").text(obj[0].f_status);
		 
		total();
		
	});
   
   // get id from socket	
   socket.on('removeThis', function (data) {
   	var id = data.id;
	   $("tr#"+id).remove(); // remove table row for this item id 
	   
	   total();
	});   
   
	//call this function when click on add button 
	$('#add').click(function(e) {
		var formData = $('#form1').serialize(); // retrieve submited data from form.
		$.post('/add',formData,function(data){
			if(data){
				console.log("testing..");
			}
			else{				
				  alert("Enter Value In Proper Format."); // show alert box if respose is false
				}
			});
	});
	
	//call this function when click on update button 
	$('#update').click(function(e) {
		
	
		var id = $('#hide').attr("value");
		$('.addT').css("display","block");
		$('.updateT').css("display","none");
		var formData = $('#form2').serialize();  // retrieve submited data from form.
		$.post("/edit/"+id ,formData,function(data){
			if(data){
			}
			else{
				  alert("Enter Value In Proper Format.");	// show alert box if respose is false
				}
			});
		
	});
	
	//call this function when click on cancel button 
	$('#cancel').click(function(e) {
		$('.addT').css("display","block");
		$('.updateT').css("display","none");			
	});
	
});
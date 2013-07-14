// JavaScript Document

var itemId = Array();
var photo = Array();
var photoIndex = Array();

function getDatabase() {
	return window.openDatabase("shopper", "", "Shopper", 1000000);	
}

function createDatabase(db,callback) {
	var populateDatabase = function (tx) {
		debugWrite("populateDatabase",'start');
		var count = 0;
		
		var queries = Array(
			"CREATE TABLE IF NOT EXISTS product (product_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,product_title VARCHAR(255),product_price DECIMAL(18,2),product_qty INTEGER)",
			"CREATE TABLE IF NOT EXISTS product_photo (product_id INTEGER,full_path VARCHAR(255))"
		);
		
		var successCreate = function (tx,results) {
			if(++count == queries.length) {
				callback(db);
			}
		}
		
		queries.forEach(function(value,index) {
			tx.executeSql(value,[],successCreate,StatementErrorCallback);
		});
		
		debugWrite("populateDatabase",'end');
	}

	db.transaction(populateDatabase, TransactionErrorCallback);
}


function toggleMainMenu() { $("#mainmenu").toggle(); }
function hideMainMenu() { $("#mainmenu").hide(); }
function priceFormat(value) {
	var dollars = parseInt(value*1);
	var cents = parseInt((value*100)%100);
	if (cents == 0) {
		cents = "00";
	} else if (cents<10) {
		cents = "0"+cents;
	}
	return dollars+"."+cents;
}
function setGrandTotal(value) { 
	$(".grand-total").text(priceFormat(value));
}
function refreshGrandTotal() {
	var total = 0;
	$(".page").each(function() {
		var price = $(this).find("#product-price").val();
		var qty = $(this).find("#product-qty").val();
		total += price*parseInt(qty);
	});
	setGrandTotal(total);
}
function buildSummary() {
	var totalProducts = 0;
	var totalItems = 0;
	var grandTotal = 0;
	$(".page").each(function() {
		var price = $(this).find("#product-price").val();
		var qty = $(this).find("#product-qty").val();
		totalProducts++;
		totalItems += parseInt(qty);
		grandTotal += price*parseInt(qty);
	});
	$("#total-products").val(totalProducts);
	$("#total-items").val(totalItems);
	$("#grand-total").val(priceFormat(grandTotal));
}
function parseText(page, text) {
	var item = $("#"+page.attr("id"), ".items");
	var regexp =/\d+([\s,.]\d{3})*[\s,.=-]\d{2}/;
	var price = regexp.exec(text)[0];
	price = price.split(",").join("");
	price = price.split(".").join("");
	price = price.split("-").join("");
	price = price.split("=").join("");
	price = price.split(" ").join("");
	price = price.substr(0, price.length-2)+"."+price.substr(price.length-2,2);
	page.find("#product-title").val(text);
	page.find("#product-price").val(price);
	page.find("#item-title").text(text);
}
function addItem() {
	var table = "product";
	var id = ""+table+"-"+itemId.length;
	var itemData = itemId.length;
	var item = $(".item-template").clone();
	var page = $(".page-template").clone();
	item.prependTo(".items").removeClass("item-template").addClass("item"); 
	page.appendTo("body").removeClass("page-template").addClass("page");
	page.attr("data-role","page");
	page.find("[data-role='none']").removeAttr("data-role");
	item.find("[data-role='none']").removeAttr("data-role");
	item.attr("id",id);
	page.attr("id",id);
	item.find("a").attr("href","#"+id);
	page.find("a").attr("href","#"+"main");
	item.jqmData("data",itemData);
	page.jqmData("data",itemData);
	itemId.push(-1);
	photo.push(Array());
	photoIndex.push(-1);
	$(".items").listview("refresh");

	page.on("vclick", ".product-image img", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		$("#fullScreen img").attr("src",$(this).attr("src"));
		$.mobile.changePage("#fullScreen");
		return false;
	});
	page.on("vclick", ".plus-one", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var qty = $(this).parents(".page").find("#product-qty");
		$(qty).val(parseInt($(qty).val())+1);
		refreshGrandTotal();
		return false;
	});
	page.on("vclick", ".save", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		debugWrite("id",id);

		var db = getDatabase();
		saveItem(db,id,function(db) {
			item.removeClass("changed").removeClass("new");
			page.removeClass("changed").removeClass("new");
			$(".items").listview("refresh");
		});

		var title = page.find("#product-title").val();
		var price = page.find("#product-price").val();
		var qty = page.find("#product-qty").val();
		item.find("#item-title").text(title);
		item.find("#item-price").text(priceFormat(price));
		item.find("#item-qty").text(parseInt(qty));
		item.find("#item-total").text(priceFormat(price*parseInt(qty)));
		$(".items").listview("refresh");
		refreshGrandTotal();
		$.mobile.changePage("#main");
		return false;
	});
	page.on("vclick", ".delete", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		debugWrite("id",id);
		
		var pageHideReadyDeferred = $.Deferred();
		var pageDeleteReadyDeferred = $.Deferred();
		
		$.when(pageHideReadyDeferred, pageDeleteReadyDeferred).then(function() {
			page.remove();
			item.remove();
			$(".items").listview("refresh");
			refreshGrandTotal();
		});

		$(page).bind('pagehide', function(events, ui) {
			pageHideReadyDeferred.resolve();
		});
		
		var db = getDatabase();
		deleteItem(db,id,function(db) {
			pageDeleteReadyDeferred.resolve();
		});

		$.mobile.changePage("#main");
		return false;
	});
	page.on("vclick", ".prev-image", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		var itemData = item.jqmData("data");
		var itemImage = item.find("img#item-image");
		var pageImage = page.find("img#product-image");
		debugWrite("vclick",".prev-image");
		debugWrite("id",id);
		if(photo[itemData].length) {
			photoIndex[itemData]--; if (photoIndex[itemData]<0) photoIndex[itemData] = 0;
			loadImage(itemImage,photo[itemData][photoIndex[itemData]]);
			loadImage(pageImage,photo[itemData][photoIndex[itemData]]);
		}
		return false;
	});
	page.on("vclick", ".next-image", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		var itemData = item.jqmData("data");
		var itemImage = item.find("img#item-image");
		var pageImage = page.find("img#product-image");
		debugWrite("vclick",".next-image");
		debugWrite("id",id);
		if(photo[itemData].length) {
			photoIndex[itemData]++; if (photoIndex[itemData]>photo[itemData].length-1) photoIndex[itemData] = photo[itemData].length-1;
			loadImage(itemImage,photo[itemData][photoIndex[itemData]]);
			loadImage(pageImage,photo[itemData][photoIndex[itemData]]);
		}
		return false;
	});
	page.on("change", "#product-title", function(event) {
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		item.find("#item-title").text($(this).val());
	});
	page.on("change", "#product-price,#product-qty", function(event) {
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		var price = page.find("#product-price").val();
		var qty = page.find("#product-qty").val();
		item.find("#item-price").text(priceFormat(price));
		item.find("#item-qty").text(parseInt(qty));
		item.find("#item-total").text(priceFormat(price*parseInt(qty)));
		refreshGrandTotal();
	});

	page.on("vclick", ".take-barcode", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		// capture callback
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		var itemData = item.jqmData("data");
		debugWrite("vclick",".take-barcode");
		debugWrite("id",id);

		window.plugins.barcodeScanner.scan( function(result) {
				debugWrite("We got a barcode");
				debugWrite("Result: " , result.text);
				debugWrite("Format: " , result.format);
				debugWrite("Cancelled: " , result.cancelled);
				parseText(page,result.text);
				refreshGrandTotal();
			}, function(error) {
				debugWrite("Scanning failed: " , error);
				navigator.notification.alert('Error code: ' + error.code, null, 'Scanning failed');
			}
		);
		return false;
	});
	
	page.on("vclick", ".take-photo", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		// capture callback
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		var itemData = item.jqmData("data");
		var itemImage = item.find("img#item-image");
		var pageImage = page.find("img#product-image");
		debugWrite("vclick",".take-photo");
		debugWrite("id",id);
		debugWrite("itemData",itemData);
		try {
			var captureSuccess = function(photoFiles) {    
				debugWrite("captureSuccess",photoFiles);
				var i, path, len;    
				for (i = 0, len = photoFiles.length; i < len; i += 1) {        
					path = photoFiles[i].fullPath;        // do something interesting with the file  
					debugWrite("path",path);
					photo[itemData].push(path);
				}
				if(photo[itemData].length) {
					photoIndex[itemData] = photo[itemData].length-1;  
					loadImage(itemImage,photo[itemData][photoIndex[itemData]]);
					loadImage(pageImage,photo[itemData][photoIndex[itemData]]);
				}
			};
			// capture error callback
			var captureError = function(error) {  
				debugWrite("captureError",error);
				var msg="";
				switch(error.code) {
					case CaptureError.CAPTURE_INTERNAL_ERR: msg="Camera or microphone failed to capture image or sound."; break;
					case CaptureError.CAPTURE_APPLICATION_BUSY: msg="Camera application or audio capture application is currently serving other capture request."; break;
					case CaptureError.CAPTURE_INVALID_ARGUMENT: msg="Invalid use of the API (e.g. limit parameter has value less than one)."; break;
					case CaptureError.CAPTURE_NO_MEDIA_FILES: msg="User exited camera application or audio capture application before capturing anything."; break;
					case CaptureError.CAPTURE_NOT_SUPPORTED: msg="The requested capture operation is not supported."; break;  
				}
				navigator.notification.alert(msg+'(Error code: ' + error.code+' )', null, 'Capture Error');
			};
			// start image capture
			navigator.device.capture.captureImage(captureSuccess, captureError);
		} catch (e) {
			debugWrite("error",e);
		}
		return false;
	});
	page.on("vclick", ".parse-photo", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var page = $(this).parents(".page");
		var id = page.attr("id");
		var item = $(".item#"+id);
		var itemData = item.jqmData("data");
		var imagePath = photo[itemData][photoIndex[itemData]];
		debugWrite("vclick",".parse-photo");
		debugWrite("id",id);
		
		try {
			loadSettings();
			var serverUrl = $("#ocr-server-url").val();
			var appId = $("#ocr-app-id").val();
			var password = $("#ocr-app-password").val();
			var language = $("#ocr-language").val();
			
			var taskId;
			var status;
			var resultUrl;
						
			var onloadend = function(evt) {
				var imageData = evt.target.result;
				
				$.ajax(serverUrl+"/processImage?language="+language,{
					type:"POST",
					username: appId,
					password: password,
					data: imageData,
					success:function (xml) {
						taskId = $(xml).find("task").attr("id");
						status = $(xml).find("task").attr("status");
						resultUrl = $(xml).find("task").attr("resultUrl");
					},
					error:function() {
						navigator.notification.alert("Error call processImage", null, 'OCRSDK');
					}
				});
				
				var onComplited = function() {
					$.ajax(resultUrl, {
						username: appId,
						password: password,
						success:function (data) {
							debugWrite("data",data);
							parseText(page,data);
							refreshGrandTotal();
						},
						error:function() {
							navigator.notification.alert("Error loading " + resultUrl, null, 'OCRSDK');
						}
					});
				};
				
				var onProcessingFailed = function() {
					navigator.notification.alert("Processing Failed", null, 'OCRSDK');
				};
				
				var onNotEnoughCredits = function() {
					navigator.notification.alert("Not Enough Credits", null, 'OCRSDK');
				};
				
				var waitFunction = function () {
					$.ajax(resultUrl+"/getTaskStatus?taskId="+taskId, {
						username: appId,
						password: password,
						success:function (xml) {
							taskId = $(xml).find("task").attr("id");
							status = $(xml).find("task").attr("status");
							resultUrl = $(xml).find("task").attr("resultUrl");
							if (status == 'Completed') {
								onComplited();
							} else if (status == 'ProcessingFailed') {
								onProcessingFailed();
							} else if (status == 'NotEnoughCredits') {
								onNotEnoughCredits();
							} else {
								setTimeout(waitFunction, 1000);
							}
						},
						error:function() {
							navigator.notification.alert("Error call getTaskStatus", null, 'OCRSDK');
						}
					});
				};
				
				waitFunction();
			};

			var createReader = function (readable) {
				var reader = new FileReader();
				reader.onloadend = onloadend;
				reader.readAsBinaryString(readable);
			};    
			var gotFileEntry = function (fileEntry) {
    			fileEntry.file(createReader, fail);
			};
			var gotFS = function (fileSystem) {
		        fileSystem.root.getFile(imagePath, {exclusive: false}, gotFileEntry, fail);
		    };    
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
					
		} catch (e) {
			debugWrite("error",e);
		}
		return false;
	});
	
	return id;
}

function deleteItem(db,id,callback) {
	var page = $(".page#"+id);
	var item = $(".item#"+id);
	var itemData = item.jqmData("data");
	var count = 0;
	
	var successDelete = function (tx,results) {
		if (++count==2) {
			callback(db);
		}
	}

	var queryDelete = function (tx) {
		tx.executeSql("DELETE FROM product_photo WHERE product_id=?",[itemId[itemData]], successDelete, StatementErrorCallback);
		tx.executeSql("DELETE FROM product WHERE product_id=?",[itemId[itemData]], successDelete, StatementErrorCallback);
	}
	
	db.transaction(queryDelete, TransactionErrorCallback);
}

function deleteAllItems(db,callback) {
	var count = 0;
	
	var successDelete = function (tx,results) {
		if (++count==2) {
			callback(db);
		}
	}

	var queryDelete = function (tx) {
		tx.executeSql("DELETE FROM product_photo",[], successDelete, StatementErrorCallback);
		tx.executeSql("DELETE FROM product",[], successDelete, StatementErrorCallback);
	}
	
	db.transaction(queryDelete, TransactionErrorCallback);
}

function saveItemPhoto(db,id,callback) {
	debugWrite('saveItemPhoto','start');
	var page = $(".page#"+id);
	var item = $(".item#"+id);
	var itemData = item.jqmData("data");
	var count = 0;
	if (count == photo[itemData].length) {
		callback(db);
	}
	photo[itemData].forEach(function(value,index) {
		var queryInsert = function (tx) {
			
			var successInsert = function (tx, results) {
				debugWrite('successInsert','start');
				debugWrite('results',results);
				if (++count == photo[itemData].length) {
					callback(db);
				}
				debugWrite('successInsert','end');
			}
			
			var query =	"INSERT INTO product_photo(product_id,full_path) VALUES (?,?)";
			debugWrite(query,[itemId[itemData],value]);
			tx.executeSql(query,[itemId[itemData],value], successInsert, StatementErrorCallback);
		}
		
		db.transaction(queryInsert, TransactionErrorCallback);
	});
	debugWrite('saveItemPhoto','end');
}

function saveItem(db,id,callback) {
	debugWrite('saveItem','start');
	var page = $(".page#"+id);
	var item = $(".item#"+id);
	var itemData = item.jqmData("data");
	var title = page.find("#product-title").val();
	var price = page.find("#product-price").val();
	var qty = page.find("#product-qty").val();
		
	var productReadyDeferred = $.Deferred();
	var productPhotoReadyDeferred = $.Deferred();
	
	$.when(productReadyDeferred, productPhotoReadyDeferred).then(function() {
		callback(db);
	});

	if (itemId[itemData] == -1) {
		var queryInsert = function (tx) {
			
			var successInsert = function (tx, results) {
				debugWrite('successInsert','start');
				debugWrite('results',results);
				itemId[itemData] = results.insertId;
				productReadyDeferred.resolve();
				saveItemPhoto(db, id, function(db) { productPhotoReadyDeferred.resolve(); } );
				debugWrite('successInsert','end');
			}
				
			var query = "INSERT INTO product(product_title,product_price,product_qty) VALUES (?,?,?)";
			debugWrite(query,[title,price,qty]);
			tx.executeSql(query,[title,price,qty], successInsert, StatementErrorCallback);
		}
		
		db.transaction(queryInsert, TransactionErrorCallback);
	} else {
		var queryUpdate = function (tx) {
			
			var successUpdate = function (tx, results) {
				debugWrite('successUpdate','start');
				debugWrite('results',results);
				productReadyDeferred.resolve();
				debugWrite('successUpdate','end');
			}
			
			var query =	"UPDATE product SET product_title=?,product_price=?,product_qty=? WHERE product_id=?";
			debugWrite(query,[title,price,qty,itemId[itemData]]);
			tx.executeSql(query,[title,price,qty,itemId[itemData]], successUpdate, StatementErrorCallback);
			
			var queryDeletePhoto = function (tx) {
				
				var successDeletePhoto = function (tx, results) {
					debugWrite('successDeletePhoto','start');
					debugWrite('results',results);
					saveItemPhoto(db, id, function(db) { productPhotoReadyDeferred.resolve(); } );
					debugWrite('successDeletePhoto','end');
				}
				
				var query =	"DELETE FROM product_photo WHERE product_id=?";
				debugWrite(query,[itemId[itemData]]);
				tx.executeSql(query,[itemId[itemData]], successDeletePhoto, StatementErrorCallback);
			}
			
			db.transaction(queryDeletePhoto, TransactionErrorCallback);
		}
		
		db.transaction(queryUpdate, TransactionErrorCallback);
	}
	debugWrite('saveItem','end');
}

function getId(id) {
	var table = "product";
	return ""+table+"-"+itemId.indexOf(id);
}

function queryItems(db) {
	debugWrite('queryItems','start');

	var queryPhotoArgs = Array();

	var successPhoto = function (tx, results) {
		var len = results.rows.length;
		for (var i=0; i<len; i++){
			var id = getId(results.rows.item(i).product_id);
			debugWrite('id',id);
			var page = $(".page#"+id);
			var item = $(".item#"+id);
			var itemData = item.jqmData("data");
			var itemImage = item.find("img#item-image");
			var pageImage = page.find("img#product-image");
			photo[itemData].push(results.rows.item(i).full_path);
			photoIndex[itemData] = photo[itemData].length-1;  
			loadImage(itemImage,photo[itemData][photoIndex[itemData]]);
			loadImage(pageImage,photo[itemData][photoIndex[itemData]]);
		}
	}
						
	var queryRecords = function (tx) {
		
		var successRecords = function (tx, results) {
			debugWrite('successRecords','start');
			debugWrite('results',results);
			var len = results.rows.length;
			for (var i=0; i<len; i++){
				var id = addItem();
				var page = $(".page#"+id);
				var item = $(".item#"+id);
				var itemData = item.jqmData("data");
				itemId[itemData] = results.rows.item(i).product_id;
				var title = results.rows.item(i).product_title;
				var price = results.rows.item(i).product_price;
				var qty = results.rows.item(i).product_qty;
				item.find("#item-title").text(title);
				item.find("#item-price").text(priceFormat(price));
				item.find("#item-qty").text(parseInt(qty));
				item.find("#item-total").text(priceFormat(price*parseInt(qty)));
				page.find("#product-title").val(title);
				page.find("#product-price").val(price);
				page.find("#product-qty").val(qty);
			}
			
			$(".items").listview("refresh");
			refreshGrandTotal();
			
			$(".page").each(function() {
				var page = $(this);
				var id = page.attr("id");
				var item = $(".item#"+id);
				var itemData = item.jqmData("data");
		
				var queryPhoto = function (tx) {
					
					var query = "SELECT * FROM product_photo WHERE product_id=?";
					var args = queryPhotoArgs.pop();
					debugWrite(query,args);
					tx.executeSql(query, args, successPhoto, StatementErrorCallback);
				}
				
				queryPhotoArgs.push([itemId[itemData]]);
				db.transaction(queryPhoto, TransactionErrorCallback);
			});
			
			debugWrite('successRecords','end');
		}
		
		var query = "SELECT * FROM product";
		debugWrite(query,[]);
		tx.executeSql(query, [], successRecords, StatementErrorCallback);
	}
				
	db.transaction(queryRecords, TransactionErrorCallback);
		
	debugWrite('queryItems','end');
}

var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();

$.when(deviceReadyDeferred, jqmReadyDeferred).then(function() {
	debugWrite('when(deviceReadyDeferred, jqmReadyDeferred).then','start');
	var db = getDatabase();
	loadSettings();
	queryItems(db);
	debugWrite('when(deviceReadyDeferred, jqmReadyDeferred).then','end');
});

$(document).on( 'pageshow','#settings',function(event){
	debugWrite('pageshow','settings');
	loadSettings();
});
$(document).on( 'pageinit','#settings',function(event){
	debugWrite('pageinit','settings');
	$("#settings .save").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		saveSettings();
		$.mobile.changePage("#main");
	});
	$("#settings .refresh").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		loadSettings();
	});
});
$(document).on( 'pageshow','#summary',function(event){
	debugWrite('pageshow','summary');
	buildSummary();
});
$(document).on( 'pageinit','#summary',function(event){
	debugWrite('pageinit','summary');
});
	
$(document).one( 'pagebeforecreate','#main',function(event){
	debugWrite('pagebeforecreate','main');
});

$(document).on( 'pageshow','#main',function(event){
	hideMainMenu();
});
	
$(document).on( 'pageinit','#main',function(event){
	debugWrite('pageinit','main');

	jqmReadyDeferred.resolve();

	setGrandTotal(0);
		
	$(".mainmenu-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		toggleMainMenu();
		return false;
	});
	$(".addnew-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideMainMenu();
		var id = addItem();
		$.mobile.changePage("#"+id);
		return false;
	});
	$(".refresh-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideMainMenu();
		$(".item").remove();
		$(".page").remove();
		itemId = Array();
		photo = Array();
		photoIndex = Array();
		setGrandTotal(0);
		var db = getDatabase();
		queryItems(db);
		return false;
	});
	$(".reset-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideMainMenu();
		var db = getDatabase();
		deleteAllItems(db,function (db) {
		});
		$(".item").remove();
		$(".page").remove();
		itemId = Array();
		photo = Array();
		photoIndex = Array();
		setGrandTotal(0);
		return false;
	});
});

function fail(error) {        
	debugWrite('Fail',error);
	navigator.notification.alert('Error code: ' + error.code, null, 'Fail');
	return false;
}
function TransactionErrorCallback(error) {
	debugWrite('TransactionErrorCallback',error);
	try {
		navigator.notification.alert(error.message+'('+error.code+')', null, 'Database Error');
	} catch(e) {
		debugWrite('catch error',e);
	}
	return false;
}
function StatementErrorCallback(tx,error) {
	debugWrite('StatementErrorCallback',error);
	try {
		navigator.notification.alert(error.message+'('+error.code+')', null, 'Database Error');
	} catch(e) {
		debugWrite('catch error',e);
	}
	return false;
}

// Wait for Cordova to load
//
document.addEventListener("deviceready", onDeviceReady, false);

// Cordova is ready
//
function onDeviceReady() {
	debugWrite("onDeviceReady","start");
	
	var db = getDatabase();
	debugWrite("db.version",db.version);
	createDatabase(db, function(db) {
		deviceReadyDeferred.resolve();
	});
	document.addEventListener("backbutton", handleBackButton, false);
	debugWrite("onDeviceReady","end");
}

function handleBackButton() {
  	debugWrite("Back Button Pressed!","start");
    navigator.app.exitApp();
  	debugWrite("Back Button Pressed!","end");
}

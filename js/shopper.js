// JavaScript Document

var productId = Array();
var media = Array();
var mediaIndex = Array();

function getDatabase() {

	return window.openDatabase("shopper", "", "Shopper", 1000000);	
}

function createDatabase(db,callback) {
	var populateDatabase = function (tx) {
		console.log("populateDatabase",'start');
		var count = 0;
		var successCreate = function (tx,results) {
			if(++count == 2) {
				callback(db);
			}
		}
		
		tx.executeSql("CREATE TABLE IF NOT EXISTS products (product_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,product_title VARCHAR(255),product_price DECIMAL(18,2),product_qty INTEGER)",[],successCreate,StatementErrorCallback);
		tx.executeSql("CREATE TABLE IF NOT EXISTS media (product_id INTEGER,full_path VARCHAR(255))",[],successCreate,StatementErrorCallback);
		
		console.log("populateDatabase",'end');
	}

	db.transaction(populateDatabase, TransactionErrorCallback);
}


function toggleMainMenu() { $("#mainmenu").toggle(); }
function hideMainMenu() { $("#mainmenu").hide(); }
function hideSettings() { $("#settings").hide(); }
function hideSummary() { $("#summary").hide(); }
function hideItems() { $(".items").hide(); }
function showItems() { $(".items").fadeIn(); }
function showSettings() { $("#settings").fadeIn(); }
function showSummary() { $("#summary").fadeIn(); }
function setGrandTotal(value) { 
	var dollars = parseInt(value);
	var cents = parseInt((value*100)%100);
	if (cents == 0) {
		cents = "00";
	} else if (cents<10) {
		cents = "0"+cents;
	}
	$(".grand-total").text(dollars+"."+cents);
}
function refreshGrandTotal() {
	var total = 0;
	$(".item").each(function() {
		var price = $(this).find("#product-price").get(0);
		var qty = $(this).find("#product-qty").get(0);
		total += $(price).val()*parseInt($(qty).val());
	});
	setGrandTotal(total);
}
function buildSummary() {
	var totalProducts = 0;
	var totalItems = 0;
	var grandTotal = 0;
	$(".item").each(function() {
		var price = $(this).find("#product-price").get(0);
		var qty = $(this).find("#product-qty").get(0);
		totalProducts++;
		totalItems += parseInt($(qty).val());
		grandTotal += $(price).val()*parseInt($(qty).val());
	});
	$("#total-products").val(totalProducts);
	$("#total-items").val(totalItems);
	$("#grand-total").val(grandTotal);
}
function loadSettings() {
	try {
		$("#settings input[type='text'],#settings input[type='password']").each(function() {
			$(this).val(window.localStorage.getItem($(this).attr("id")));
		});
	} catch(e) {
		console.log("error",e);
	}
}
function saveSettings() {
	try {
		$("#settings input[type='text'],#settings input[type='password']").each(function() {
			window.localStorage.setItem($(this).attr("id"),$(this).val());
		});
	} catch(e) {
		console.log("error",e);
	}
}
function parseText(item, text) {
	var regexp =/\d+([\s,.]\d{3})*[\s,.=-]\d{2}/;
	var price = regexp.exec(text)[0];
	price = price.split(",").join("");
	price = price.split(".").join("");
	price = price.split("-").join("");
	price = price.split("=").join("");
	price = price.split(" ").join("");
	price = price.substr(0, price.length-2)+"."+price.substr(price.length-2,2);
	item.find("#product-title").val(text);
	item.find("#product-price").val(price);
	item.find("#item-title .ui-btn-text").text(text);
}
function loadImage(image, imagePath) {
	var createReader = function (readable) {
		var reader = new FileReader();
		reader.onloadend = function (evt) {
			var dataURL = evt.target.result;
			$(image).attr("src",dataURL);
		}
		reader.readAsDataURL(readable);
	};    
	var gotFileEntry = function (fileEntry) {
		fileEntry.file(createReader, fail);
	};
	var gotFS = function (fileSystem) {
		fileSystem.root.getFile(imagePath, {exclusive: false}, gotFileEntry, fail);
	};    
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
}
function addItem() {
	var item = $(".item-template").clone();
	item.prependTo(".items").removeClass("item-template").addClass("item").collapsible({ collapsed: false }); 
	item.data("data",productId.length);
	productId.push(-1);
	media.push(Array());
	mediaIndex.push(-1);

	var itemData = item.data("data");
	var image = $(item.find(".product-image").get(0)).find("img").get(0);
		
	item.on("vclick", "img", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		$(this).toggleFullScreen();
	});
	item.on("vclick", ".plus-one", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var qty = $(this).parents(".item").find("#product-qty");
		$(qty).val(parseInt($(qty).val())+1);
		refreshGrandTotal();
	});
	item.on("vclick", ".delete", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		$(this).parents(".item").remove();
		refreshGrandTotal();
	});
	item.on("vclick", ".prev-image", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var itemData = $(this).parents(".item").data("data");
		var image = $(this).parents(".item").find(".product-image img");
		if(media[itemData].length) {
			mediaIndex[itemData]--; if (mediaIndex[itemData]<0) mediaIndex[itemData] = 0;
			loadImage(image,media[itemData][mediaIndex[itemData]]);
		}
	});
	item.on("vclick", ".next-image", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var itemData = $(this).parents(".item").data("data");
		var image = $(this).parents(".item").find(".product-image img");
		if(media[itemData].length) {
			mediaIndex[itemData]++; if (mediaIndex[itemData]>media[itemData].length-1) mediaIndex[itemData] = media[itemData].length-1;
			loadImage(image,media[itemData][mediaIndex[itemData]]);
		}
	});
	item.on("change", "#product-title", function(event) {
		$(this).parents(".item").find("#item-title .ui-btn-text").text($(this).val());
	});
	item.on("change", "#product-price,#product-qty", function(event) {
		refreshGrandTotal();
	});
	item.on("vclick", ".take-photo", function(event) {
		// capture callback
		var itemData = $(this).parents(".item").data("data");
		var image = $(this).parents(".item").find(".product-image img");
		try {
			var captureSuccess = function(mediaFiles) {    
				var i, path, len;    
				for (i = 0, len = mediaFiles.length; i < len; i += 1) {        
					path = mediaFiles[i].fullPath;        // do something interesting with the file  
					mediaIndex[itemData] = media[itemData].length;  
					media[itemData].push(path);
					loadImage(image,media[itemData][mediaIndex[itemData]]);
				}
			};
			// capture error callback
			var captureError = function(error) {    
				navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
			};
			// start image capture
			navigator.device.capture.captureImage(captureSuccess, captureError);
		} catch (e) {
			console.log("error",e);
		}
	});
	item.on("vclick", ".parse-photo", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var item = $(this).parents(".item");
		var itemData = $(this).parents(".item").data("data");
		var imagePath = media[itemData][mediaIndex[itemData]];
		
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
						taskId = ($(xml).find("task").get(0)).attr("id");
						status = ($(xml).find("task").get(0)).attr("status");
						resultUrl = ($(xml).find("task").get(0)).attr("resultUrl");
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
							parseText(item,data);
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
							taskId = ($(xml).find("task").get(0)).attr("id");
							status = ($(xml).find("task").get(0)).attr("status");
							resultUrl = ($(xml).find("task").get(0)).attr("resultUrl");
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
			console.log("error",e);
		}
	});
}
function deleteItem(db,item,callback) {
	var itemData = item.data("data");
	var count = 0;
	
	var successDelete = function (tx,results) {
		if (++count==2) {
			callback(db);
		}
	}

	var queryDelete = function (tx) {
		tx.executeSql("DELETE FROM media WHERE product_id=?",[productId[itemData]], successDelete, StatementErrorCallback);
		tx.executeSql("DELETE FROM product WHERE product_id=?",[productId[itemData]], successDelete, StatementErrorCallback);
	}
	
	db.transaction(queryDelete, TransactionErrorCallback);
}

function saveItemMedia(db,item,callback) {
	console.log('saveItemMedia','start');
	var itemData = item.data("data");
	var count = 0;
	if (count == media[itemData].length) {
		callback(db);
	}
	media[itemData].forEach(function(value,index) {
		var queryInsert = function (tx) {
			
			var successInsert = function (tx, results) {
				console.log('successInsert','start');
				console.log('results',results);
				if (++count == media[itemData].length) {
					callback(db);
				}
				console.log('successInsert','end');
			}
			
			var query =	"INSERT INTO media(product_id,full_path) VALUES (?,?)";
			console.log(query,[productId[itemData],value]);
			tx.executeSql(query,[productId[itemData],value], successInsert, StatementErrorCallback);
		}
		
		db.transaction(queryInsert, TransactionErrorCallback);
	});
	console.log('saveItemMedia','end');
}

function saveItem(db,item,callback) {
	console.log('saveItem','start');
	var itemData = item.data("data");
	var title = item.find("#product-title").val();
	var price = item.find("#product-price").val();
	var qty = item.find("#product-qty").val();
		
	var productReadyDeferred = $.Deferred();
	var productMediaReadyDeferred = $.Deferred();
	
	$.when(productReadyDeferred, productMediaReadyDeferred).then(function() {
		callback(db);
	});

	if (productId[itemData] == -1) {
		var queryInsert = function (tx) {
			
			var successInsert = function (tx, results) {
				console.log('successInsert','start');
				console.log('results',results);
				productId[itemData] = results.insertId;
				productReadyDeferred.resolve();
				saveItemMedia(db, item, function(db) { productMediaReadyDeferred.resolve(); } );
				console.log('successInsert','end');
			}
				
			var query = "INSERT INTO products(product_title,product_price,product_qty) VALUES (?,?,?)";
			console.log(query,[title,price,qty]);
			tx.executeSql(query,[title,price,qty], successInsert, StatementErrorCallback);
		}
		
		db.transaction(queryInsert, TransactionErrorCallback);
	} else {
		var queryUpdate = function (tx) {
			
			var successUpdate = function (tx, results) {
				console.log('successUpdate','start');
				console.log('results',results);
				productReadyDeferred.resolve();
				console.log('successUpdate','end');
			}
			
			var query =	"UPDATE product SET product_title=?,product_price=?,product_qty=? WHERE product_id=?";
			console.log(query,[title,price,qty,productId[itemData]]);
			tx.executeSql(query,[title,price,qty,productId[itemData]], successUpdate, StatementErrorCallback);
			
			var queryDeleteMedia = function (tx) {
				
				var successDeleteMedia = function (tx, results) {
					console.log('successDeleteMedia','start');
					console.log('results',results);
					saveItemMedia(db, item, function(db) { productMediaReadyDeferred.resolve(); } );
					console.log('successDeleteMedia','end');
				}
				
				var query =	"DELETE FROM media WHERE product_id=?";
				console.log(query,[productId[itemData]]);
				tx.executeSql(query,[productId[itemData]], successDeleteMedia, StatementErrorCallback);
			}
			
			db.transaction(queryDeleteMedia, TransactionErrorCallback);
		}
		
		db.transaction(queryUpdate, TransactionErrorCallback);
	}
	console.log('saveItem','end');
}
function queryItems(db) {
	console.log('queryItems','start');
	try {
		var db = getDatabase();	
		
		var queryRecords = function (tx) {
			
			var successRecords = function (tx, results) {
				console.log('successRecords','start');
				console.log('results',results);
				var len = results.rows.length;
				for (var i=0; i<len; i++){
					var item = addItemItem();
					var itemData = item.data("data");
					productId[itemData] = results.rows.item(i).product_id;
					var title = results.rows.item(i).product_title;
					var price = results.rows.item(i).product_price;
					var qty = results.rows.item(i).product_qty;
					item.find("#item-title .ui-btn-text").text(title);
					item.find("#product-title").val(title);
					item.find("#product-price").val(price);
					item.find("#product-qty").val(qty);
				}
				
				$(".item").each(function() {
					var item = $(this);
					var itemData = item.data("data");
					var image = $(this).find(".product-image img").get(0);
			
					var queryMedia = function (tx) {
						
						var successMedia = function (tx, results) {
							var len = results.rows.length;
							for (var i=0; i<len; i++){
								media[itemData].push(results.rows.item(i).full_path);
								mediaIndex[itemMedia] = media[itemMedia].length;  
								loadImage(image,media[itemData][mediaIndex[itemData]]);
							}
						}
						
						var query = "SELECT * FROM media WHERE product_id=?";
						console.log(query,[productId[itemData]]);
						tx.executeSql(query, [productId[itemData]], successMedia, StatementErrorCallback);
					}
					
					db.transaction(queryMedia, TransactionErrorCallback);
				});
				console.log('successRecords','end');
			}
			
			var query = "SELECT * FROM products";
			console.log(query,[]);
			tx.executeSql(query, [], successRecords, StatementErrorCallback);
		}
					
		db.transaction(queryRecords, TransactionErrorCallback);
		
	} catch (e) {
		console.log("error",e);
	}
	console.log('queryItems','end');
}

function hideAll() {
	hideMainMenu();
	hideSummary();
	hideSettings();
	hideItems();
}

var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();

$.when(deviceReadyDeferred, jqmReadyDeferred).then(function() {
	console.log('when(deviceReadyDeferred, jqmReadyDeferred).then','start');
	var db = getDatabase();
	loadSettings();
	queryItems(db);
	console.log('when(deviceReadyDeferred, jqmReadyDeferred).then','end');
});

$(document).on( 'pageshow','#main',function(event){
	console.log('pageshow','main');
});
	
$(document).one( 'pagebeforecreate','#main',function(event){
	console.log('pagebeforecreate','main');
});

$(document).on( 'pageinit','#main',function(event){
	console.log('pageinit','main');

	jqmReadyDeferred.resolve();

	hideAll();
	addItem();
	showItems();
	setGrandTotal(0);
		
	$(".mainmenu-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		toggleMainMenu();
	});
	$(".addnew-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideAll();
		addItem();
    	showItems();
	});
	$(".summary-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideAll();
		buildSummary();
		showSummary();
	});
	$(".settings-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideAll();
		loadSettings();
		showSettings();
	});
	$(".refresh-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideAll();
    	showItems();
		refreshGrandTotal();
	});
	$(".reset-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideAll();
		$(".item").remove();
		media = Array();
		mediaIndex = Array();
		setGrandTotal(0);
		addItem();
    	showItems();
	});
	$("#summary").submit(function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideAll();
    	showItems();
	});
	$("#settings").submit(function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideAll();
		saveSettings();
    	showItems();
	});
});

function fail(error) {        
	console.log('Fail',error);
	navigator.notification.alert('Error code: ' + error.code, null, 'Fail');
}
function TransactionErrorCallback(error) {
	console.log('TransactionErrorCallback',error);
	navigator.notification.alert(error.message+'('+error.code+')', null, 'Database Error');
}
function StatementErrorCallback(tx,error) {
	console.log('StatementErrorCallback',error);
	navigator.notification.alert(error.message+'('+error.code+')', null, 'Database Error');
}
function StatementCallback(tx, results) {
	console.log('StatementCallback',results);
}

// Wait for Cordova to load
//
document.addEventListener("deviceready", onDeviceReady, false);

// Cordova is ready
//
function onDeviceReady() {
	console.log('deviceready');
	
	var db = getDatabase();
	console.log("db.version",db.version);
	createDatabase(db, function(db) {
		deviceReadyDeferred.resolve();
	});
	document.addEventListener("backbutton", handleBackButton, false);
}

function handleBackButton() {
  	console.log("Back Button Pressed!");
    navigator.app.exitApp();
}
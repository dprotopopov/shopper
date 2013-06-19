// JavaScript Document

var media = Array();
var mediaIndex = Array();

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
		var price = $(this).find("#price").get(0);
		var qty = $(this).find("#qty").get(0);
		total += $(price).val()*parseInt($(qty).val());
	});
	setGrandTotal(total);
}
function buildSummary() {
	var totalProducts = 0;
	var totalItems = 0;
	var grandTotal = 0;
	$(".item").each(function() {
		var price = $(this).find("#price").get(0);
		var qty = $(this).find("#qty").get(0);
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
		$("#setting input[type='text'],#setting input[type='password']").each(function() {
			$(this).val(window.localStorage.getItem($(this).attr("id")));
		});
	} catch(e) {
		alert(e);
	}
}
function saveSettings() {
	try {
		$("#setting input[type='text'],#setting input[type='password']").each(function() {
			window.localStorage.setItem($(this).attr("id"),$(this).val());
		});
	} catch(e) {
		alert(e);
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
	$(item.find("#product-name").get(0)).val(text);
	$(item.find("#price").get(0)).val(price);
	var title = $(item.find("#item-title").get(0)).find(".ui-btn-text").get(0);
	$(title).text(text);
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
	item.data("media",media.length);
	media.push(Array());
	mediaIndex.push(-1);

	var itemMedia = item.data("media");
	var image = $(item.find(".product-image").get(0)).find("img").get(0);
		
	item.on("vclick", ".plus-one", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var qty = $(this).parent().find("#qty");
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
		var itemMedia = $(this).parents(".item").data("media");
		var image = $($(this).parents(".item").find(".product-image").get(0)).find("img").get(0);
		if(media[itemMedia].length>0) {
			mediaIndex[itemMedia]--; if (mediaIndex[itemMedia]<0) mediaIndex[itemMedia] = 0;
			loadImage(image,media[itemMedia][mediaIndex[itemMedia]]);
		}
	});
	item.on("vclick", ".next-image", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var itemMedia = $(this).parents(".item").data("media");
		var image = $($(this).parents(".item").find(".product-image").get(0)).find("img").get(0);
		if(media[itemMedia].length>0) {
			mediaIndex[itemMedia]++; if (mediaIndex[itemMedia]>media[itemMedia].length-1) mediaIndex[itemMedia] = media[itemMedia].length-1;
			loadImage(image,media[itemMedia][mediaIndex[itemMedia]]);
		}
	});
	item.on("change", "#product-name", function(event) {
		var title = $($(this).parents(".item").find("#item-title").get(0)).find(".ui-btn-text").get(0);
		$(title).text($(this).val());
	});
	item.on("change", "#price,#qty", function(event) {
		refreshGrandTotal();
	});
	item.on("vclick", ".take-photo", function(event) {
		// capture callback
		var itemMedia = $(this).parents(".item").data("media");
		var image = $($(this).parents(".item").find(".product-image").get(0)).find("img").get(0);
		try {
			var captureSuccess = function(mediaFiles) {    
				var i, path, len;    
				for (i = 0, len = mediaFiles.length; i < len; i += 1) {        
					path = mediaFiles[i].fullPath;        // do something interesting with the file  
					mediaIndex[itemMedia] = media[itemMedia].length;  
					media[itemMedia].push(path);
					loadImage(image,media[itemMedia][mediaIndex[itemMedia]]);
				}
			};
			// capture error callback
			var captureError = function(error) {    
				navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
			};
			// start image capture
			navigator.device.capture.captureImage(captureSuccess, captureError);
		} catch (e) {
			alert(e);
		}
	});
	item.on("vclick", ".parse-photo", function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		var item = $(this).parents(".item");
		var itemMedia = $(this).parents(".item").data("media");
		var imagePath = media[itemMedia][mediaIndex[itemMedia]];
		
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
						alert("Error processImage");
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
							alert("Error loading" + resultUrl);
						}
					});
				};
				
				var onProcessingFailed = function() {
					alert("ProcessingFailed");
				};
				
				var onNotEnoughCredits = function() {
					alert("NotEnoughCredits");
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
							alert("Error getTaskStatus");
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
			alert(e);
		}
	});
}

$(document).ready(function(e) {
	hideMainMenu();
	hideSummary();
	hideSettings();
	addItem();
	showItems();
	setGrandTotal(0);
		
    try {
		navigator.splashscreen.hide();
	} catch(e) {
	}
	
	$(".mainmenu-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		toggleMainMenu();
	});
	$(".addnew-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideMainMenu();
    	hideSummary();
    	hideSettings();
		addItem();
    	showItems();
	});
	$(".summary-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideMainMenu();
    	hideSettings();
		hideItems();
		buildSummary();
		showSummary();
	});
	$(".settings-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideMainMenu();
    	hideSummary();
		hideItems();
		loadSettings();
		showSettings();
	});
	$(".refresh-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideMainMenu();
    	hideSummary();
    	hideSettings();
    	showItems();
		refreshGrandTotal();
	});
	$(".reset-link").bind("vclick", function(event,ui) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
		hideMainMenu();
    	hideSummary();
    	hideSettings();
		$(".item").remove();
		media = Array();
		mediaIndex = Array();
		setGrandTotal(0);
		addItem();
    	showItems();
	});
	$("#summary").submit(function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
    	hideSummary();
    	hideSettings();
    	showItems();
	});
	$("#settings").submit(function(event) {
		if (event.preventDefault) { event.preventDefault(); } else { event.returnValue = false; }
    	hideSummary();
    	hideSettings();
		saveSettings();
    	showItems();
	});
});

function fail(error) {        
	alert(error);    
}

// Wait for Cordova to load
//
document.addEventListener("deviceready", onDeviceReady, false);

// Cordova is ready
//
function onDeviceReady() {
	navigator.splashscreen.show();
}
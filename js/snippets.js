function loadSettings() {
	try {
		$("#settings input[type='text'],#settings input[type='password']").each(function() {
			var value = window.localStorage.getItem($(this).attr("id"));
			if (value) {
				$(this).val(value);
			}
		});
	} catch(e) {
		debugWrite("error",e);
	}
}
function saveSettings() {
	try {
		$("#settings input[type='text'],#settings input[type='password']").each(function() {
			window.localStorage.setItem($(this).attr("id"),$(this).val());
		});
	} catch(e) {
		debugWrite("error",e);
	}
}

function loadImage(image, imagePath) {
	debugWrite("loadImage",imagePath);
	var createReader = function (readable) {
		debugWrite("createReader","start");
		var reader = new FileReader();
		reader.onloadend = function (evt) {
			debugWrite("reader.onloadend","start");
			var dataURL = evt.target.result;
			$(image).attr("src",dataURL);
			debugWrite("reader.onloadend","end");
		}
		reader.readAsDataURL(readable);
		debugWrite("createReader","end");
	};    
	var gotFileEntry = function (fileEntry) {
		debugWrite("gotFileEntry","start");
		fileEntry.file(createReader, fail);
		debugWrite("gotFileEntry","end");
	};
	window.resolveLocalFileSystemURI(imagePath,gotFileEntry, fail);
}

/*
Html:
<a click="loadURL('http://twitter.com/foobar')">twitter</a>

You can also try this in your config.xml:
<access origin="*twitter.com" browserOnly="true"/> 
*/
function loadURL(url){
    navigator.app.loadUrl(url, { openExternal:true });
    return false;
} 

// Функция вывода сообщений трассировки
// Обработка try-catch требуется для совместимости с IE
function debugWrite(a,b) {
	try {
		console.log(a+":"+b);
	} catch (e) {
	}
}

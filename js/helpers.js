function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isUrl(str) {
	var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
	'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
	'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
	'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
	'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
	'(\\#[-a-z\\d_]*)?$','i'); // fragment locator
	if(!pattern.test(str)) {
		return false;
	} else {
		return true;
	}
}

function searchStringInArray(str, strArray) {
	str = str.toLowerCase();
    for (var j=0; j<strArray.length; j++) {
        if (strArray[j].toLowerCase().match(str)) {
        	return j;
        }
    }
    return -1;
}

function httpGet(url) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
var firebaseRef = new Firebase("https://linkchain.firebaseio.com/"); //reference na hlavni firebase objekt
var firebaseRefLinks = new Firebase("https://linkchain.firebaseio.com/board/links"); // reference na firebase objekt s odkazy
var pckry = new Packery(document.querySelector('#items-wrap'),{isLayoutInstant: true});  // inicializace packery http://packery.metafizzy.co
setInterval(function() {pckry.layout();},1500); // packery není příliš náročný (~3ms) a spouštění v intervalu je jednodušší, než ho nárazově spouštět pro X položek, ale pro větší kolekce by bylo potřeba udělat inicializaci packery chytřeji -> např. rozšířením ko.observableArray.push() (který používáme pro odkazy)
var auth = new FirebaseSimpleLogin(firebaseRef, function(error, user) { // FirebaseSimpleLogin simple login se postará o autentifikaci uživatelů
	if (user) {
		document.querySelector('.overlay').style.opacity="0"; // změníme opacitu - css3 transition se postará o přechod
		setTimeout(function() {document.querySelector('.overlay').style.display="none";},750); // po ukončení přechodu odstraníme vrstvu
		var app = ko.applyBindings(new linkchain(user.id,user.displayName)); // spuštění knockout.js teprve po přihlášení
	}
});
function linkchain(userId,displayName) { // začátek knockout.js
	var self = this; // reference
	self.userDisplayName = ko.observable(displayName); // naplníme informacemi, které jsme získali při loginu
	self.userId = ko.observable(userId);
	self.searchInput = ko.observable("");
	self.searchThis = function(string) {
		if(self.searchInput() == string) {
			self.searchInput("")
		} else {
			self.searchInput(string);
		}
	}
    self.items = KnockoutFire.observable( // KnockoutFire synchronizuje data mezi firebase a ko.observableArray
        firebaseRefLinks, {
        	".reverse": true,
            "$links": { // $ označuje, který objekt chceme zpřístupnit
                "title": true, // definujeme, které části chceme přístupné
                "url": true,
                "tags": true,
                "author": true
            },
            ".newItem": { // newItem handluje přidávání nových částí - s definovaným callbackem
                ".priority": function() {return Date.now()}, // kvůli řazení seznamů ve firebase
                ".on_success": function(){ self.linkTitle(""); self.linkToAdd(""); self.tagsToAdd(""); self.showSidebar(false); pckry.layout(); }, // při odeslání výsledků vyprázdníme všechna pole a skryjeme sidebar
                "title": function() {return self.linkTitle()},
                "url": function() {return self.linkToAdd()},
                "author": function() {return self.userId()}, // jako hodnotu nastavíme aktuálního uživatele
                "tags": function() {return self.tagsToAdd().split(/[ ,]+/)} // parsuje tagy do pole
            }
        }
    );
    self.removeItem = function(item) { // odstranění ze seznamu
        firebaseRefLinks.child(item.firebase.name()).remove();
    }
	firebaseRefLinks.on("value", function() { // zapíšeme se k eventu, kdy se někdo přidá child element do objektu s odkazy
		pckry.reloadItems(); // reloadItems přidá nové položky do kolekce (nebo odebere smazané) a spustíme refresh
	});
	self.isVisible = function(item) {
		pckry.layout();
		if(self.searchInput() == "") {
			return true
		} else {
			if(item.title().toLowerCase().search(self.searchInput().toLowerCase()) != -1 || item.author().toLowerCase().search(self.searchInput().toLowerCase()) != -1 || item.url().toLowerCase().search(self.searchInput().toLowerCase()) != -1 || searchStringInArray(self.searchInput(), item.tags()) != -1) { // prohledáme title, url a pole tagů
				return true
			} else {
				return false
			}
		}
	}
	self.linkToAdd = ko.observable(""); // vytvoříme si 3 observables, které použijeme při tvoření nového odkazu
	self.linkTitle = ko.observable("");
	self.tagsToAdd = ko.observable("");
	self.getLinkMeta = ko.computed(function() {
		if(self.linkToAdd().length > 4) {
			if(isUrl(self.linkToAdd())) {
				self.loadTitle(self.linkToAdd());
			}
		}
	}).extend({ throttle: 500 }); // počkáme 500ms na to, jestli uživatel už dopsal, ať ko.computed nespouštíme příliš často
	self.loadTitle = function(url) {
		var response = JSON.parse(httpGet("http://radar.runway7.net?url="+self.linkToAdd())); // GET požadavek a parsujeme string, abychom získali objekt
		if(typeof response.title == "undefined") {
			self.loadTitle(url);
		} else {
			self.linkTitle(response.title);
		}
	}
	self.showSidebar = ko.observable(false);
	self.showAddLinkForm = function() {
		self.showSidebar(!self.showSidebar());
	}
	self.boardUsers = ko.computed(function() {
		var linksCount = self.items().length;
		var usersArray = [];
		for(var i = 0;i<linksCount;i++) {
			usersArray.push(self.items()[i]().author());
		}
		return ko.utils.arrayGetDistinctValues(usersArray).sort();
	}).extend({ throttle: 1000 });
}
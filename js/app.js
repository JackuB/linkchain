var firebaseRef = new Firebase("https://linkchain.firebaseio.com/"); //reference na hlavni firebase objekt
var firebaseRefLinks = new Firebase("https://linkchain.firebaseio.com/board/links"); // reference na firebase objekt s odkazy
var itemsWrap = $(".items-wrap");
itemsWrap.packery({isLayoutInstant: true}); // inicializace packery http://packery.metafizzy.co
setInterval(function() { // packery není příliš náročný (~3ms) a spouštění v intervalu je jednodušší, než ho nárazově spouštět pro X položek, ale pro větší kolekce by bylo potřeba udělat inicializaci packery chytřeji -> např. rozšířením ko.observableArray.push() (který používáme pro odkazy)
	itemsWrap.packery();
},1500);
var auth = new FirebaseSimpleLogin(firebaseRef, function(error, user) {
	if (error) {
		console.log(error);
	} else if (user) {
		$(".overlay").fadeOut();
		var app = ko.applyBindings(new linkchain(user.id,user.displayName)); // spuštění knockout.js
	}
});
$(".overlay img").click(function() {
	auth.login('facebook');
});
function linkchain(userId,displayName) { // začátek knockout.js
	var self = this; // reference
	self.userDisplayName = ko.observable(displayName);
	self.userId = ko.observable(userId);
	self.searchInput = ko.observable("");
	self.searchThis = function(string) {
		self.searchInput(string);
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
                ".on_success": function(){ self.linkTitle(""); self.linkToAdd(""); self.tagsToAdd(""); self.showSidebar(false); itemsWrap.packery(); }, // při odeslání výsledků vyprázdníme všechna pole a skryjeme sidebar
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
		itemsWrap.packery("reloadItems").packery(); // reloadItems přidá nové položky do kolekce (nebo odebere smazané) a spustíme refresh
	});
	self.isVisible = function(item) {
		itemsWrap.packery();
		if(self.searchInput() == "") {
			return true
		} else {
			if(item.title().toLowerCase().search(self.searchInput().toLowerCase()) != -1 || item.url().toLowerCase().search(self.searchInput().toLowerCase()) != -1 || searchStringInArray(self.searchInput(), item.tags()) != -1) { // prohledáme title, url a pole tagů
				return true
			} else {
				return false
			}
		}
	}
	self.linkToAdd = ko.observable("");
	self.linkTitle = ko.observable("");
	self.tagsToAdd = ko.observable("");
	self.loadTitle = function(url) {
		var secondLoad = false;
		$.get("http://radar.runway7.net",{url: self.linkToAdd()}, function(response) {
			if(typeof response.title == "undefined" && !secondLoad) {
				secondLoad = true;
				self.loadTitle(url);
			} else {
				secondLoad = false;
				self.linkTitle(response.title);
			}
		});
	}
	self.getLinkMeta = ko.computed(function() {
		if(self.linkToAdd().length > 4) {
			if(isUrl(self.linkToAdd())) {
				self.loadTitle(self.linkToAdd());
			}
		}
	}).extend({ throttle: 500 });
	self.showSidebar = ko.observable(false);
	self.showAddLinkForm = function() {
		self.showSidebar(!self.showSidebar());
	}
}
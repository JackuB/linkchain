(function() {
	var firebaseRef = new Firebase('https://linkchain.firebaseio.com/');
	var itemsWrap = $(".items-wrap");
	function linkchain() {
		var self = this;
		self.curUser = ko.observable("");
		self.curBoard = ko.observable({boardName: null, users: [], links: []});
		self.boardLinks = ko.observableArray([]);
		itemsWrap.packery({
			itemSelector: '.item',
			gutter: 15
		});
		firebaseRef.child("testUsers").child(0).on('value', function(currentUser) {
	  		self.curUser(currentUser.val());
	  		var defaultBoard = self.curUser().boards[0];
	  		if(typeof defaultBoard != "undefined" && isNumber(defaultBoard)) {
	  			self.loadBoard(defaultBoard);
	  		}
		});
		self.showSidebar = ko.observable("");
		self.showAddLinkForm = function() {
			if(self.showSidebar() == "addLink") {
				self.showSidebar("");
			} else {
				self.showSidebar("addLink");
			}
		}
		self.linkToAdd = ko.observable("");
		self.linkTitle = ko.observable("");
		self.tagsToAdd = ko.observable("");
		self.getLinkMeta = ko.computed(function() {
			if(self.linkToAdd().length > 4) {
				if(isUrl(self.linkToAdd())) {
					$.get("http://radar.runway7.net",{url: self.linkToAdd()}, function(response) {
						self.linkTitle(response.title);
					});
				}
			}
		}).extend({ throttle: 500 });
		self.saveLink = function() {
			self.tagsToAdd(self.tagsToAdd().split(/[ ,]+/));
			firebaseRef.child("boards").child(self.curUser().boards[0]).child("links").push({
				title: self.linkTitle(),
				url: self.linkToAdd(),
				tags: self.tagsToAdd(),
				user: self.curUser().name
			}, function() {
				self.showSidebar("");
				self.linkToAdd = ko.observable("");
				self.linkTitle = ko.observable("");
				self.tagsToAdd = ko.observable("");
			});
		}
		self.loadBoard = function(id) {
  			firebaseRef.child("boards").child(id).on("value",function(snapshot) {
  				if(snapshot.val() === null) {
  					throw "Board " + id + " not loaded";
  				} else {
  					self.curBoard(snapshot.val());
  					var packeryTimeout;
  					firebaseRef.child("boards").child(id).child("links").on("child_added", function(link) {
  						var isThere = $.grep(self.boardLinks(), function(e){ return e.url == link.val().url; });
  						if(isThere[0] == null) {
  							self.boardLinks.push(link.val());
  							clearTimeout(packeryTimeout);
		  					packeryTimeout = setTimeout(function() {
								itemsWrap.packery("reloadItems").packery();
							},350);
  						}
  					});
  				}
  			});
		}
	}
	var app = ko.applyBindings(new linkchain());
})();
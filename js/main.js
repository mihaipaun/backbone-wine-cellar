// Models
window.Wine = Backbone.Model.extend({
  /*
    Note: urlRoot is only needed when retrieving/persisting Models that are not part of a Collection.
    If the Model is part of a Collection, the url attribute defined in the Collection is enough for Backbone.js to know how to retrieve, update, or delete data using your RESTful API.
  */
  urlRoot: "api/wines", // RESTful service endpoint to retrieve or persist Model data
  /*
    Default values used when a new instance of the model is created.
    This attribute is optional.
    However, it was required in this application for the wine-details template to render an ‘empty’ wine model object (which happens when adding a new wine).
  */
  defaults: {
    "id": null,
    "name": "",
    "grapes": "",
    "country": "Romania",
    "region": "Moldavia",
    "year": "",
    "description": "",
    "picture": ""
  }
});

window.WineCollection = Backbone.Collection.extend({
  model: Wine, // "model" indicates the nature of the collection
  url: "api/wines" // "url" provides the endpoint for the RESTful API
});

// Views
window.WineListView = Backbone.View.extend({

  tagName: "ul",

  initialize: function () {
    this.model.bind("reset", this.render, this);
    /*
      When a new wine is added, you want it to automatically appear in the list.
      To make that happen, you bind the View to the add event of the WineListView model (which is the collection of wines).
      When that event is fired, a new instance of WineListItemView is created and added to the list.
    */
    var self = this;
    this.model.bind("add", function (wine) {
      $(self.el).append(new WineListItemView({model: wine}).render().el);
    });
  },

  // the render() function iterates through the collection, instantiates a WineListItemView for each wine in the collection, and adds it to the wineList.
  render: function () {
    _.each(this.model.models, function (wine) {
      $(this.el).append(new WineListItemView({model: wine}).render().el);
    }, this);
    
    return this;
  }

});

window.WineListItemView = Backbone.View.extend({

  tagName: "li",

  template: _.template($("#tpl-wine-list-item").html()),

  initialize: function () {
    /*
      When a wine is changed, you want the corresponding WineListItemView to re-render automatically to reflect the change.
      To make that happen, you bind the View to the change event of its model, and execute the render function when the event is fired.
    */
    this.model.bind("change", this.render, this);
    /*
      Similarly, when a wine is deleted, you want the list item to be removed automatically.
      To make that happen, you bind the view to the destroy event of its model and execute our custom close function when the event is fired.
      To avoid memory leaks and events firing multiple times, it is important to unbind the event listeners before removing the list item from the DOM.
    */
    this.model.bind("destroy", this.close, this);
  },

  // the render() function merges the model data into the “wine-list-item” template
  render: function (eventName) {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  },

  close: function () {
    $(this.el).unbind();
    $(this.el).remove();
  }

});

/*
  The view responsible for displaying the wine details in the Wine form.
  The render() function merges the model data (a specific wine) into the “wine-details” template retrieved from index.html.
*/
window.WineView = Backbone.View.extend({

  template: _.template($("#tpl-wine-details").html()),

  initialize: function () {
    this.model.bind("change", this.render, this);
  },

  render: function (eventName) {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  },

  /*
   Update the model based on user input in a form using the "delayed" approach: wait until the user clicks Save to update the model based on the new values in UI controls, and then send the changes to the server.
  */
  events: {
    "change input": "change",
    "click .save": "saveWine",
    "click .delete": "deleteWine"
  },

  change:function (event) {
    var target = event.target;
    console.log('changing ' + target.id + ' from: ' + target.defaultValue + ' to: ' + target.value);
    // You could change your model on the spot, like this:
    // var change = {};
    // change[target.name] = target.value;
    // this.model.set(change);
  },

  saveWine: function () {
    this.model.set({
      name: $("#name").val(),
      grapes: $("#grapes").val(),
      country: $("#country").val(),
      region: $("#region").val(),
      year: $("#year").val(),
      description: $("#description").val()
    });
    if (this.model.isNew()) {
      var self = this;
      app.wineList.create(this.model, {
        success: function () {
          app.navigate("wines/" + self.model.id, false);
        }
      });
    } else {
      this.model.save();
    }
    return false;
  },

  deleteWine: function () {
    this.model.destroy({
      success: function () {
        alert("Wine deleted successfully");
        window.history.back();
      }
    });
    return false;
  },

  close: function () {
    $(this.el).unbind();
    $(this.el).empty();
  }

});

/*
  Define a Header View (a toolbar) that could be made of different components and that encapsulates its own logic.
*/
window.HeaderView = Backbone.View.extend({

  template: _.template($("#tpl-header").html()),

  initialize: function () {
    this.render();
  },

  render: function (eventName) {
    $(this.el).html(this.template());
    return this;
  },

  events: {
    "click .new": "newWine"
  },

  newWine: function (event) {
    app.navigate("wines/new", true);
    return false;
  }
});

/*
  Provides the entry points for the application through a set of (deep-linkable) URLs.
  Two routes are defined:
    The default route (“”) displays the list of wine.
    The “wines/:id” route displays the details of a specific wine in the wine form.
*/
var AppRouter = Backbone.Router.extend({

  routes: {
    "": "list",
    "wines/new": "newWine",
    "wines/:id": "wineDetails"
  },

  initialize: function () {
    $("#header").html(new HeaderView().render().el);
  },

  list: function () {
    this.wineList = new WineCollection();
    var self = this;
    this.wineList.fetch({
      success: function () {
        self.wineListView = new WineListView({model: self.wineList});
        $("#sidebar").html(self.wineListView.render().el);
        if (self.requestedId)
          self.wineDetails(self.requestedId);
      }
    });
  },

  wineDetails: function (id) {
    if (this.wineList) {
      this.wine = this.wineList.get(id);
      if (this.wineView)
        this.wineView.close();
      this.wineView = new WineView({model: this.wine});
      $("#content").html(this.wineView.render().el);
    } else {
      this.requestedId = id;
      this.list();
    }
  },

  newWine: function () {
    if (app.wineView)
      app.wineView.close();
    app.wineView = new WineView({model: new Wine()});
    $("#content").html(app.wineView.render().el);
  }

});

var app = new AppRouter();
Backbone.history.start();
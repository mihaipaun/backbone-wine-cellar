// Models
window.Wine = Backbone.Model.extend({
  // validation, default values, etc.
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

  // the render() function merges the model data into the “wine-list-item” template
  render: function (eventName) {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});

/*
  The view responsible for displaying the wine details in the Wine form.
  The render() function merges the model data (a specific wine) into the “wine-details” template retrieved from index.html.
*/
window.WineView = Backbone.View.extend({
  template: _.template($("#tpl-wine-details").html()),

  render: function (eventName) {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
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
    "wines/:id": "wineDetails"
  },

  list: function () {
    this.wineList = new WineCollection();
    this.wineListView = new WineListView({model: this.wineList});
    this.wineList.fetch();
    $("#sidebar").html(this.wineListView.render().el);
  },

  wineDetails: function (id) {
    this.wine = this.wineList.get(id);
    this.wineView = new WineView({model: this.wine});
    $("#content").html(this.wineView.render().el);
  }

});

var app = new AppRouter();
Backbone.history.start();
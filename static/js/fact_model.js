(function() {

    var Facts = window.Facts || {};
    Facts.Fact = Backbone.Model.extend({
        defaults: {
            selected: false,
            name: "",
            fact_type: null,
            body: "",
            metadata: {},
            fact_id: null
        },
        parse: function(r) {
            if(r.resp) {
                //from post
                return r.resp;
            } else {
                //from collection
                return r;
            }
        },
        idAttribute: "fact_id",
        select: function() {
            this.set({selected: true});
        },
        deselect: function() {
            this.set({selected: false});
        },
        url: "/fact"
    });
    Facts.FactCollection = Backbone.Collection.extend({
        model: Facts.Fact,
        url: '/facts',
        parse: function(r) {
            return r.resp;
        }
    });

    window.Facts = Facts;
})();

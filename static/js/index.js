$(function(){
    $("#code").focus();

    $("#execute-button").click(function(){
        var params = {
            code: $("#code").val()
        };

        $.post("/execute", params, function(data){
            console.log(data);
        }, "json");
    });

    var Facts = {};

    Facts.MView = Backbone.View.extend({
        render: function() {
            this.$el.html(this.template(this.getTemplateContext()));
            this.$el.data('backbone-model', this.model);
            this.postRender();
            return this;
        },
        postRender: $.noop,
        getTemplateContext: function() {
            return this.model.toJSON();
        },
        initialize: function() {
            this.model.bind('change', this.render, this);
        },
    });

    Facts.Fact = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        select: function() {
            this.set({selected: true});
        },
        deselect: function() {
            this.set({selected: false});
        }
    });
    Facts.FactCollection = Backbone.Collection.extend({
        model: Facts.Fact,
        url: '/facts',
        parse: function(r) {
            return r.resp;
        }
    });
    Facts.AllFacts = new Facts.FactCollection();

    Facts.SelectedFact = _.extend({
        set: function(f) {
            if(this.f) {
                this.f.deselect();
            }

            this.f = f;
            this.f.select();
            this.trigger('change');
        },
        get: function() {
            return this.f;
        }
    }, Backbone.Events)

    Facts.FactListView = Facts.MView.extend({
        tagName: 'li',
        className: 'fact',
        events: {
            'click': 'select'
        },
        template: _.template($('#fact-list-tmpl').html()),
        postRender: function() {
            this.$el.addClass(this.model.get('fact_type'));
            if(this.model.get('selected')) {
                this.$el.addClass('selected');
            }
        },
        select: function() {
            Facts.SelectedFact.set(this.model);
        }
    });

    Facts.FactList = Backbone.View.extend({
        el: $("#fact-list"),
        initialize: function(){
            Facts.AllFacts.bind('all', this.render, this);
        },
        render: function(){
            var self = this;
            this.$el.empty();

            Facts.AllFacts.each(function(fact){
                var v = new Facts.FactListView({model: fact});
                self.$el.append(v.render().el);
            });
        }
    });

    Facts.Editor = Backbone.View.extend({
        el: $("#code"),
        initialize: function() {
            Facts.SelectedFact.bind('change', this.render, this);
        },
        render: function() {
            this.$el.html(Facts.SelectedFact.get().get('body'));
        }
    });

    new Facts.FactList();
    new Facts.Editor();
    Facts.AllFacts.fetch();

});
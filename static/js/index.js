$(function(){

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
            selected: false,
            name: "",
            fact_type: null,
            body: ""
        },
        idAttribute: "null",
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
        events: {
            'keydown': 'maybeBlur'
        },
        maybeBlur: function(e) {
            if(e.keyCode == 27) { //esc
                this.$el.blur();
            }
        },
        initialize: function() {
            this.$el.html("").val("");
            Facts.SelectedFact.bind('change', this.render, this);
        },
        render: function() {
            this.$el.html(Facts.SelectedFact.get().get('body'));
        },
        getVal: function() {
            return this.$el.val();
        }
    });

    Facts.FactDrawer = Backbone.View.extend({
        el: $("#fact-drawer"),
        events: {
            'click #new-fn-link': 'createNewFn'
        },
        createNewFn: function() {
            var fn_name = prompt("FN NAME:");
            var fact = new Facts.Fact({
                name: fn_name,
                fact_type: "fn"
            });
            fact.save();
        }
    });

    Facts.ActionBar = Backbone.View.extend({
        el: $("#action-bar"),
        initialize: function() {
            this.command_bar = new Facts.CommandBar();
            this.action_buttons = new Facts.ActionButtons();
        },
        showCommandBar: function() {
            this.command_bar.show();
            this.action_buttons.hide();
        },
        hideCommandBar: function() {
            this.command_bar.hide();
            this.action_buttons.show();
        }
    });

    Facts.CommandBar = Backbone.View.extend({
        el: $("#command-bar"),
        initialize: function() {
            this.input = this.$(".command-input");
        },
        events: {
            'keydown .command-input': 'maybePerformAction'
        },
        maybePerformAction: function(e) {
            if(e.keyCode == 13) { //enter
                Facts.CommandPerformer.perform(this.input.val());
                Facts.TheActionBar.hideCommandBar();
            }
        },
        show: function() {
            this.input.val("");
            this.$el.show();
            this.input.focus();
        },
        hide: function() {
            this.$el.hide();
        }
    });

    Facts.ActionButtons = Backbone.View.extend({
        el: $("#action-buttons"),
        events: {
            'click #execute-button': 'execute'
        },
        hide: function() {
            this.$el.hide();
        },
        show: function() {
            this.$el.show();
        },
        execute: function() {
            var params = {
                code: $("#code").val()
            };

            $.post("/execute", params, function(data){
                console.log(data);
            }, "json");
        }
    });

    Facts.CommandPerformer = _.extend({
        phrases: {
            'w': 'writeCurrentBuffer'
        },
        perform: function(phrase) {
            var action = this.phrases[phrase];
            if(this[action]) {
                this[action]();
            } else {
                console.log("INVALID PHRASE");
            }
        },
        writeCurrentBuffer: function() {
            var fact = Facts.SelectedFact.get();
            var body = Facts.TheEditor.getVal();
            fact.set({
                body: body
            });
            fact.save();
        }
    }, Backbone.Events);

    Facts.TheFactList = new Facts.FactList();
    Facts.TheEditor = new Facts.Editor();
    Facts.TheFactDrawer = new Facts.FactDrawer();
    Facts.TheActionBar = new Facts.ActionBar();

    Facts.AllFacts.fetch();

    //Global keys
    Mousetrap.bind(":", function(){
        Facts.TheActionBar.showCommandBar();
    });
});

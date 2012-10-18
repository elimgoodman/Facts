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
                var body = Facts.TheEditor.getVal();
                this.f.set({body: body}, {silent: true});
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

    Facts.FactInfoView = Facts.MView.extend({
        tagName: 'div',
        className: 'actual-fact-info',
        events: {
            'keyup .param-input': 'resizeParamInput'
        },
        resizeParamInput: function(e) {
            var t = $(e.target);
            var w = t.innerWidth();
            var new_width;
            var char_width = 10;
            //FIXME: put in a regex check for the key
            if(e.keyCode == 8) { //backspace
                new_width = w - char_width;
            } else {
                new_width = w + char_width;
            }

            $(e.target).width(new_width);
        },
        template: function(context) {
            var fact_type = this.model.get('fact_type');
            var type_to_tmpl = {
                main_block: "main-block-fact-info-tmpl",
                fn: "fn-fact-info-tmpl"
            };
            var tmpl = "#" + type_to_tmpl[fact_type];

            return _.template($(tmpl).html())(context);
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
            this.$el.val("");
            Facts.SelectedFact.bind('change', this.renderAndFocus, this);
            this.code_mirror = CodeMirror.fromTextArea(this.el, {});
        },
        renderAndFocus: function() {
            this.render();
            this.$el.focus();
        },
        render: function() {
            this.$el.val(Facts.SelectedFact.get().get('body'));
        },
        getVal: function() {
            return this.$el.val();
        }
    });

    Facts.FactDrawer = Backbone.View.extend({
        el: $("#fact-drawer")
    });

    Facts.FactInfo = Backbone.View.extend({
        el: $("#fact-info"),
        initialize: function() {
            Facts.SelectedFact.bind('change', this.render, this);
        },
        render: function() {
            var f = Facts.SelectedFact.get();
            var v = new Facts.FactInfoView({model: f});
            this.$el.html(v.render().el);
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
                Facts.TheCommandBar.hide();
            } else if(e.keyCode == 27) { //escape
                Facts.TheCommandBar.hide();
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

    Facts.Output = Backbone.View.extend({
        el: $("#output"),
        initialize: function() {
            this.$el.val("");
        },
        setOutput: function(output) {
            this.$el.val(output);
        }
    });

    Facts.CommandPerformer = _.extend({
        phrases: {
            'w': 'writeCurrentBuffer',
            'fn': 'createNewFn',
            'e': 'selectFact',
            'ex': 'execute',
            'wa': 'writeAllBuffers'
        },
        perform: function(phrase) {
            var parts = phrase.split(" ");
            var command = parts[0];
            var args = parts.slice(1);
            var action = this.phrases[command];

            if(this[action]) {
                this[action](args);
            } else {
                console.log("INVALID PHRASE");
            }
        },
        setCurrentFactBody: function() {
            var fact = Facts.SelectedFact.get();
            if(fact) {
                var body = Facts.TheEditor.getVal();
                fact.set({
                    body: body
                });
            }

            return fact;
        },
        writeCurrentBuffer: function(args) {
            var fact = this.setCurrentFactBody();
            if(fact) {
                fact.save();
            }
        },
        createNewFn: function(args) {
            var fn_name = args[0];
            var fact = new Facts.Fact({
                name: fn_name,
                fact_type: "fn"
            });
            fact.save();
            Facts.AllFacts.push(fact);
            Facts.SelectedFact.set(fact);
        },
        selectFact: function(args) {
            var fact_name = args[0];
            var fact = Facts.AllFacts.find(function(f){
                return f.get('name') == fact_name;
            });

            Facts.SelectedFact.set(fact);
        },
        writeAllBuffers: function(args, cb) {
            this.setCurrentFactBody();
            Facts.AllFacts.invoke('save');
            if(cb) {
                cb(args);
            }
        },
        execute: function(args) {
            this.writeAllBuffers(args, function(args) {
                $.post('/execute', {}, function(data){
                    Facts.TheOutput.setOutput(data.output);
                }, "json");
            });
        } 
    }, Backbone.Events);

    Facts.TheFactInfo = new Facts.FactInfo();
    Facts.TheFactList = new Facts.FactList();
    Facts.TheEditor = new Facts.Editor();
    Facts.TheFactDrawer = new Facts.FactDrawer();
    Facts.TheCommandBar = new Facts.CommandBar();
    Facts.TheOutput = new Facts.Output();

    Facts.AllFacts.bind('reset', function() {
        Facts.SelectedFact.set(Facts.AllFacts.at(0));
    });
    Facts.AllFacts.fetch();

    //Global keys
    Mousetrap.bind(":", function(){
        Facts.TheCommandBar.show();
    });

    $("body").focus();
});

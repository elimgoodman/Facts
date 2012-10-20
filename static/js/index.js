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
            this.postInit();
        },
        postInit: $.noop
    });

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
            'click .see-more': 'toggleMoreInfo'
        },
        toggleMoreInfo: function(e) {
            this.$(".more-fact-info").slideToggle(100);
        },
        postRender: function() {
            this.$('.fact-info-input').autoGrowInput();
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
                this.code_mirror.blur();
            }
        },
        initialize: function() {
            this.$el.val("");
            Facts.SelectedFact.bind('change', this.renderAndFocus, this);
            CodeMirror.keyMap.basic['Esc'] = function(cm) {
                console.log(cm);
            };
            this.code_mirror = CodeMirror.fromTextArea(this.el, {});

        },
        renderAndFocus: function() {
            this.render();
            this.code_mirror.focus();
        },
        render: function() {
            this.code_mirror.setValue(Facts.SelectedFact.get().get('body'));
        },
        getVal: function() {
            return this.code_mirror.getValue();
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
        },
        getMetadata: function() {
            var metadata = {};
            this.$(".fact-info-input").each(function(){
                metadata[$(this).attr('name')] = $(this).val();
            });
            return metadata;
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
        setCurrentFactFields: function() {
            var fact = Facts.SelectedFact.get();
            if(fact) {
                var body = Facts.TheEditor.getVal();
                var metadata = Facts.TheFactInfo.getMetadata();
                fact.set({
                    body: body,
                    metadata: metadata
                });
            }

            return fact;
        },
        writeCurrentBuffer: function(args) {
            var fact = this.setCurrentFactFields();
            console.log(fact.toJSON());
            if(fact) {
                fact.save();
            }
            console.log(fact.toJSON());
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
            this.setCurrentFactFields();
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
    
    $(".escapable").live('keydown', function(e){
        if(e.keyCode == 27) {
            e.preventDefault();
            $(this).blur();
        }
    });

    $("body").focus();
});

$(function(){

    var Facts = window.Facts || {};

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

    Facts.StatementPiece = Backbone.Model.extend({
        getValue: function() {
            return this.get("value");
        },
        isEditable: function() {
            return true;
        },
        select: function() {
            this.set({selected: true});
        },
        deselect: function() {
            this.set({selected: false});
        },
        isSelected: function() {
            return this.get('selected');
        }
    });
    Facts.FnPiece = Facts.StatementPiece.extend({
        getType: function() {
            return "fn";
        }
    });
    Facts.PrimaryArgPiece = Facts.StatementPiece.extend({
        getType: function() {
            return "primary-arg";
        }
    });
    Facts.ArgNamePiece = Facts.StatementPiece.extend({
        getValue: function() {
            return this.get("value") + ":";
        },
        isEditable: function() {
            return false;
        },
        getType: function() {
            return "arg-name";
        }
    });
    Facts.ArgValPiece = Facts.StatementPiece.extend({
        getType: function() {
            return "arg-val";
        }
    });
    Facts.ReturnerPiece = Facts.StatementPiece.extend({
        getValue: function() {
            return "->>";
        },
        getType: function() {
            return "returner";
        }
    });
    Facts.AssignerPiece = Facts.StatementPiece.extend({
        getValue: function() {
            return "->";
        },
        getType: function() {
            return "assigner";
        }
    });
    Facts.SymbolPiece = Facts.StatementPiece.extend({
        getType: function() {
            return "symbol";
        }
    });

    Facts.Statement = Backbone.Model.extend({
        initialize: function() {
            this.pieces = this.generatePieces();  
        },
        defaults: {
            selected: false
        },
        getPieces: function() {
            return this.pieces;
        },
        generatePieces: function() {
            var self = this;
            var val = this.get('value');
            var pieces = [];

            pieces.push(new Facts.FnPiece({value: val.fn_var_name.value}));
            pieces.push(new Facts.PrimaryArgPiece({value: val.args.args[0].value}));

            _.each(val.args.args.slice(1), function(arg){
                pieces.push(new Facts.ArgNamePiece({value: arg.arg_name.value}));
                pieces.push(new Facts.ArgValPiece({value: arg.value.value}));
            });

            var type = this.get('type');

            if(type == 'ReturnStmt') {
                pieces.push(new Facts.ReturnerPiece());
            } else if (type == 'Assignment') {
                pieces.push(new Facts.AssignerPiece());
                pieces.push(new Facts.SymbolPiece({value: this.get('symbol').value}));
            }
            return pieces;
        },
        getEditablePieces: function() {
            return _.filter(this.getPieces(), function(p){
                return p.isEditable();
            });
        },
        select: function() {
            this.set({selected: true});
        },
        deselect: function() {
            this.set({selected: false});
        },
        isSelected: function() {
            return this.get('selected');
        }
    });

    Facts.StatementList = Backbone.Collection.extend({
        model: Facts.Statement
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
        initialize: function() {
            this.statements = this.generateStatements();
        },
        getStatements: function() {
            return this.statements;
        },
        generateStatements: function() {
            var stmts = _.map(this.get('statements').statements, function(s) {
                return new Facts.Statement(s);
            });

            return new Facts.StatementList(stmts);
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
        isSelected: function() {
            return this.get('selected');
        },
        makeSignatureString: function() {
            if(this.get("fact_type") != "fn") {
                throw "wrong type";
            }

            var sig = this.get('signature');
            var elements = [this.get('name')];

            elements.push(this.stringifyParam(sig.primary));

            return elements.join(' ');
        },
        stringifyParam: function(param) {
            return param.name + ":" + param.typ;
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

            var statements = this.f.getStatements();
            Facts.Cursor.setStatement(statements.at(0));
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

    Facts.FactSelectorListView = Facts.MView.extend({
        tagName: 'li',
        className: 'selector-fact',
        template: _.template($('#fact-selector-list-tmpl').html()),
        postRender: function() {
            if(this.model.isSelected()) {
                this.$el.addClass('selected');
            } else {
                this.$el.removeClass('selected');
            }
        }
    });

    Facts.FactSelectorInfoView = Facts.MView.extend({
        tagName: 'div',
        className: 'selector-fact-info',
        template: _.template($('#fact-selector-info-tmpl').html())
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

    Facts.StatementPieceView = Facts.MView.extend({
        className: 'statement-piece',
        tagName: 'span',
        template: _.template($('#statement-piece-tmpl').html()),
        postRender: function() {
            this.$el.addClass(this.model.getType());

            if(this.model.isSelected()) {
                this.$el.addClass('selected');
            } else {
                this.$el.removeClass('selected');
            }
        },
        getTemplateContext: function() {
            return _.extend(this.model.toJSON(), {
                value: this.model.getValue()
            });
        }
    });

    Facts.StatementView = Facts.MView.extend({
        className: 'statement',
        tagName: 'li',
        template: _.template($('#statement-tmpl').html()),
        postRender: function() {
            //Update this for other statement types
            var self = this;
            var pieces = this.model.getPieces();

            _.each(pieces, function(p){
                var v = new Facts.StatementPieceView({model: p});
                self.$el.append(v.render().el);
            });

            if(this.model.isSelected()) {
                this.$el.addClass('selected');
            } else {
                this.$el.removeClass('selected');
            }
        },
    });

    Facts.Editor = Backbone.View.extend({
        el: $("#statements"),
        initialize: function() {
            Facts.SelectedFact.bind('change', _.compose(this.render, this.focus), this);
        },
        render: function() {
            var fact = Facts.SelectedFact.get();
            var statements = fact.getStatements();

            var self = this;
            self.$el.empty();

            statements.each(function(stmt){
                var v = new Facts.StatementView({model: stmt});
                self.$el.append(v.render().el);
            });
        },
        focus: function() {
            //noopfor now
        },
        getVal: function() {
            //return this.code_mirror.getValue();
        }
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

    Facts.Output = Backbone.View.extend({
        el: $("#output"),
        initialize: function() {
            this.$el.val("");
        },
        setOutput: function(output) {
            this.$el.val(output);
        }
    });

    Facts.Selector = Backbone.View.extend({
        el: $("#selector"),
        events: {
            'keyup .selector-text': 'findActions',
            'keydown .selector-text': 'maybeHide',
            'keydown': 'beginNavigating'
        },
        initialize: function() {
            this.node = this.$el.get(0);
            this.selector_text = this.$(".selector-text");
            this.possibilty_list = this.$(".selector-possibilities");
            this.fact_info = this.$(".selector-fact-info-container");

            this.editor = null;
            this.cursor_pos = null;

            this.possibilties = new Facts.FactCollection();
            this.possibilties.on('reset', this.renderPossibilities, this);

            this.selection = null;
            this.on('selection-changed', this.renderFactInfo, this);
        },
        showInEditor: function(editor) {
            this.editor = editor;
            this.cursor_pos = editor.getCursor();

            $(".CodeMirror-cursor").addClass("selector-mode");
            editor.addWidget(this.cursor_pos, this.node);

            $("*").blur();
            this.reposition(this.node);
            this.$el.show();
            this.selector_text.focus();
        },
        hide: function() {
            this.$el.hide();
            this.editor.focus();
            this.reset();
        },
        reset: function() {
            this.selector_text.val("");
            this.possibilty_list.empty();
            this.fact_info.empty();
        },
        reposition: function(node) {
            var current_top = $(node).css('top');
            var top_num = parseInt(current_top.split('p')[0]);
            top_num += 20;
            $(node).css('top', top_num + "px");

            var current_left = $(node).css('left');
            var left_num  = parseInt(current_left.split('p')[0]);
            left_num -= 10;
            $(node).css('left', left_num + "px");
        },
        findActions: function(e) {
            //FIXME: this should probably be done using the Collection.fetch
            //FIXME: only do this for \w keys

            var self = this;
            var txt = $(e.target).val();

            if(txt && txt.length > 1) {
                $.getJSON("/find_action", {txt: txt}, function(data) {
                    self.possibilties.reset(data.resp);
                });
            }
        },
        renderPossibilities: function() {
            var self = this;

            this.possibilty_list.empty();
            this.possibilties.each(function(action){
                var v = new Facts.FactSelectorListView({model: action});
                self.possibilty_list.append(v.render().el);
            });
        },
        maybeHide: function(e) {
            if(e.keyCode == 27) {
                e.preventDefault();
                this.hide();
            }
        },
        beginNavigating: function(e) {
            if(e.which == 40) { //down arrow
                e.preventDefault();
                e.stopPropagation();

                this.selector_text.blur();
                this.setSelection(this.possibilties.at(0));
            }
        },
        setSelection: function(f) {
            if(this.selection) {
                this.selection.deselect();
            }

            this.selection = f;
            this.selection.select();
            this.trigger('selection-changed');
        },
        getSelection: function() {
            return this.selection;
        },
        down: function() {
            var i = this.possibilties.indexOf(this.getSelection());
            var new_index = i + 1;
            if(new_index <= this.possibilties.length - 1) {
                this.setSelection(this.possibilties.at(new_index));
            }
        },
        up: function() {
            var i = this.possibilties.indexOf(this.getSelection());
            if(i > 0) {
                this.setSelection(this.possibilties.at(i - 1));
            } else {
                this.selection.deselect();
                this.selector_text.focus();
            }
        },
        renderFactInfo: function() {
            var m = this.getSelection();
            var v = new Facts.FactSelectorInfoView({model: m});
            this.fact_info.html(v.render().el);
        },
        insertSelection: function() {
            var selection = this.getSelection();
            this.hide();
            this.editor.replaceRange(selection.makeSignatureString(), this.cursor_pos);
        }
    });

    Facts.ModeView = Backbone.View.extend({
        el: $("#mode-view"),
        initialize: function() {
            Facts.Mode.bind('changed', this.render, this);
        },
        render: function() {
            this.$el.html(Facts.Mode.getMode());
        }
    });

    //noop
    Facts.Cursor = _.extend({
        statement: null,
        piece: null,
        setStatement: function(s){
            if(this.statement) {
                this.statement.deselect();
            }

            this.statement = s;
            this.statement.select();
            this.selectFirstEditablePiece(this.statement);
            this.trigger('changed');
        },
        setPiece: function(p){
            if(this.piece) {
                this.piece.deselect();
            }

            this.piece = p;
            this.piece.select();
            this.trigger('changed');
        },
        getStatement: function() {
            return this.statement;
        },
        getPiece: function() {
            return this.piece;
        },
        moveStatement: function(change_cb, cmp_cb) {
            var fact = Facts.SelectedFact.get();
            var statements = fact.getStatements();

            var i = statements.indexOf(this.getStatement());
            var changed = change_cb(i);
            if(cmp_cb(changed, statements)) {
                var changed_stmt = statements.at(changed);
                this.setStatement(changed_stmt);
            }
        },
        movePiece: function(change_cb, cmp_cb) {
            var pieces = this.getStatement().getPieces();

            var i = pieces.indexOf(this.getPiece());
            var changed = change_cb(i);
            if(cmp_cb(changed, pieces)) {
                var changed_piece = pieces[changed];
                this.setPiece(changed_piece);
            }
        }, 
        nextPiece: function() {
            return this.movePiece(function(i){
                return i + 1;
            }, function(changed, pieces) {
                return changed < pieces.length;
            });
        },
        previousPiece: function() {
            return this.movePiece(function(i){
                return i - 1;
            }, function(changed, pieces) {
                return changed > -1;
            });
        },
        nextStatement: function() {
            return this.moveStatement(function(i){
                return i + 1;
            }, function(changed, statements) {
                return changed < statements.length;
            });
        },
        previousStatement: function() {
            return this.moveStatement(function(i){
                return i - 1;
            }, function(changed, statements) {
                return changed > -1;
            });
        },
        selectFirstEditablePiece: function(statement) {
            var pieces = statement.getEditablePieces();
            this.setPiece(pieces[0]);
        }
    }, Backbone.Events);

    Facts.Mode = _.extend({
        m: "move",
        getMode: function() {
            return this.m;
        },
        setMode: function(m) {
            this.m = m;
            this.trigger('changed');
        },
        isMoveMode: function() {
            return this.getMode() == 'move';
        }
    }, Backbone.Events)

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
    Facts.TheCommandBar = new Facts.CommandBar();
    Facts.TheOutput = new Facts.Output();
    Facts.TheSelector = new Facts.Selector();
    Facts.TheModeView = new Facts.ModeView();

    Facts.AllFacts.bind('reset', function() {
        Facts.SelectedFact.set(Facts.AllFacts.at(0));
    });
    Facts.AllFacts.fetch();

    //Global keys
    Mousetrap.bind(":", function(){
        Facts.TheCommandBar.show();
    });
    
    Mousetrap.bind("up", function(){
        if(Facts.Mode.isMoveMode()) {
            Facts.Cursor.previousStatement();
        } else {
            Facts.TheSelector.up();
        }
    });

    Mousetrap.bind("down", function(){
        if(Facts.Mode.isMoveMode()) {
            Facts.Cursor.nextStatement();
        } else {
            Facts.TheSelector.down();
        }
    });

    Mousetrap.bind("left", function(){
        if(Facts.Mode.isMoveMode()) {
            Facts.Cursor.previousPiece();
        }
    });

    Mousetrap.bind("right", function(){
        if(Facts.Mode.isMoveMode()) {
            Facts.Cursor.nextPiece();
        }
    });

    Mousetrap.bind("enter", function(e){
        Facts.TheSelector.insertSelection();
        e.preventDefault();
    });

    Mousetrap.bind("esc", function(e){
        Facts.TheSelector.hide();
    });

    $(".escapable").live('keydown', function(e){
        if(e.keyCode == 27) {
            e.preventDefault();
            $(this).blur();
        }
    });

    Facts.Mode.setMode("move");
    $("body").focus();

    window.Facts = Facts;
});

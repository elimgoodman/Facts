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
        postInit: $.noop,
        setClassIf: function(if_cb, class_name) {
            if(if_cb()) {
                this.$el.addClass(class_name);
            } else {
                this.$el.removeClass(class_name);
            }
        },
        setSelectedClass: function() {
            var self = this;
            this.setClassIf(function() {
                return self.model.isSelected();
            }, 'selected');
        }
    });

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
            this.setSelectedClass();
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
            this.setSelectedClass();
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
    
    Facts.ValueHintView = Facts.MView.extend({
        tagname: 'li',
        className: 'value-hint',
        template: _.template($('#value-hint-tmpl').html()),
        postRender: function() {
            this.setSelectedClass();
        }
    });

    Facts.ValueHints = Backbone.View.extend({
        el: $("#value-hints"),
        initialize: function() {
            this.piece = null

            this.possibilty_list = this.$(".hint-possibilities");
            this.selected_hint = null;
        },
        setHint: function(hint) {
            if(this.selected_hint) {
                this.selected_hint.deselect();
            }
            this.selected_hint = hint;
            this.selected_hint.select();
        },
        setPiece: function(p) {
            this.piece = p;
            if(p.shouldShowHints()) {
                this.setHint(p.getHints()[0]);
            }
        },
        showBelow: function(node) {
            this.render();
            this.$el.show();
            this.reposition(node);
        },
        render: function() {
            this.possibilty_list.empty();
            var self = this;
            
            _.each(this.piece.getHints(), function(hint){
                var v = new Facts.ValueHintView({model: hint});
                self.possibilty_list.append(v.render().el);
            });
        },
        reposition: function(node) {
            var offset = $(node).offset();
            var top = offset.top + 30;
            this.$el.css('top', top + "px");

            var left = offset.left;
            this.$el.css('left', left + "px");
        },
        nextHint: function() {
            return this.moveHint(function(i){
                return i + 1;
            }, function(changed, pieces) {
                return changed < pieces.length;
            });
        },
        previousHint: function() {
            return this.moveHint(function(i){
                return i - 1;
            }, function(changed, pieces) {
                return changed >= 0;
            });
        },
        moveHint: function(change_cb, cmp_cb) {
            var hints = this.piece.getHints();

            var i = hints.indexOf(this.selected_hint);
            var changed = change_cb(i);
            if(cmp_cb(changed, hints)) {
                var changed_hint = hints[changed];
                this.setHint(changed_hint);
            }
        },
        selectHint: function() {
        
        }
    });

    Facts.StatementPieceView = Facts.MView.extend({
        className: 'statement-piece',
        tagName: 'span',
        template: _.template($('#statement-piece-tmpl').html()),
        events: {
            'keyup .piece-value': 'setValue'
        },
        setValue: function() {
            var piece_value = this.$('.piece-value');
            this.model.setValue(piece_value.val(), true);
        },
        postRender: function() {
            var piece_value = this.$('.piece-value');

            this.$el.addClass(this.model.getType());

            this.setSelectedClass();

            if(this.model.isSelected()) {
                //FIXME: this might be binding billions of times, whith
                //each keypress
                Facts.Mode.on('change', this.render, this);

                if(Facts.Mode.isMode('edit')) {
                    piece_value.focus();
                    Facts.TheValueHints.setPiece(this.model);

                    if(this.model.shouldShowHints()) {
                        Facts.TheValueHints.showBelow(this.el);
                    }
                }
            } else {
                Facts.Mode.off('change', this.render, this);
            }
        },
        getTemplateContext: function() {
            return _.extend(this.model.toJSON(), {
                value: this.model.getValue(),
                isEditable: this.isEditable()
            });
        },
        isEditable: function() {
            return this.model.isSelected() && Facts.Mode.isMode('edit');
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

            this.setSelectedClass();

            this.setClassIf(function() {
                return self.model.isPlaceholder();
            }, 'placeholder');

            this.setClassIf(function() {
                return self.model.isUnpopulated();
            }, 'unpopulated');

            if(this.model.isSelected() && this.model.isPlaceholder()) {
                Facts.Mode.setMode('selector');
                Facts.TheSelector.showBelow(this);
            }
        },
    });
    
    Facts.FactEditorView = Facts.MView.extend({
        tagName: 'div',
        className: 'fact-editor',
        template: _.template($('#fact-editor-tmpl').html()),
        postRender: function() {
            var statements = this.model.getStatements();

            var self = this;
            self.$el.empty();

            statements.each(function(stmt){
                var v = new Facts.StatementView({model: stmt});
                self.$el.append(v.render().el);
            });
        }
    });

    Facts.Editor = Backbone.View.extend({
        el: $("#statements"),
        initialize: function() {
            Facts.SelectedFact.bind('change', this.render, this);
        },
        render: function() {
            var fact = Facts.SelectedFact.get();
            var v = new Facts.FactEditorView({model: fact});
            this.$el.html(v.render().el);
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
            this.selector_text = this.$(".selector-text");
            this.possibilty_list = this.$(".selector-possibilities");
            this.fact_info = this.$(".selector-fact-info-container");

            this.possibilties = new Facts.FactCollection();
            this.possibilties.on('reset', this.renderPossibilities, this);

            this.statement_view = null;

            this.selection = null;
            this.on('selection-changed', this.renderFactInfo, this);
        },
        showBelow: function(statement_view) {
            this.statement_view = statement_view;

            this.$el.show();
            this.reposition(statement_view.el);
            this.selector_text.focus();
        },
        hide: function() {
            this.$el.hide();
            Facts.Mode.setMode('move');
            this.reset();
        },
        reset: function() {
            this.selector_text.val("");
            this.possibilty_list.empty();
            this.fact_info.empty();
        },
        reposition: function(node) {
            var offset = $(node).offset();
            var top = offset.top + 50;
            this.$el.css('top', top + "px");

            var left = offset.left - 10;
            this.$el.css('left', left + "px");
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

            var fact = Facts.SelectedFact.get();
            var statements = fact.getStatements();

            var i = statements.indexOf(this.statement_view.model);
            var stmt = new Facts.UnpopulatedStatement({fact: selection});

            statements.remove(this.statement_view.model);
            statements.add(stmt, {at: i});
            fact.setStatements(statements);

            Facts.Cursor.setStatement(stmt);

            this.hide();
        }
    });

    Facts.ModeView = Backbone.View.extend({
        el: $("#mode-view"),
        initialize: function() {
            Facts.Mode.bind('change', this.render, this);
        },
        render: function() {
            this.$el.html(Facts.Mode.getMode());
        }
    });

    Facts.Cursor = _.extend({
        statement: null,
        piece: null,
        setStatement: function(s){
            if(this.statement) {
                this.statement.deselect();
            }

            this.statement = s;
            this.statement.select();
            if(this.statement.isUnpopulated()) {
                this.selectPrimaryArg();
            } else {
                this.selectFirstEditablePiece();
            }
            this.trigger('change');
        },
        setPiece: function(p){
            if(this.piece) {
                this.piece.deselect();
            }

            this.piece = p;
            this.piece.select();
            this.trigger('change');
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
            var pieces = this.getStatement().getEditablePieces();

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
        setPieceAt: function(i) {
            var pieces = this.getStatement().getEditablePieces();
            if(pieces.length > 0){
                this.setPiece(pieces[i]);
            }
        },
        selectPrimaryArg: function() {
            this.setPieceAt(1);
        },
        selectFirstEditablePiece: function() {
            this.setPieceAt(0);
        },
        insertBelow: function() {
            var fact = Facts.SelectedFact.get();
            var statements = fact.getStatements();

            var i = statements.indexOf(this.getStatement());
            var stmt = new Facts.PlaceholderStatement;

            statements.add(stmt, {at: i + 1});

            fact.setStatements(statements);

            this.setStatement(stmt);
        }
    }, Backbone.Events);

    Facts.Mode = _.extend({
        m: "move",
        getMode: function() {
            return this.m;
        },
        setMode: function(m) {
            this.m = m;
            this.trigger('change', m);
        },
        isMoveMode: function() {
            return this.isMode('move');
        },
        isMode: function(mode) {
            return this.getMode() == mode;
        },
        switchToEditMode: function() {
            this.setMode('edit');
        }
    }, Backbone.Events)

    Facts.TheFactInfo = new Facts.FactInfo();
    Facts.TheFactList = new Facts.FactList();
    Facts.TheEditor = new Facts.Editor();
    Facts.TheCommandBar = new Facts.CommandBar();
    Facts.TheOutput = new Facts.Output();
    Facts.TheSelector = new Facts.Selector();
    Facts.TheValueHints = new Facts.ValueHints();
    Facts.TheModeView = new Facts.ModeView();

    Facts.AllFacts.bind('reset', function() {
        Facts.SelectedFact.set(Facts.AllFacts.at(0));
    });
    Facts.AllFacts.fetch();

    //Global keys

    var keys = {
        'move': {
            'up': _.bind(Facts.Cursor.previousStatement, Facts.Cursor),
            'down': _.bind(Facts.Cursor.nextStatement, Facts.Cursor),
            'left': _.bind(Facts.Cursor.previousPiece, Facts.Cursor),
            'right': _.bind(Facts.Cursor.nextPiece, Facts.Cursor),
            'o': _.bind(Facts.Cursor.insertBelow, Facts.Cursor),
            'e': _.bind(Facts.Mode.switchToEditMode, Facts.Mode)
        },
        'selector': {
            'up': _.bind(Facts.TheSelector.up, Facts.TheSelector),
            'down': _.bind(Facts.TheSelector.down, Facts.TheSelector),
            'enter': function(e) {
                Facts.TheSelector.insertSelection();
                e.preventDefault();
            },
            'esc': _.bind(Facts.TheSelector.hide, Facts.TheSelector)
        },
        'edit': {
            'tab': _.bind(Facts.Cursor.nextPiece, Facts.Cursor),
            'down': _.bind(Facts.TheValueHints.nextHint, Facts.TheValueHints),
            'up': _.bind(Facts.TheValueHints.previousHint, Facts.TheValueHints),
            'enter': _.bind(Facts.TheValueHints.selectHint, Facts.TheValueHints)
        }
    };
    
    var mappings_by_key = {};
    _.each(keys, function(mappings, mode){
        _.each(mappings, function(fn, key) {
            if(!_.has(mappings_by_key, key)) {
                mappings_by_key[key] = {};
            }

            mappings_by_key[key][mode] = fn;
        });
    });

    _.each(mappings_by_key, function(mappings, key) {
        Mousetrap.bind(key, function(e){
            _.each(mappings, function(fn, mode){
                if(Facts.Mode.isMode(mode)) {
                    fn(e);
                }
            });
        });
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

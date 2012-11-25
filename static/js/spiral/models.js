(function(){

    var Facts = window.Facts || {};

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
        },
        isPlaceholder: function() {
            return false;
        }
    });

    Facts.PlaceholderStatement = Facts.Statement.extend({
        initialize: $.noop,
        getPieces: function() {
            return [];
        },
        isPlaceholder: function() {
            return true;
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
        setStatements: function(statements) {
            this.statements = statements;
            this.trigger('change');
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

    window.Facts = Facts;
})();

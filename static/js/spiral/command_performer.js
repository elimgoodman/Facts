(function() {
    
    var Facts = window.Facts || {};

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
                console.error("INVALID PHRASE");
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

    window.Facts = Facts;
});


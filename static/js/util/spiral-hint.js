(function () {
    
    CodeMirror.balletHint = function(editor) {
        var $el = $("#selector").clone();
        var el = $el.get(0);

        var cursor_pos = editor.getCursor();
        $(".CodeMirror-cursor").addClass("selector-mode");
        editor.addWidget(cursor_pos, el)
        this.reposition(el);
        $el.show();

        $("*").blur();
        this.selector_text.focus();
        this.selector_text.keyup(function() {
            var txt = $(this).val();

            if(txt && txt.length > 1) {
                $.getJSON("/find_action", {txt: txt}, function(data) {
                    var actions = new Facts.FactCollection(data.resp);
                    console.log(actions);
                });
            }
        });
    };

    CodeMirror.balletHint.prototype = {
        reposition: function(node) {
            var current_top = $(node).css('top');
            var top_num = parseInt(current_top.split('p')[0]);
            top_num += 20;
            $(node).css('top', top_num + "px");

            var current_left = $(node).css('left');
            var left_num  = parseInt(current_left.split('p')[0]);
            left_num -= 10;
            $(node).css('left', left_num + "px");
        }
    };
})();

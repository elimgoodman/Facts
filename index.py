from flask import Flask, render_template, request
import lang.plyer as plyer
import lang.exprs as exprs
from librarian import Librarian, FactEncoder
import simplejson as json
import datetime
from werkzeug import Response
from lang.output import StdOut as std

def jsonify(*args, **kwargs):
    """ jsonify with support for MongoDB ObjectId
    """
    return Response(json.dumps(dict(*args, **kwargs), cls=FactEncoder), mimetype='application/json')

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.jinja')

@app.route('/facts')
def get_all_facts():
    librarian = Librarian.Instance()

    return jsonify(resp=librarian.get_all())

@app.route('/fact', methods=["POST", "PUT"])
def create_or_update_fact():
    librarian = Librarian.Instance()

    name = request.json['name']
    body = request.json['body']
    fact_type = request.json['fact_type']
    metadata = request.json['metadata']

    if request.json.has_key('fact_id'):
        fact_id = request.json['fact_id']
        f = librarian.update(fact_id, name, fact_type, body, metadata)
    else:
        f = librarian.create(name, fact_type, body, metadata)

    return jsonify(resp=f)


@app.route("/find_action")
def find_action():
    librarian = Librarian.Instance()

    return jsonify(resp=librarian.get_by_type('fn'))

@app.route("/execute", methods=['POST'])
def execute():
    connect()

    #build up scope
    scope = {}
    facts_not_main = facts.Fact.objects(fact_type__ne='main_block')
    for fact in facts_not_main:
        plyer.lexer.input(fact.body)
        statements = plyer.parser.parse(fact.body, lexer=plyer.lexer)

        #FIXME: varname hack
        #FIXME: eval hack, this is awful
        param_set = exprs.NamedParamSet()
        params = fact.parseParamsFromMetadata()
        for name, typ in params.iteritems():
            param_obj = exprs.NamedParam(name, typ)
            param_set.add(param_obj)

        fn_def = exprs.FunctionDef(param_set, statements)
        
        #I'm pretty sure I have to build up the scope and then map 
        #through everything with eval and that scope
        scope["$" + fact.name] = fn_def.evaluate({})

    (main_block, created) = facts.Fact.objects.get_or_create(fact_type="main_block")
    data = main_block.body

    plyer.lexer.input(data)

    try:
        parsed = plyer.parser.parse(data, lexer=plyer.lexer)
        parsed.evaluate(scope)
    except plyer.ParseError as e:
        return jsonify(success=False, line_no=e.line_no, elem=e.elem)

    return jsonify(success=True, output=std.flush())

if __name__ == '__main__':
    app.run(debug=True)


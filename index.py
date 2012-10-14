from flask import Flask, render_template, request
import lang.plyer as plyer
import lang.exprs as exprs
import mongoengine as mongo
import facts
import simplejson as json
import datetime
from bson.objectid import ObjectId
from werkzeug import Response
from lang.output import StdOut as std

class MongoJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        type(obj)
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        elif isinstance(obj, ObjectId):
            return unicode(obj)
        elif isinstance(obj, mongo.Document):
            return obj._data
        elif isinstance(obj, mongo.queryset.QuerySet):
            return list(obj)
        return json.JSONEncoder.default(self, obj)

def jsonify(*args, **kwargs):
    """ jsonify with support for MongoDB ObjectId
    """
    return Response(json.dumps(dict(*args, **kwargs), cls=MongoJsonEncoder), mimetype='application/json')

app = Flask(__name__)

def connect():
    return mongo.connect('facts')

@app.route('/')
def index():
    connect()

    return render_template('index.jinja')

@app.route('/facts')
def get_all_facts():
    connect()

    #FIXME: this probably sux
    #we always need a main block...
    (main_block, created) = facts.Fact.objects.get_or_create(fact_type="main_block")
    if created:
        main_block.name = "main"
        main_block.body = ""
        main_block.save()
        return jsonify(resp=[main_block])
    else:
        return jsonify(resp=facts.Fact.objects)

@app.route('/fact', methods=["POST", "PUT"])
def create_or_update_fact():
    connect()

    if request.json.has_key('fact_id'):
        fact_id = request.json['fact_id']
        (f, _) = facts.Fact.objects.get_or_create(fact_id=fact_id)
    else:
        f = facts.Fact()

    f.name = request.json['name']
    f.body = request.json['body']
    f.fact_type = request.json['fact_type']
    f.save()

    return jsonify(resp=f)


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
        fn_def = exprs.FunctionDef(exprs.ParamList(), statements)
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


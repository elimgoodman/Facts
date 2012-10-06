from flask import Flask, render_template, request
import lang.plyer as plyer
import mongoengine as mongo
import facts
import simplejson as json
import datetime
from bson.objectid import ObjectId
from werkzeug import Response

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

    main_block = facts.Fact.objects.get(fact_type="main_block")
    return render_template('index.jinja', main_body=main_block.body)

@app.route('/facts')
def get_all_facts():
    connect()
    return jsonify(resp=facts.Fact.objects)

@app.route("/execute", methods=['POST'])
def execute():
    connect()

    data = request.form['code']
    
    (main_block, _) = facts.Fact.objects.get_or_create(fact_type="main_block")
    main_block.name = "main"
    main_block.body = data
    main_block.save()

    plyer.lexer.input(data)

    try:
        parsed = plyer.parser.parse(data, lexer=plyer.lexer)
    except plyer.ParseError as e:
        return jsonify(success=False, line_no=e.line_no, elem=e.elem)

    return jsonify(success=True)

if __name__ == '__main__':
    app.run(debug=True)


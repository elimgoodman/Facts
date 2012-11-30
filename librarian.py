from singleton import Singleton
import md5
from path import path as path_mod
import simplejson as json
import datetime
from lang.exprs import Params, Param, Expr
import lang.plyer as plyer

class Fact:

    def __init__(self, name, fact_type, body, metadata = {}):
        self.fact_id = md5.new(name + fact_type).hexdigest()
        self.fact_type = fact_type
        self.name = name
        self.body = body
        self.metadata = metadata

    def to_json(self):
        return self.__dict__
    
    @classmethod
    def from_file(cls, path):
        divider = "--"
        f = file(path)
        lines = f.readlines()
        body = []
        metadata = {}
        for line in lines:
            line = line.strip()
            if line.find(divider) == 0:
                (_, info) = line.split(divider)
                info = info.strip()
                info_dict = json.loads(info)
                fact_type = info_dict['fact_type']
                name = info_dict['name']
                metadata = info_dict

            else:
                body.append(line)

        #FIXME: make this a factory of sorts
        return Fn(name, fact_type, "\n".join(body), metadata)

    def get_path(self):
        return "%s.spiral" % (self.name)

class Fn(Fact):

    def to_json(self):
        #FIXME: why doesn't this work?
        #data = super(Fn, self).to_json()
        data = self.__dict__
        data['signature'] = self.parse_params_from_metadata()
        data['statements'] = self.get_statements()
        return data

    def parse_params_from_metadata(self):
        #TODO: make sure the current fact is the right type,
        #has valid metadata
        params = Params(None)
        if self.metadata.has_key('takes') and self.metadata['takes']:
            for pair in self.metadata['takes'].split(","):
                (name, typ) = pair.split(":")
                p = Param(name, typ)
                if not params.primary:
                    params.primary = p
                else:
                    params.additional.append(p)

        return params
    
    def get_statements(self):
        plyer.lexer.input(self.body)
        statements = plyer.parser.parse(self.body, lexer=plyer.lexer)

        return statements

class FactEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        elif isinstance(obj, Fact):
            return obj.to_json()
        elif isinstance(obj, Expr):
            return obj.to_json()

        return json.JSONEncoder.default(self, obj)

@Singleton
class Librarian:

    def __init__(self, p="/Users/eligoodman/dev/Facts/sample-project"):
        self.facts = self.ingest_all_at_path(p)
        self.path = p

    def get_all(self):
        return self.facts.values()
    
    def get_by_id(self, fact_id):
        return self.facts[fact_id]
    
    def get_by_type(self, typ):
        return filter(lambda f: f.fact_type == typ, self.get_all())
    
    def create(self, name, fact_type, body, metadata):
        f = Fact(name, fact_type, body, metadata)
        self.facts[f.fact_id] = f
        self.write(f)
        return f

    def update(self, fact_id, name, fact_type, body, metadata):
        f = self.get_by_id(fact_id)
        f.name = name
        f.fact_type = fact_type
        f.body = body
        f.metadata = metadata
        self.write(f)
        return f

    def write(self, fact):
        path = fact.get_path()
        abs_path = path_mod(self.path) / path
        f = file(abs_path, 'w')
        data = fact.metadata
        data['fact_type'] = fact.fact_type
        data['name'] = fact.name
        f.write("-- %s\n" % (json.dumps(data)))
        f.write(fact.body)
        f.close()


    def ingest_all_at_path(self, path):
        facts = {}
        p = path_mod(path)

        for f in p.files():
            fact = Fact.from_file(f)
            facts[fact.fact_id] = fact

        return facts

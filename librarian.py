from singleton import Singleton
import md5
from path import path as path_mod
import simplejson as json
import datetime

class Fact:

    def __init__(self, fact_type, name, body, metadata = {}):
        self.fact_id = md5.new(name + fact_type).hexdigest()
        self.fact_type = fact_type
        self.name = name
        self.body = body
        self.metadata = metadata

    def parseParamsFromMetadata(self):
        #TODO: make sure the current fact is the right type,
        #has valid metadata
        params = {}
        if self.metadata.has_key('takes') and self.metadata['takes']:
            for pair in self.metadata['takes'].split(","):
                (name, typ) = pair.split(":")
                params[name.strip()] = typ.strip()

        return params
    
    def toJSON(self):
        data = self.__dict__
        return data

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
        
        return Fact(fact_type, name, "\n".join(body), metadata)

class FactEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        elif isinstance(obj, Fact):
            return obj.toJSON()

        return json.JSONEncoder.default(self, obj)

@Singleton
class Librarian:

    def __init__(self, path="/Users/eli/dev/facts/sample-project"):
        self.facts = self.ingest_all_at_path(path)

    def get_all(self):
        return self.facts
    
    def get_by_type(self, typ):
        return filter(lambda f: f.fact_type == typ, self.facts)

    def ingest_all_at_path(self, path):
        facts = []
        p = path_mod(path)

        for f in p.files():
            fact = Fact.from_file(f)
            facts.append(fact)

        return facts

import mongoengine as mongo

class Fact(mongo.Document):
    fact_id = mongo.SequenceField()
    fact_type = mongo.StringField()
    name = mongo.StringField()
    body = mongo.StringField()
    metadata = mongo.DictField()

    def parseParamsFromMetadata(self):
        #TODO: make sure the current fact is the right type,
        #has valid metadata
        params = {}
        if self.metadata.has_key('takes'):
            for pair in self.metadata['takes'].split(","):
                (name, typ) = pair.split(":")
                params[name.strip()] = typ.strip()

        return params


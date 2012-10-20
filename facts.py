import mongoengine as mongo

class Fact(mongo.Document):
    fact_id = mongo.SequenceField()
    fact_type = mongo.StringField()
    name = mongo.StringField()
    body = mongo.StringField()
    metadata = mongo.DictField()


import mongoengine as mongo

class Fact(mongo.Document):
    fact_type = mongo.StringField()
    name = mongo.StringField()
    body = mongo.StringField()


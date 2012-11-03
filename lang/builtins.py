from lang.types import Types
import lang.exprs as e
import sys

class Builtins(object):

    def get_builtins(self):

        return {
            'add': self.make_add()
        }

    def make_add(self):
        #TODO: generalize
        p1 = e.Param('a', 'Int')
        p2 = e.Param('to', 'Int')
        p = e.Params(p1, [p2])
        def add_inner(a=None, to=None, **kwargs):
            return a + to

        return e.NativeFunctionDef(p, add_inner, Types.INT)

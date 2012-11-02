import lang.exprs as e
import sys

class Builtins(object):

    def get_builtins(self):

        return {
            'write': self.make_write(),
            'console': sys.stdout
        }

    def make_write(self):
        #TODO: generalize
        p = e.Params('String', {'to': 'Console'})
        def write_inner(thing, to=None):
            to.write(str(thing))

        return e.NativeFunctionDef(p, write_inner)

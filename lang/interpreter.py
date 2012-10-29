import lang.exprs as e
from lang.output import StdOut as std

class Interpreter(object):

    def __init__(self): pass

    def interpet(self, stmt_list, scope):

        for stmt in stmt_list.statements:
            t = type(stmt)

            if t is e.PrintStmt:
                #FIXME: this is awful
                txt = self.evaluate(stmt.value, scope)
                std.writeLn(txt)
            elif t is e.Assignment:
                scope[stmt.left.get_name()] = self.evaluate(stmt.right, scope)
            elif t is e.ReturnStmt:
                return self.evaluate(stmt.value, scope)
            else:
                raise Exception("Unknown stmt: %s" % stmt)

    def evaluate(self, expr, scope):

        t = type(expr)

        if t is e.Number:
            return expr.value
        elif t is e.String:
            return expr.value
        elif t is e.Varname:
            return scope[expr.name]
        elif t is e.FunctionEval:
            #TODO Params, scope
            promise = scope[expr.fn_var_name.get_name()]
            return self.interpet(promise.fn_def.statements, scope)
        else:
            raise Exception("Unknown expr: %s" % expr)

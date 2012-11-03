import lang.exprs as e
from lang.builtins import Builtins
from lang.output import StdOut as std

class Interpreter(object):

    def __init__(self): pass

    def interpet(self, stmt_list, scope):
        b = Builtins()
        scope.update(b.get_builtins())

        for stmt in stmt_list.statements:
            t = type(stmt)

            if t is e.Assignment:
                scope[stmt.symbol.value] = self.evaluate(stmt.value, scope)
            elif t is e.ReturnStmt:
                return self.evaluate(stmt.value, scope)
            elif t is e.AgentEval:
                return self.evaluate(stmt.fn_eval, scope)
            else:
                raise Exception("Unknown stmt: %s" % stmt)

    def evaluate(self, expr, scope):

        t = type(expr)
        
        literals = (e.Number, e.String)
    
        if t in literals:
            return expr.value
        elif t is e.Symbol:
            return scope[expr.value]
        elif t is e.FunctionEval:
            fn_def = scope[expr.fn_var_name.value]
            self.bring_args_into_scope(fn_def, expr, scope)
    
            fn_type = type(fn_def)

            if fn_type is e.FunctionDef:
                return self.interpet(fn_def.statements, scope)
            elif fn_type is e.NativeFunctionDef:
                return fn_def.native_fn(**scope)
        else:
            raise Exception("Unknown expr: %s" % expr)

    def bring_args_into_scope(self, fn_def, fn_eval, scope):

        args = fn_eval.get_args()

        #primary
        primary_name = fn_def.params.primary.name
        primary_expr = args['primary']

        scope[primary_name] = self.evaluate(primary_expr, scope)

        #additional
        for param in fn_def.params.additional:
            name = param.name
            expr = args['additional'][name]

            scope[name] = self.evaluate(expr, scope)

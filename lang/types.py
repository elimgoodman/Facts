import lang.exprs as e

class TypecheckerResult(object):

    def __init__(self):
        self.errors = []

    def add_error(self):
        self.errors.append(True)

    def has_errors(self):
        return len(self.errors) > 0

class Types(object):
    (INT, STRING) = ('Int', 'String')

    TYPES_TO_EXPRS = {
        INT: e.Number,
        STRING: e.String
    }

class Typechecker(object):

    def __init__(self): pass

    def check(self, parsed, scope):
        res = TypecheckerResult()
        for stmt in parsed.statements:
            t = type(stmt)
            if t == e.FunctionEval:
                fn_def = scope[stmt.fn_var_name.value]
                params = fn_def.params
                args = stmt.get_args()

                passed = self.check_type_of_expr(args['primary'], params.primary.typ)
                if not passed:
                    res.add_error()

                for param in params.additional:
                    arg = args['named'][param.name]
                    passed = self.check_type_of_expr(arg, param.typ)
                    if not passed:
                        res.add_error()

        return res

    def check_type_of_expr(self, expr, typ):
        expected_expr = Types.TYPES_TO_EXPRS[typ]
        return type(expr) is expected_expr

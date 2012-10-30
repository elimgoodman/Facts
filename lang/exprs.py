from lang.output import StdOut as std

class Expr(object): pass

class StatementList(Expr):

    def __init__(self):
        self.statements = []

    def append(self, stmt):
        self.statements.append(stmt)

    def __repr__(self):
        out = "(STMTS: \n"
        for stmt in self.statements:
            out += "%s\n" % (stmt)
        out += ")"
        return out
    
class ReturnStmt(Expr):
        
    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return "(RETURN %s)" % (self.value)

class Assignment(Expr):

    def __init__(self, symbol, value):
        self.symbol = symbol
        self.value = value

    def __repr__(self):
        return "(ASSIGNMENT: %s = %s)" % (self.symbol, self.value)

class ArgName(Expr):

    def __init__(self, name):
        self.name = name

    def evaluate(self, scope):
        print "evaled"
        pass

    def get_name(self):
        return self.name

    def __repr__(self):
        return "(ARG_NAME: %s)" % (self.name)

class Symbol(Expr):

    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return "(SYMBOL: %s)" % (self.value)

class Number(Expr):

    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return "(NUMBER: %d)" % (self.value)

class String(Expr):

    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return "(STR: \"%s\")" % (self.value)

class FunctionDef(Expr):

    def __init__(self, params, statements):
        self.params = params
        self.statements = statements
    
    def evaluate(self, scope):
        return FunctionPromise(scope, self)

    def __repr__(self):
        return "(FN_DEF: %s -> %s)" % (self.params, self.statements)

class FunctionEval(Expr):

    def __init__(self, fn_var_name, args):
        self.fn_var_name = fn_var_name
        self.args = args

    def get_args(self):
        return self.args.format_args()

    def __repr__(self):
        return "(FN_EVAL: %s <- %s)" % (self.fn_var_name, self.args)

class Params(object):

    def __init__(self, primary_type, named_types = {}):
        self.primary_type = primary_type
        self.named_types = named_types

    def __repr__(self):
        return "(PARAMS: primary: %s, named: %s)" % (self.primary_type, self.named_types)

class ArgList(Expr):

    def __init__(self):
        self.args = []

    def append(self, arg):
        self.args.append(arg)

    def prepend(self, arg):
        self.args.insert(0, arg)

    def format_args(self):
        primary = self.args[0]
        return {
            'primary': primary,
            'named': {}
        }

    def __repr__(self):
        return "(ARG_LIST: %s)" % (self.args)

class NamedArg(Expr):

    def __init__(self, name, value):
        self.arg_name = name
        self.value = value

    def __repr__(self):
        return "%s => %s" % (self.arg_name, self.value)

from lang.output import StdOut as std

class Expr(object):

    def to_json(self):
        return self.__dict__

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

class NativeFunctionDef(Expr):

    def __init__(self, params, native_fn, return_type):
        self.params = params
        self.native_fn = native_fn
        self.return_type = return_type
    
    def __repr__(self):
        return "(NATIVE_FN_DEF: %s -> lambda)" % (self.params)

class AgentEval(Expr):

    def __init__(self, fn_eval):
        self.fn_eval = fn_eval

    def __repr__(self):
        return "(AGENT_EVAL: %s)" % (self.fn_eval)

class FunctionDef(Expr):

    def __init__(self, params, statements, return_type):
        self.params = params
        self.statements = statements
        self.return_type = return_type
    
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

class Param(Expr):

    def __init__(self, name, typ):
        self.name = name
        self.typ = typ

    def __repr__(self):
        return "(PARAM: %s:%s)" % (self.name, self.typ)

class Params(Expr):

    def __init__(self, primary, additional = []):
        self.primary = primary
        self.additional = additional

    def __repr__(self):
        return "(PARAMS: primary: %s, additional: %s)" % (self.primary, self.additional)

class ArgList(Expr):

    def __init__(self):
        self.args = []

    def append(self, arg):
        self.args.append(arg)

    def prepend(self, arg):
        self.args.insert(0, arg)

    def format_args(self):
        primary = self.args[0]

        additional = {}
        for additional_arg in self.args[1:]:
            additional[additional_arg.arg_name.value] = additional_arg.value

        return {
            'primary': primary,
            'additional': additional
        }

    def __repr__(self):
        return "(ARG_LIST: %s)" % (self.args)

class NamedArg(Expr):

    def __init__(self, name, value):
        self.arg_name = name
        self.value = value

    def __repr__(self):
        return "%s => %s" % (self.arg_name, self.value)

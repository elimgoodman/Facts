from lang.output import StdOut as std

class Expr(object):

    def evaluate(self, scope):
        raise NotImplementedError("Unevaluable! in %s" % (self.__class__.__name__))

class StatementList(Expr):

    def __init__(self):
        self.statements = []

    def append(self, stmt):
        self.statements.append(stmt)

    def evaluate(self, scope):
        for stmt in self.statements:
            stmt.evaluate(scope)

    def __repr__(self):
        out = "(STMTS: \n"
        for stmt in self.statements:
            out += "%s\n" % (stmt)
        out += ")"
        return out
    
class PrintStmt(Expr):
        
    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return "(PRINT %s)" % (self.value)

    def evaluate(self, scope):
       txt = self.value.evaluate(scope)
       std.writeLn(txt)

class Assignment(Expr):

    def __init__(self, left, right):
        self.left = left
        self.right = right

    def __repr__(self):
        return "%s = %s" % (self.left, self.right)

    def evaluate(self, scope):
        scope[self.left.get_name()] = self.right.evaluate(scope)

class Varname(Expr):

    def __init__(self, name):
        self.name = name

    def evaluate(self, scope):
        return scope[self.name]

    def get_name(self):
        return self.name

    def __repr__(self):
        return "(VAR: %s)" % (self.name)

class Number(Expr):

    def __init__(self, value):
        self.value = value

    def evaluate(self, scope):
        return self.value

    def __repr__(self):
        return "(NUM: %d)" % (self.value)

class String(Expr):

    def __init__(self, value):
        self.value = value

    def evaluate(self, scope):
        return self.value

    def __repr__(self):
        return "(STR: \"%s\")" % (self.value)

class FunctionPromise(Expr):
    
    def __init__(self, scope, fn_def):
        self.scope = scope
        self.fn_def = fn_def

    def evaluate(self, scope):
        scope.update(self.scope)
        self.fn_def.statements.evaluate(scope)

    def __repr__(self):
        return "(FN_PROMISE: %s WITH %s)" % (self.fn_def, self.scope)

class FunctionDef(Expr):

    def __init__(self, params, statements):
        self.params = params
        self.statements = statements
    
    def evaluate(self, scope):
        return FunctionPromise(scope, self)

    def __repr__(self):
        return "(FN: %s -> %s)" % (self.params, self.statements)

class FunctionEval(Expr):

    def __init__(self, fn_var_name, args):
        self.fn_var_name = fn_var_name
        self.args = args
    
    def evaluate(self, scope):
        promise = scope[self.fn_var_name.get_name()]
        scope = self.bring_args_into_scope(scope, promise.fn_def.params, self.args)
        return promise.evaluate(scope)

    def bring_args_into_scope(self, scope, params, args):

        i = 0
        for param in params.params:
            scope[param.get_name()] = args.args[i].evaluate(scope)
            i = i + 1

        return scope

    def __repr__(self):
        return "(EVAL FN: %s <- %s)" % (self.fn_var_name, self.args)

class ParamList(Expr):

    def __init__(self):
        self.params = []

    def append(self, param):
        self.params.append(param)

    def __repr__(self):
        return "(PARAMS: %s)" % (self.params)

class ArgList(Expr):

    def __init__(self):
        self.args = []

    def append(self, arg):
        self.args.append(arg)

    def __repr__(self):
        return "(ARGS: %s)" % (self.args)


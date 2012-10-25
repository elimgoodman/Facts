import unittest
import lang.plyer as plyer
import lang.exprs as e
import lang.typechecker as t

class TestPly(unittest.TestCase):

    def setUp(self):
        pass
    
    def testFnCallWithOneNamedArg(self):
        parsed = self.parse('$foo{#bar: "baz"}')
        args = parsed.statements[0].args
        self.assertEqual(1, len(args.args))
        self.assertEqual(e.NamedFuncArg, type(args.args[0]))

    def testFnCallWithManyNamedArgs(self):
        parsed = self.parse('$foo{#bar: "baz", #boink: "blerg"}')
        args = parsed.statements[0].args
        self.assertEqual(2, len(args.args))
        self.assertEqual(e.NamedFuncArg, type(args.args[0]))
        self.assertEqual(e.NamedFuncArg, type(args.args[1]))

    def testFnCallReal(self):
        parsed = self.parse('$sayHello{#name: "Eli", #age: 27}')
        parsed = self.parse('''print "Greetz"''')

    def testFnCallNoParams(self):
        parsed = self.parse('''$sayBye()''')

    def testTypecheckWorks(self):
        parsed = self.parse('$foo{#some_int: 2}')

        param_set = e.NamedParamSet()
        param_obj = e.NamedParam('#some_int', 'Int')
        param_set.add(param_obj)

        scope = {
            '$foo': e.FunctionDef(param_set, e.StatementList()).evaluate({})
        }

        self.execute(parsed, scope)

    def parse(self, data):
        plyer.lexer.input(data)
        return plyer.parser.parse(data, lexer=plyer.lexer)

    def typecheck(self, parsed, scope):
        c = t.Typechecker()
        return c.check(parsed, scope)
    
    def execute(self, parsed, scope):
        return parsed.evaluate(scope)

if __name__ == '__main__':
    unittest.main()

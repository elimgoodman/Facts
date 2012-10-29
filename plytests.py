import unittest
import lang.plyer as plyer
import lang.exprs as e
from lang.types import Typechecker
from lang.interpreter import Interpreter
from lang.output import StdOut as std

class TestPly(unittest.TestCase):

    def setUp(self):
        std.flush()
    
    def tearDown(self):
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

        res = self.typecheck(parsed, scope)
        self.assertEqual(False, res.has_errors())

    def testTypecheckFailsParamCheck(self):
        parsed = self.parse('$foo{#some_string: 2}')

        param_set = e.NamedParamSet()
        param_obj = e.NamedParam('#some_string', 'String')
        param_set.add(param_obj)

        scope = {
            '$foo': e.FunctionDef(param_set, e.StatementList()).evaluate({})
        }

        res = self.typecheck(parsed, scope)
        self.assertEqual(True, res.has_errors())

    def testReturnStmt(self):
        main = self.parse('$a = $foo()\nprint $a')
        fn_body = self.parse('return "Hello world"')

        scope = {
            '$foo': e.FunctionDef(e.ParamList(), fn_body).evaluate({})
        }
        
        self.interpet(main, scope)
        self.assertEqual("Hello world\n", std.flush())

    def testReturnExitsFn(self):
        main = self.parse('$a = $foo()\nprint $a')
        fn_body = self.parse('return "Hello world"\nprint "Foo"')

        scope = {
            '$foo': e.FunctionDef(e.ParamList(), fn_body).evaluate({})
        }
        
        self.interpet(main, scope)
        self.assertEqual("Hello world\n", std.flush())

    def testInterpretPrintNumber(self):
        main = self.parse('print 2')

        self.interpet(main, {})
        self.assertEqual("2\n", std.flush())

    def testInterpretPrintString(self):
        main = self.parse('print "Hello"')

        self.interpet(main, {})
        self.assertEqual("Hello\n", std.flush())

    def testInterpretAssignment(self):
        main = self.parse('$a = "Hello"\nprint $a')

        self.interpet(main, {})
        self.assertEqual("Hello\n", std.flush())

    def parse(self, data):
        plyer.lexer.input(data)
        return plyer.parser.parse(data, lexer=plyer.lexer)

    def typecheck(self, parsed, scope):
        c = Typechecker()
        return c.check(parsed, scope)
    
    def interpet(self, parsed, scope):
        i = Interpreter()
        i.interpet(parsed, scope)

if __name__ == '__main__':
    unittest.main()

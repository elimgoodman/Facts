import unittest
import lang.plyer as plyer
import lang.exprs as e
from lang.types import Typechecker, Types
from lang.interpreter import Interpreter
from lang.output import StdOut as std

class TestPly(unittest.TestCase):

    def setUp(self):
        std.flush()
    
    def tearDown(self):
        pass

    def testTypecheckWorksSimple(self):
        parsed = self.parse('foo 2')
        
        params = e.Params(Types.INT)

        scope = {
            'foo': e.FunctionDef(params, e.StatementList())
        }

        res = self.typecheck(parsed, scope)
        self.assertEqual(False, res.has_errors())

    def testTypecheckFailsParamCheck(self):
        parsed = self.parse('foo 2')

        param_set = e.NamedParamSet()
        param_obj = e.NamedParam('#some_string', 'String')
        param_set.add(param_obj)

        scope = {
            '$foo': e.FunctionDef(param_set, e.StatementList()).evaluate({})
        }

        res = self.typecheck(parsed, scope)
        self.assertEqual(True, res.has_errors())
    
    def testNewStyleFnCallOneParamParses(self):
        parsed = self.parse('foo 2')
        statement = parsed.statements[0]
        self.assertEqual(type(statement), e.FunctionEval)

    def testNewStyleFnCallTwoParamsParses(self):
        parsed = self.parse('foo 2 and: 3')
        statement = parsed.statements[0]
        self.assertEqual(type(statement), e.FunctionEval)

    def testNewStyleFnCallThreeParamsParses(self):
        parsed = self.parse('foo 2 and: 3 andAlso: 4')
        statement = parsed.statements[0]
        self.assertEqual(type(statement), e.FunctionEval)

    def testNewStyleFnCallOneParamAndAssign(self):
        parsed = self.parse('foo 2 -> bar')
        statement = parsed.statements[0]
        self.assertEqual(type(statement), e.Assignment)

    def testNewStyleFnCallTwoParamAndAssign(self):
        parsed = self.parse('foo 2 and: 3 -> bar')
        statement = parsed.statements[0]
        print statement
        self.assertEqual(type(statement), e.Assignment)

    def testNewStyleReturnerSimpleExpr(self):
        parsed = self.parse('"foo" ->>')
        statement = parsed.statements[0]
        self.assertEqual(type(statement), e.ReturnStmt)

    def testNewStyleReturnerComplexExpr(self):
        parsed = self.parse('foo 3 and: "bar" ->>')
        statement = parsed.statements[0]
        self.assertEqual(type(statement), e.ReturnStmt)

    def testNewStyleFnCallTakesSymbolAsParam(self):
        parsed = self.parse('foo 3 and: baz')
        statement = parsed.statements[0]
        self.assertEqual(type(statement), e.FunctionEval)

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

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
        
        param = e.Param('some_var', Types.INT)
        params = e.Params(param)

        scope = {
            'foo': e.FunctionDef(params, e.StatementList(), Types.NONE)
        }

        res = self.typecheck(parsed, scope)
        self.assertEqual(False, res.has_errors())

    def testTypecheckFailsParamCheck(self):
        parsed = self.parse('foo 2')

        param = e.Param('some_var', Types.STRING)
        params = e.Params(param)

        scope = {
            'foo': e.FunctionDef(params, e.StatementList(), Types.NONE)
        }

        res = self.typecheck(parsed, scope)
        self.assertEqual(True, res.has_errors())
    

    def testTypecheckFailsNamedParamCheck(self):
        parsed = self.parse('foo 2 and: 3')

        param = e.Param('some_var', Types.INT)
        param2 = e.Param('and', Types.STRING)
        params = e.Params(param, [param2])

        scope = {
            'foo': e.FunctionDef(params, e.StatementList(), Types.NONE)
        }

        res = self.typecheck(parsed, scope)
        self.assertEqual(True, res.has_errors())

    def testTypecheckPassesNamedParamCheck(self):
        parsed = self.parse('foo 2 and: 3')

        param = e.Param('some_var', Types.INT)
        param2 = e.Param('and', Types.INT)
        params = e.Params(param, [param2])

        scope = {
            'foo': e.FunctionDef(params, e.StatementList(), Types.NONE)
        }

        res = self.typecheck(parsed, scope)
        self.assertEqual(False, res.has_errors())

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
        self.assertEqual(type(statement), e.Assignment)

    def testAgentCall(self):
        parsed = self.parse('[foo a]')
        statement = parsed.statements[0]
        self.assertEqual(type(statement), e.AgentEval)

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

    def testMultipleStmts(self):
        main = self.parse('foo 2 -> a\nfoo 2')
        self.assertEqual(2, len(main.statements))

    def testVarAsPrimaryArg(self):
        main = self.parse('foo some_var')
        self.assertEqual(1, len(main.statements))
    
    #def testSimplePrint(self):
        #main = self.parse('[write "Hello" to: console]')
        #self.interpet(main, {})
        #self.assertEqual("Hello\n", std.flush())

    def testReturnStmt(self):
        main = self.parse('2 ->>')
        
        i = self.interpet(main, {})
        self.assertEqual(2, i)

    def testReturnExitsFn(self):
        main = self.parse('2 ->>\n3 ->>')
        
        i = self.interpet(main, {})
        self.assertEqual(2, i)

    def testInterpretAssignment(self):
        main = self.parse('2 -> a\na ->>')

        i = self.interpet(main, {})
        self.assertEqual(2, i)

    def testReturnFromFn(self):
        main = self.parse('foo 2 ->>')
        fn_body = self.parse('some_var ->>')

        param = e.Param('some_var', Types.INT)
        params = e.Params(param)

        scope = {
            'foo': e.FunctionDef(params, fn_body, Types.NONE)
        }

        i = self.interpet(main, scope)
        self.assertEqual(2, i)

    def testAdditionalParamsPulledIntoScope(self):
        main = self.parse('foo 2 and: 3 ->>')
        fn_body = self.parse('and ->>')

        param = e.Param('some_var', Types.INT)
        param2 = e.Param('and', Types.STRING)
        params = e.Params(param, [param2])

        scope = {
            'foo': e.FunctionDef(params, fn_body, Types.NONE)
        }

        i = self.interpet(main, scope)
        self.assertEqual(3, i)

    def testNativeFn(self):
        main = self.parse('add 2 to: 3 ->>')

        i = self.interpet(main, {})
        self.assertEqual(5, i)

    #def testReturnTypecheckWorks(self):
        #main = self.parse('foo 2 ->>')
        #fn_body = self.parse('x ->>')

        #param = e.Param('x', Types.INT)
        #params = e.Params(param, [])

        #scope = {
            #'foo': e.FunctionDef(params, fn_body, Types.INT)
        #}

        #res = self.typecheck(main, scope)
        #self.assertEqual(False, res.has_errors())

    #def testReturnTypecheckFails(self):
        #main = self.parse('foo 2 ->>')
        #fn_body = self.parse('x ->>')

        #param = e.Param('x', Types.INT)
        #params = e.Params(param, [])

        #scope = {
            #'foo': e.FunctionDef(params, fn_body, Types.STRING)
        #}

        #res = self.typecheck(main, scope)
        #self.assertEqual(True, res.has_errors())

    def parse(self, data):
        plyer.lexer.input(data)
        return plyer.parser.parse(data, lexer=plyer.lexer)

    def typecheck(self, parsed, scope):
        c = Typechecker()
        return c.check(parsed, scope)
    
    def interpet(self, parsed, scope):
        t = self.typecheck(parsed, scope)
        if t.has_errors():
            raise Exception("Failed typechecking!")
        i = Interpreter()
        return i.interpet(parsed, scope)

if __name__ == '__main__':
    unittest.main()

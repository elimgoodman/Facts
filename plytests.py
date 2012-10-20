import random
import unittest
import lang.plyer as plyer
import lang.exprs as e

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

    def parse(self, data):
        plyer.lexer.input(data)
        return plyer.parser.parse(data, lexer=plyer.lexer)

if __name__ == '__main__':
    unittest.main()

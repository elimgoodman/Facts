import random
import unittest
import lang.plyer as plyer

class TestPly(unittest.TestCase):

    def setUp(self):
        pass
    
    def testFoo(self):
        print(self.exec("$a = 1"))

    def exec(self, data):
        plyer.lexer.input(data)
        return plyer.parser.parse(data, lexer=plyer.lexer)
if __name__ == '__main__':
    unittest.main()

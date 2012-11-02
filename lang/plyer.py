import exprs as e

class ParseError(Exception):

    def __init__(self, line_no, elem):
        self.line_no = line_no
        self.elem = elem
    
    def __str__(self):
        return "%s at line %d" % (self.elem, self.line_no)
    
debug = False

tokens = (
    'SYMBOL',
    'NUMBER',
    'STRING',
    'RETURNER',
    'ASSIGNER',
    )

# Tokens

literals = [':', '[', ']']

t_RETURNER = r'->>'
t_ASSIGNER = r'->'
t_STRING = r'\"([^\\\n]|(\\.))*?\"'

def t_SYMBOL(t):
    r'[a-z][a-zA-Z0-9\-_]*'
    t.value = e.Symbol(t.value)
    return t

def t_NUMBER(t):
    r'\d+'
    try:
        t.value = int(t.value)
    except ValueError:
        print("Integer value too large %d", t.value)
        t.value = 0
    return t

# Ignored characters
t_ignore = " \t"

def t_newline(t):
    r'\n+'
    t.lexer.lineno += t.value.count("\n")

def t_error(t):
    print("Illegal character '%s'" % t.value[0])
    t.lexer.skip(1)
    
# Build the lexer
import ply.lex as lex
lexer = lex.lex(debug=debug)

def create_or_append(p, klass, primary_pos, secondary_pos):

    if len(p) == 2 and p[1]:
        p[0] = klass()
        stmt = p[primary_pos]
        p[0].append(stmt)
    elif len(p) == (secondary_pos + 1):
        p[0] = p[primary_pos]
        if not p[0]: p[0] = klass()
        if p[secondary_pos]:
            stmt = p[secondary_pos]
            p[0].append(stmt)

def p_statement_list(p):
    '''statement_list : statement_list statement
               | statement'''
    create_or_append(p, e.StatementList, 1, 2)

def p_statement_return(t):
    'statement : expression RETURNER'

    t[0] = e.ReturnStmt(t[1])

def p_statement_assign(t):
    '''statement : expression ASSIGNER SYMBOL'''
    t[0] = e.Assignment(t[3], t[1])

#FIXME: not actually a valid statement...
def p_statement_execute_fn(t):
    '''statement : execute_fn '''
    t[0] = t[1]

def p_statement_execute_agent(t):
    '''statement : '[' execute_fn ']' '''
    t[0] = e.AgentEval(t[2])

def p_expression_number(t):
    'expression : NUMBER'
    t[0] = e.Number(t[1])

def p_expression_string(t):
    '''expression : STRING'''
    
    t[0] = e.String(t[1][1:-1])

def p_execute_fn_one_arg(t):
    '''execute_fn : SYMBOL expression '''
    args = e.ArgList()
    args.append(t[2])
    t[0] = e.FunctionEval(t[1], args)

def p_named_arg(t):
    '''named_arg : SYMBOL ':' expression '''

    t[0] = e.NamedArg(t[1], t[3])

def p_named_args(t):
    '''named_args : named_args named_arg
                    | named_arg'''
    create_or_append(t, e.ArgList, 1, 2)

def p_execute_fn_many_args(t):
    '''execute_fn : SYMBOL expression named_args'''
    # add the unnamed arg to the beginning of the arg list
    t[3].prepend(t[2])
    t[0] = e.FunctionEval(t[1], t[3])

def p_expression_execute_fn(t):
    '''expression : execute_fn '''
    t[0] = t[1]

def p_expression_symbol(t):
    '''expression : SYMBOL '''
    t[0] = t[1]

def p_error(t):
    if t is not None:
       raise ParseError(t.lexer.lineno, t.value)
    else:
        print "Bonkers stuff is happening..." 

import ply.yacc as yacc
parser = yacc.yacc(debug=debug)

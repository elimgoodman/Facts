import exprs as e

class ParseError(Exception):

    def __init__(self, line_no, elem):
        self.line_no = line_no
        self.elem = elem

debug = False

tokens = (
    'VARNAME',
    'NUMBER',
    'PRINT', #FIXME: this should just be a function/part of module
    'STRING',
    'FUNCTION'
    )

# Tokens

literals = ['=', '(', ')', '{', '}', ',']

t_PRINT = r'print'
t_FUNCTION = r'function'
t_STRING = r'\"([^\\\n]|(\\.))*?\"'

def t_VARNAME(t):
    r'\$[a-zA-Z_][a-zA-Z0-9_]*'
    t.value = e.Varname(t.value)
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

# Parsing rules

#precedence = (
    #('left','PLUS','MINUS'),
    #('left','TIMES','DIVIDE'),
    #('right','UMINUS'),
    #)

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

def p_statement_print(t):
    'statement : PRINT expression'

    t[0] = e.PrintStmt(t[2])

def p_statement_assign(t):
    '''statement : VARNAME '=' expression'''
    t[0] = e.Assignment(t[1], t[3])

def p_func_params(p):
    '''func_params : func_params ',' VARNAME
                    | VARNAME '''

    create_or_append(p, e.ParamList, 1, 3)

def p_expression_function_def(t):
    '''expression : FUNCTION '(' func_params ')' '{' statement_list '}' '''
    t[0] = e.FunctionDef(t[3], t[6])

def p_expression_varname(t):
    'expression : VARNAME'
    t[0] = t[1]

def p_expression_number(t):
    'expression : NUMBER'
    t[0] = e.Number(t[1])

def p_expression_string(t):
    '''expression : STRING'''
    
    t[0] = e.String(t[1][1:-1])

def p_func_args(t):
    '''func_args : func_args ',' expression
                    | expression '''

    create_or_append(t, e.ArgList, 1, 3)

def p_execute_fn(t):
    '''execute_fn : VARNAME '(' func_args ')' '''
    t[0] = e.FunctionEval(t[1], t[3])

def p_statement_execute_fn(t):
    '''statement : execute_fn '''
    t[0] = t[1]

def p_expression_execute_fn(t):
    '''expression : execute_fn '''
    t[0] = t[1]

def p_error(t):
    if t is not None:
       raise ParseError(t.lexer.lineno, t.value)
    else:
        print "Bonkers stuff is happening..." 

import ply.yacc as yacc
parser = yacc.yacc(debug=debug)


# parsetab.py
# This file is automatically generated. Do not edit.
_tabversion = '3.2'

_lr_method = 'LALR'

_lr_signature = '\x85\x1b\x92J\x08\x9eJ0$\xa4m\xd5\xdd\xce\xc0H'
    
_lr_action_items = {'STRING':([0,1,2,3,4,5,7,8,9,10,11,14,15,16,17,18,19,20,],[7,-13,7,-5,-2,7,-6,-14,-7,-1,-3,-11,-12,-4,7,-10,7,-8,]),'ASSIGNER':([1,3,6,7,8,9,14,15,18,19,20,],[-14,-5,12,-6,-14,-7,-11,-12,-10,-9,-8,]),'SYMBOL':([0,1,2,3,4,5,7,8,9,10,11,12,14,15,16,17,18,19,20,],[2,-13,2,-5,-2,2,-6,-14,13,-1,-3,16,-11,13,-4,19,-10,2,-8,]),'NUMBER':([0,1,2,3,4,5,7,8,9,10,11,14,15,16,17,18,19,20,],[3,-13,3,-5,-2,3,-6,-14,-7,-1,-3,-11,-12,-4,3,-10,3,-8,]),'RETURNER':([1,3,6,7,8,9,14,15,18,19,20,],[-14,-5,11,-6,-14,-7,-11,-12,-10,-9,-8,]),':':([13,],[17,]),'$end':([1,3,4,5,7,8,9,10,11,14,15,16,18,19,20,],[-13,-5,-2,0,-6,-14,-7,-1,-3,-11,-12,-4,-10,-9,-8,]),}

_lr_action = { }
for _k, _v in _lr_action_items.items():
   for _x,_y in zip(_v[0],_v[1]):
      if not _x in _lr_action:  _lr_action[_x] = { }
      _lr_action[_x][_k] = _y
del _lr_action_items

_lr_goto_items = {'named_arg':([9,15,],[14,18,]),'execute_fn':([0,2,5,17,19,],[1,8,1,8,8,]),'named_args':([9,],[15,]),'statement':([0,5,],[4,10,]),'statement_list':([0,],[5,]),'expression':([0,2,5,17,19,],[6,9,6,20,9,]),}

_lr_goto = { }
for _k, _v in _lr_goto_items.items():
   for _x,_y in zip(_v[0],_v[1]):
       if not _x in _lr_goto: _lr_goto[_x] = { }
       _lr_goto[_x][_k] = _y
del _lr_goto_items
_lr_productions = [
  ("S' -> statement_list","S'",1,None,None,None),
  ('statement_list -> statement_list statement','statement_list',2,'p_statement_list','/Users/eli/dev/facts/lang/plyer.py',73),
  ('statement_list -> statement','statement_list',1,'p_statement_list','/Users/eli/dev/facts/lang/plyer.py',74),
  ('statement -> expression RETURNER','statement',2,'p_statement_return','/Users/eli/dev/facts/lang/plyer.py',78),
  ('statement -> expression ASSIGNER SYMBOL','statement',3,'p_statement_assign','/Users/eli/dev/facts/lang/plyer.py',83),
  ('expression -> NUMBER','expression',1,'p_expression_number','/Users/eli/dev/facts/lang/plyer.py',87),
  ('expression -> STRING','expression',1,'p_expression_string','/Users/eli/dev/facts/lang/plyer.py',91),
  ('execute_fn -> SYMBOL expression','execute_fn',2,'p_execute_fn_one_arg','/Users/eli/dev/facts/lang/plyer.py',96),
  ('named_arg -> SYMBOL : expression','named_arg',3,'p_named_arg','/Users/eli/dev/facts/lang/plyer.py',100),
  ('named_arg -> SYMBOL : SYMBOL','named_arg',3,'p_named_arg','/Users/eli/dev/facts/lang/plyer.py',101),
  ('named_args -> named_args named_arg','named_args',2,'p_named_args','/Users/eli/dev/facts/lang/plyer.py',105),
  ('named_args -> named_arg','named_args',1,'p_named_args','/Users/eli/dev/facts/lang/plyer.py',106),
  ('execute_fn -> SYMBOL expression named_args','execute_fn',3,'p_execute_fn_many_args','/Users/eli/dev/facts/lang/plyer.py',110),
  ('statement -> execute_fn','statement',1,'p_statement_execute_fn','/Users/eli/dev/facts/lang/plyer.py',116),
  ('expression -> execute_fn','expression',1,'p_expression_execute_fn','/Users/eli/dev/facts/lang/plyer.py',120),
]

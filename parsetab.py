
# parsetab.py
# This file is automatically generated. Do not edit.
_tabversion = '3.2'

_lr_method = 'LALR'

_lr_signature = "S\xe3\xbd\x83\x80\xf4\xff[pM\x1a\xd1\xc1\x1dq'"
    
_lr_action_items = {'STRING':([0,1,2,3,4,5,8,9,10,11,13,14,17,18,19,20,21,22,23,],[8,-5,8,-7,-2,8,-8,-14,-9,-1,8,-3,-12,-13,-6,-4,8,-11,-10,]),'ASSIGNER':([1,2,3,7,8,9,10,17,18,22,23,],[-14,-15,-7,15,-8,-14,-9,-12,-13,-11,-10,]),'SYMBOL':([0,1,2,3,4,5,6,8,9,10,11,13,14,15,17,18,19,20,21,22,23,],[2,-5,2,-7,-2,2,13,-8,-14,16,-1,2,-3,20,-12,16,-6,-4,2,-11,-10,]),'NUMBER':([0,1,2,3,4,5,8,9,10,11,13,14,17,18,19,20,21,22,23,],[3,-5,3,-7,-2,3,-8,-14,-9,-1,3,-3,-12,-13,-6,-4,3,-11,-10,]),'RETURNER':([1,2,3,7,8,9,10,17,18,22,23,],[-14,-15,-7,14,-8,-14,-9,-12,-13,-11,-10,]),'[':([0,1,2,3,4,5,8,9,10,11,14,17,18,19,20,22,23,],[6,-5,-15,-7,-2,6,-8,-14,-9,-1,-3,-12,-13,-6,-4,-11,-10,]),':':([16,],[21,]),']':([2,3,8,9,10,12,17,18,22,23,],[-15,-7,-8,-14,-9,19,-12,-13,-11,-10,]),'$end':([1,2,3,4,5,8,9,10,11,14,17,18,19,20,22,23,],[-5,-15,-7,-2,0,-8,-14,-9,-1,-3,-12,-13,-6,-4,-11,-10,]),}

_lr_action = { }
for _k, _v in _lr_action_items.items():
   for _x,_y in zip(_v[0],_v[1]):
      if not _x in _lr_action:  _lr_action[_x] = { }
      _lr_action[_x][_k] = _y
del _lr_action_items

_lr_goto_items = {'named_arg':([10,18,],[17,22,]),'execute_fn':([0,2,5,6,13,21,],[1,9,1,12,9,9,]),'named_args':([10,],[18,]),'statement':([0,5,],[4,11,]),'statement_list':([0,],[5,]),'expression':([0,2,5,13,21,],[7,10,7,10,23,]),}

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
  ('statement -> execute_fn','statement',1,'p_statement_execute_fn','/Users/eli/dev/facts/lang/plyer.py',88),
  ('statement -> [ execute_fn ]','statement',3,'p_statement_execute_agent','/Users/eli/dev/facts/lang/plyer.py',92),
  ('expression -> NUMBER','expression',1,'p_expression_number','/Users/eli/dev/facts/lang/plyer.py',96),
  ('expression -> STRING','expression',1,'p_expression_string','/Users/eli/dev/facts/lang/plyer.py',100),
  ('execute_fn -> SYMBOL expression','execute_fn',2,'p_execute_fn_one_arg','/Users/eli/dev/facts/lang/plyer.py',105),
  ('named_arg -> SYMBOL : expression','named_arg',3,'p_named_arg','/Users/eli/dev/facts/lang/plyer.py',111),
  ('named_args -> named_args named_arg','named_args',2,'p_named_args','/Users/eli/dev/facts/lang/plyer.py',116),
  ('named_args -> named_arg','named_args',1,'p_named_args','/Users/eli/dev/facts/lang/plyer.py',117),
  ('execute_fn -> SYMBOL expression named_args','execute_fn',3,'p_execute_fn_many_args','/Users/eli/dev/facts/lang/plyer.py',121),
  ('expression -> execute_fn','expression',1,'p_expression_execute_fn','/Users/eli/dev/facts/lang/plyer.py',127),
  ('expression -> SYMBOL','expression',1,'p_expression_symbol','/Users/eli/dev/facts/lang/plyer.py',131),
]

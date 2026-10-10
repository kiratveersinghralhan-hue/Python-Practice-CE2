import json,random,sys,io,contextlib
from pathlib import Path
random.seed(42)
Q=[]
def add(topic,question,options,correct,explanation,difficulty='easy',code=None):
 assert len(options)==4 and len(set(map(str,options)))==4 and 0<=correct<4
 Q.append(dict(id=f'py-{len(Q)+1:03}',topic=topic,prompt=question,options=[str(x) for x in options],correct=correct,explanation=explanation,difficulty=difficulty,**({'code':code} if code else {})))
def output(topic,code,wrong,difficulty='medium'):
 buffer=io.StringIO()
 with contextlib.redirect_stdout(buffer): exec(compile(code,'<question>','exec'),{})
 right=buffer.getvalue().strip() or '(no output)'
 opts=[right]+list(dict.fromkeys(str(x) for x in wrong if str(x)!=right))
 for fallback in ['0','1','2','3','4','False','True','(no output)','error','99','-1','[]']:
  if len(opts)>=4:break
  if fallback not in opts:opts.append(fallback)
 opts=opts[:4]
 random.shuffle(opts)
 add(topic,'What is printed by this code?',opts,opts.index(right),f'Python executes the statements in order. The exact printed output is {right!r}.',difficulty,code)
# 1 variable/operator output 30
for a in range(2,12):
 output('Variables & operators',f'x = {a}\ny = 3\nprint(x + y * 2)',[str((a+3)*2),str(a+3),str(a*3+2)])
 output('Variables & operators',f'x = {a}\nprint(x // 3)',[str(a/3),str(a%3),str(a//2)])
 output('Variables & operators',f'x = {a}\nprint(x % 3)',[str(a//3),str(a%2),str(a)])
# 2 boolean 24
for a in range(2,10):
 output('Boolean & comparison',f'x = {a}\nprint(x > 5 and x < 9)', ['True' if a>5 else 'False','None','0'], 'easy') if False else None
 # explicitly unique boolean distractors
 add('Boolean & comparison',f'For x = {a}, what does `x >= 5 and x < 8` evaluate to?', ['True','False','None','SyntaxError'],0 if 5<=a<8 else 1,f'Both conditions must be true for `and`. Here {a} >= 5 is {a>=5} and {a} < 8 is {a<8}.')
 add('Boolean & comparison',f'For x = {a}, what does `x < 4 or x > 7` evaluate to?', ['True','False','None','SyntaxError'],0 if a<4 or a>7 else 1,'`or` is true when at least one condition is true.')
 add('Boolean & comparison',f'For x = {a}, what does `not (x == 6)` evaluate to?', ['True','False','None','SyntaxError'],0 if a!=6 else 1,'`not` reverses the Boolean result of the comparison.')
# 3 decisions 24
for a in range(1,9):
 code=f'x = {a}\nif x % 2 == 0:\n    print("even")\nelse:\n    print("odd")'
 output('Conditions',code,['even' if a%2 else 'odd','both','(no output)'])
 code=f'marks = {a*10}\nif marks >= 70:\n    print("A")\nelif marks >= 40:\n    print("B")\nelse:\n    print("C")'
 output('Conditions',code,['A','B','C'] if False else [v for v in ['A','B','C','D'] if v!= ('A' if a>=7 else 'B' if a>=4 else 'C')][:3])
 code=f'x = {a}\nif x > 3:\n    if x > 6:\n        print("high")\n    else:\n        print("mid")\nelse:\n    print("low")'
 output('Conditions',code,[v for v in ['high','mid','low','none'] if v!=('high' if a>6 else 'mid' if a>3 else 'low')][:3])
# 4 ranges 30
for n in range(3,13):
 output('For loops & range',f'print(list(range({n})))',[str(list(range(1,n))),str(list(range(n+1))),str(n)])
 output('For loops & range',f'print(list(range(1, {n}, 2)))',[str(list(range(1,n+1,2))),str(list(range(0,n,2))),str(list(range(1,n)))])
 output('For loops & range',f'total = 0\nfor i in range({n}):\n    total += i\nprint(total)',[str(n*(n+1)//2),str(n),str((n-1)*n//2+1)])
# 5 while 22
for n in range(3,14):
 output('While loops',f'x = {n}\nwhile x > 0:\n    x -= 2\nprint(x)',[str(n%2),str(n),str(n-2)])
 output('While loops',f'x = 0\nwhile x < {n}:\n    x += 2\nprint(x)',[str(n),str(n+2),str(n-1)])
# 6 nested 20
for a in range(2,12):
 output('Nested loops',f'count = 0\nfor i in range({a}):\n    for j in range(3):\n        count += 1\nprint(count)',[str(a+3),str(a*2),str(a)])
 output('Nested loops',f'for i in range(2):\n    for j in range({a}):\n        pass\nprint(i, j)',[f'2 {a}',f'1 {a}',f'0 {a-1}'])
# 7 trace 20
for n in range(2,12):
 output('Output tracing',f'x = {n}\nx += 3\nx *= 2\nprint(x)',[str(n+6),str(n*2+3),str(n+3)])
 output('Output tracing',f'a = {n}\nb = a\na = a + 1\nprint(b)',[str(n+1),str(n-1),'None'])
# 8 break continue pass 20
for n in range(5,15):
 output('Break, continue & pass',f'total = 0\nfor x in range({n}):\n    if x == 3:\n        break\n    total += x\nprint(total)',[str(n*(n-1)//2),str(3+2+1),str(n)])
 output('Break, continue & pass',f'total = 0\nfor x in range({n}):\n    if x % 2 == 0:\n        continue\n    total += 1\nprint(total)',[str(n//2),str(n),str(n-1)])
# 9 errors 20
cases=[('print(unknown_name)','NameError','`unknown_name` has not been defined.'),('print(1 / 0)','ZeroDivisionError','Division by zero raises ZeroDivisionError.'),('print(int("hello"))','ValueError','The string cannot be converted to an integer.'),('print([1, 2][5])','IndexError','Index 5 is outside the list.'),('if True print(1)','SyntaxError','The if statement requires a colon and a valid suite.'),('if True:\nprint(1)','IndentationError','The block after an if statement must be indented.'),('print("hello"','SyntaxError','A closing parenthesis is missing.'),('x = 4\nprint(x + "2")','TypeError','Python cannot add int and str directly.'),('for x in range(2):\n    pass\nprint(x)','no error','After the loop, x retains its final value.'),('x = 5\nif x = 5:\n    print(x)','SyntaxError','Assignment = cannot be used as an if condition.')]
for code,answer,expl in cases:
 options=['SyntaxError','IndentationError','NameError','TypeError','ValueError','IndexError','ZeroDivisionError','no error']
 for version in range(2):
  distract=[x for x in options if x!=answer]
  random.shuffle(distract)
  opts=[answer]+distract[:3];random.shuffle(opts)
  add('Errors & exceptions',f'What happens when this snippet runs?'+(' Choose the most specific answer.' if version else ''),opts,opts.index(answer),expl,'medium',code)
# 10 debugging 20
for n in range(2,12):
 add('Debugging',f'You want to print numbers 0 through {n} inclusive. Which range is correct?',[f'range({n})',f'range({n+1})',f'range(1, {n})',f'range({n+2})'],1,f'The stop of range is excluded, so range({n+1}) includes {n}.')
 add('Debugging',f'A counter starts at 0 and must stop when it reaches {n}. Which condition runs while it is still below the target?',[f'counter < {n}',f'counter > {n}',f'counter == {n}',f'counter != 0'],0,'Use < to repeat only while counter has not reached the target.')
# 11 boundaries 20
for n in range(2,12):
 add('Boundary cases',f'How many times does `for i in range({n}, {n}):` execute?',['0','1',str(n),'infinite'],0,'An empty range has no elements because start equals stop.')
 add('Boundary cases',f'What is the last number in `range(0, {n*2}, 2)`?',[str(n*2),str(n*2-2),str(n*2-1),str(n*2+2)],1,'The stop is excluded, so the last even number is two less than the stop.')
# weed duplicate code/questions / bad distractors: generated 270
seen=set()
for q in Q:
 key=(q['prompt'],q.get('code',''))
 assert key not in seen,key
 seen.add(key)
assert len(Q)>=200
Path('data/questions.json').write_text(json.dumps(Q,indent=2,ensure_ascii=False))
print('Generated',len(Q),'questions; all output code evaluated in real Python')

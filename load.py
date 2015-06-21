#!/usr/local/bin/python
# Usage:
# $ ./search.sh > frp.txt
# $ ./load.py

import json
with open('frp.out.txt', 'w') as w:
  def process(d):
    global errors
    for k in d.keys():
      e = d[k]
      if type(e)==dict:
        if 'text' in e:
          w.write(e['text'].encode('utf-8'))
        process(e)
      elif type(e)==list:
        for x in e:
          process(x)

  with open('frp.txt') as f:
    data = json.load(f)
    #import ipdb; ipdb.set_trace()
    process(data)


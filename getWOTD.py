#!/usr/bin/env python

import os
from urllib import urlopen
from datetime import date, timedelta
from threading import Thread

# The word url has a pattern
# http://www.merriam-webster.com/word-of-the-day/2011/11/01/
prefix = 'http://www.merriam-webster.com/word-of-the-day/'
start = date(2006, 9, 1)
end = date.today()

nthreads = 20
threads = [None] * nthreads
thread = 0


def get_wotd(day, filename):
    content = urlopen(prefix + day.strftime('%Y/%m/%d/')).read()

    f = open(filename, 'w')
    f.write(content)
    f.close()

    print 'Wrote:', filename


def date_range(start, end):
    for n in range(int((end - start).days)):
        yield start + timedelta(n)


for day in date_range(start, end):
    if threads[thread] is not None:
        threads[thread].join()

    dir = day.strftime('%Y/%m')
    try:
        os.makedirs(dir)
    except: pass
    filename = dir + day.strftime('/wotd-%Y%m%d.html')

    if os.path.exists(filename): continue

    threads[thread] = Thread(target = get_wotd, args = [day, filename])
    threads[thread].start()

    thread = thread + 1 if thread != nthreads -1 else 0

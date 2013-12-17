#!/usr/bin/env python

import os
from datetime import date, timedelta
from lxml import etree
from lxml.cssselect import CSSSelector
from xml.etree import ElementTree
import json
import re


start = date(2006, 9, 1)
end = date.today()

word_sel = CSSSelector('.main_entry_word')
audio_path = "//a[contains(@href, 'audio.php')]"
audio_re = re.compile(r'audio\.php\?file=([^&]*)\&')
pron_sel = CSSSelector('.pron')
func_sel = CSSSelector('.word_function')
def_sel = CSSSelector('.sblk,.sense-block-one')
sense_sel = CSSSelector('.ssens')
examples_sel = CSSSelector('.word_example_didu')
examples_path = "//*[contains(@class, 'word_example_didu')]"
etymology_path = \
    "//div[@class='sidexside' and */@class='word_example_didu']"

def date_range(start, end):
    for n in range(int((end - start).days)):
        yield start + timedelta(n)


def elem_to_string(e):
    return ''.join(map(ElementTree.tostring, e)).strip()


entries = []

for day in date_range(start, end):
    filename = day.strftime('%Y/%m/wotd-%Y%m%d.html')

    if not os.path.exists(filename): continue

    print 'Processing', filename

    parser = etree.HTMLParser(recover = True, remove_comments = True)
    html = etree.parse(open(filename, 'r'), parser).getroot()

    data = {}

    data['date'] = day.strftime('%Y/%m/%d')
    data['word'] = word_sel(html)[0].text

    try:
        audio = html.xpath(audio_path)[0]
        audio = audio_re.search(audio.attrib['href']).group(1)
        data['audio'] = audio
    except: pass

    data['pron'] = pron_sel(html)[0].text.strip()
    data['func'] = func_sel(html)[0].text.strip()

    data['def'] = []
    for d in def_sel(html):
        senses = []

        for s in sense_sel(d):
            text = elem_to_string(s)
            if text: senses.append(text)
            elif s.text.strip(): senses.append(s.text.strip())

        if len(senses): data['def'].append(senses)

    if not len(data['def']):
        print 'Skipping, no def'
        continue

    examples = examples_sel(html)

    examples[0].attrib.clear()
    data['examples'] = ElementTree.tostring(examples[0])

    etymology = examples[1]
    while etymology is not None:
        text = ''.join(etymology.itertext()).strip()
        if text != '': break
        etymology = etymology.getnext()

    etymology.attrib.clear()
    data['etymology'] = ElementTree.tostring(etymology)

    entries.append(data)


f = open('wotd.json', 'w')
json.dump(entries, f)
f.close()

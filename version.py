import glob
import pdb
import re

my_path = '.'

# get a list of all the files that are not hidden and in the allowed file types
files = glob.glob(my_path + '*', recursive=True)

for file in files:
    print(file)
    if re.match('(^[.]|[/][.]).+', file):
        continue # hidden path
    print(file)


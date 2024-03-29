import glob
import pdb
import re
from datetime import datetime
currentDateAndTime = datetime.now()

now_s = currentDateAndTime.strftime("%Y%m%d%H%M%S")

my_path = '.'

# get a list of all the files that are not hidden and in the allowed file types
files = glob.glob(my_path + '/**/*', recursive=True)
fourteen = '\+'

for file in files:
    try:
        if re.match('(^[.][^/]|[/][.]).+', file):
            continue # hidden path
        if re.match('.*[.]ver$', file):
            continue # a backup
        isMatch = False
        with open(file) as f:
            lines = f.readlines()
            # if file == './app/index.html':
            #     pdb.set_trace()
            for line in lines:
                if re.match('.*version=.*', line):
                    isMatch = True
                    break
        if not isMatch:
            continue  # no chance to have verison=...
        print (f"sed -i.ver 's/version=[0-9]{fourteen}/version={now_s}/g' {file}")
    except Exception:
        pass


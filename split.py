import os, re
src_file = r'D:\21.Anti\side-web\side-web\ai_tools_site\src\AI_Tools_20260312.md'

with open(src_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Split by `## ` (level 2 headings)
sections = re.split(r'\n## ', content)
header = sections[0]
for i in range(1, len(sections)):
    sec_content = sections[i]
    lines = sec_content.split('\n')
    title = lines[0].strip()
    
    safe_title = title.replace('、', '_').replace('，', '_').replace(',', '_').replace('/', '_').replace(':', '_')
    if safe_title.startswith('4_'):
        safe_title = '4.' + safe_title[2:]
        title = '4.' + title[2:]
    
    filename = f'0{i}_{safe_title}.md'
    filepath = os.path.join(r'D:\21.Anti\side-web\side-web\ai_tools_site\src', filename)
    
    # Clean up back links inside the page content
    page_content = '\n'.join(lines[1:])
    page_content = re.sub(r'\[🔙 返回目錄\]\(#toc\)', '', page_content)
    page_content = re.sub(r'<a id=\"\d+-sec\"></a>\n', '', page_content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('# ' + title + '\n\n')
        f.write(page_content)

os.remove(src_file)
print("Split successful")

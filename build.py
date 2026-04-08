import os
import json
import re

def parse_md(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the first H1
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else os.path.basename(filepath)

    # Find H2/H3 for quick nav (only capture text)
    headings = []
    for match in re.finditer(r'^(##{1,2})\s+(.+)$', content, re.MULTILINE):
        level = len(match.group(1))
        # Remove any bold/italic markers in heading just in case
        text = re.sub(r'[*_]', '', match.group(2)).strip()
        headings.append({"level": level, "text": text})

    return {
        "file": os.path.basename(filepath),
        "title": title,
        "content": content,
        "headings": headings
    }

def build_units(src_dir):
    units = []
    unit_id = 1
    
    # 获取來源資料夾所有 .md 檔，排除特定不相關檔案如 SKILL.md 等，或者都可以包括
    # 若有 README.md 可優先放在最前面
    files = [f for f in os.listdir(src_dir) if f.lower().endswith('.md')]
    # 略過自動產生的工作區說明
    ignores = ['task.md', 'implementation_plan.md', 'walkthrough.md', 'SKILL.md']
    files = [f for f in files if f not in ignores]
    files.sort()
    
    for filename in files:
        filepath = os.path.join(src_dir, filename)
        parsed = parse_md(filepath)
        short_title = parsed["title"][:15] + "..." if len(parsed["title"]) > 15 else parsed["title"]
        
        units.append({
            "id": f"unit_{unit_id}",
            "file": filename,
            "title": parsed["title"],
            "shortTitle": short_title,
            "isGroup": False,
            "parent": None,
            "content": parsed["content"],
            "headings": parsed["headings"]
        })
        unit_id += 1
        
    return units

if __name__ == "__main__":
    import sys
    work_dir = os.path.dirname(os.path.abspath(__file__))
    if len(sys.argv) > 1:
        root_dir = os.path.abspath(sys.argv[1])
    else:
        root_dir = os.path.dirname(work_dir)
    
    data_dir = os.path.join(work_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    units = build_units(root_dir)
    
    # 為了避免 emoji 在 windows cp950 print 出現編碼錯誤，我們使用 json.dumps 確保 unicode 正常
    js_content = f"window.UNITS_DATA = {json.dumps(units, ensure_ascii=False)};\n"
    out_path = os.path.join(data_dir, "units.js")
    
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    # 因為是產生網頁的過程，印出成功訊息 (避免 cp950 error)
    print(f"Success! Generate units.js with {len(units)} markdown files.")

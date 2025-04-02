import json
import os

# JSONファイルを読み込む
with open('src/quizData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# カテゴリーごとにファイルを作成
for category_key, category_data in data['categories'].items():
    category_file = f'src/data/categories/{category_key}.json'
    with open(category_file, 'w', encoding='utf-8') as f:
        json.dump(category_data, f, ensure_ascii=False, indent=2)

# インデックスファイルを作成
index_data = {
    "categories": {
        key: {
            "name": value["name"],
            "file": f"categories/{key}.json"
        }
        for key, value in data['categories'].items()
    }
}

with open('src/data/index.json', 'w', encoding='utf-8') as f:
    json.dump(index_data, f, ensure_ascii=False, indent=2) 
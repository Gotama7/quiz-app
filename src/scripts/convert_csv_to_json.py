import csv
import json
from collections import defaultdict
import sys
import os

def convert_csv_to_json(csv_file_path, output_dir):
    # カテゴリーとサブカテゴリーのデータを格納する辞書
    categories = defaultdict(lambda: {
        "name": "",
        "subcategories": defaultdict(lambda: {
            "name": "",
            "questions": []
        })
    })
    
    # CSVファイルを読み込む
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            category_id = row['category_id']
            subcategory_id = row['subcategory_id']
            
            # カテゴリー名とサブカテゴリー名を設定
            categories[category_id]['name'] = row['category_name']
            categories[category_id]['subcategories'][subcategory_id]['name'] = row['subcategory_name']
            
            # 問題データを作成
            question_data = {
                'question': row['question'],
                'correct': row['correct_answer'],
                'distractors': [
                    row['distractor1'],
                    row['distractor2'],
                    row['distractor3']
                ]
            }
            
            # 問題をサブカテゴリーに追加
            categories[category_id]['subcategories'][subcategory_id]['questions'].append(question_data)
    
    # カテゴリーごとにJSONファイルを作成
    for category_id, category_data in categories.items():
        category_file = f'{output_dir}/categories/{category_id}.json'
        with open(category_file, 'w', encoding='utf-8') as f:
            json.dump(category_data, f, ensure_ascii=False, indent=2)
    
    # インデックスファイルを作成
    index_data = {
        "categories": {
            category_id: {
                "name": category_data["name"],
                "file": f"categories/{category_id}.json"
            }
            for category_id, category_data in categories.items()
        }
    }
    
    with open(f'{output_dir}/index.json', 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("使用方法: python convert_csv_to_json.py <CSVファイルのパス>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    if not os.path.exists(csv_file_path):
        print(f"エラー: ファイル {csv_file_path} が見つかりません")
        sys.exit(1)
    
    output_dir = 'src/data'
    convert_csv_to_json(csv_file_path, output_dir)
    print(f"変換が完了しました。出力ディレクトリ: {output_dir}") 
import json
import os

def split_json(input_file, output_dir):
    # 出力ディレクトリが存在しない場合は作成
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # JSONファイルを読み込む
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # カテゴリーごとにファイルを分割
    for category_key, category_data in data.items():
        output_file = os.path.join(output_dir, f'{category_key}.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({category_key: category_data}, f, ensure_ascii=False, indent=2)

    # インデックスファイルを作成
    index_data = {
        'categories': {
            key: {
                'name': data[key]['name'],
                'file': f'{key}.json'
            }
            for key in data.keys()
        }
    }
    
    with open(os.path.join(output_dir, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    input_file = 'src/quizData.json'
    output_dir = 'src/data'
    split_json(input_file, output_dir) 
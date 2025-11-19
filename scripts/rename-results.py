#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""診断結果ファイルを英語名にリネーム"""

import os
import shutil
from pathlib import Path

# マッピング
DIR_MAP = {
    '01_火': 'fire',
    '02_木': 'wood',
    '03_土': 'earth',
    '04_金': 'metal',
    '05_水': 'water'
}

ELEMENT_MAP = {
    '火': 'fire',
    '木': 'wood',
    '土': 'earth',
    '金': 'metal',
    '水': 'water'
}

PHENOMENA_MAP = {
    '春霞': 'harugasumi',
    '夏雨': 'natsuame',
    '彩雲': 'saiun',
    '朝日': 'asahi',
    '夕陽': 'yuhi',
    '秋風': 'akikaze',
    '冬陽': 'fuyuhi',
    '朧月': 'oborozuki',
    '霜夜': 'shimoya',
    '氷刃': 'hyojin',
    '春雷': 'shunrai',
    '豊穣': 'houjo'
}

def main():
    results_dir = Path(__file__).parent.parent / 'public' / 'results'

    print('ファイルをリネーム＆コピーしています...\n')

    total = 0

    # 各五行ディレクトリを処理
    for old_dir, new_dir in DIR_MAP.items():
        old_path = results_dir / old_dir
        new_path = results_dir / new_dir

        if not old_path.exists():
            continue

        # 新ディレクトリ作成
        new_path.mkdir(exist_ok=True)

        print(f'【{old_dir} → {new_dir}】')

        # ファイルをリネームしてコピー
        for old_file in old_path.glob('*.md'):
            # ファイル名をパース: "火の夏雨.md"
            name = old_file.stem  # "火の夏雨"

            # "火の夏雨" → "火" と "夏雨" に分割
            parts = name.split('の')
            if len(parts) != 2:
                print(f'  SKIP: {old_file.name}')
                continue

            element = parts[0]  # "火"
            phenomena = parts[1]  # "夏雨"

            # 英語名に変換
            element_en = ELEMENT_MAP.get(element, element)
            phenomena_en = PHENOMENA_MAP.get(phenomena, phenomena)

            # 新ファイル名: "fire-natsuame.md"
            new_name = f'{element_en}-{phenomena_en}'

            # .md と .html の両方をコピー
            for ext in ['.md', '.html']:
                old_file_with_ext = old_path / f'{name}{ext}'
                new_file = new_path / f'{new_name}{ext}'

                if old_file_with_ext.exists():
                    shutil.copy2(old_file_with_ext, new_file)
                    print(f'  OK {name}{ext} -> {new_name}{ext}')
                    total += 1

        print()

    print(f'完了！合計 {total} ファイルをコピーしました。')
    print('\n旧ディレクトリ (01_火, 02_木...) は残っています。')
    print('動作確認後、手動で削除してください。')

if __name__ == '__main__':
    main()

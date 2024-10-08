#!/bin/bash

# 函数：创建文件和必要的目录
create_file() {
    local file_path="$1"
    local dir_path=$(dirname "$file_path")

    # 创建必要的目录
    mkdir -p "$dir_path"

    # 创建文件
    touch "$file_path"

    echo "文件已创建: $file_path"
}

# 主循环
while true; do
    # 询问用户要创建的文件
    read -p "请输入要创建的文件路径（或输入 'q' 退出）: " file_path

    # 检查是否退出
    if [ "$file_path" = "q" ]; then
        echo "程序退出。"
        exit 0
    fi

    # 检查输入是否为空
    if [ -z "$file_path" ]; then
        echo "错误：文件路径不能为空。"
        continue
    fi

    # 创建文件
    create_file "$file_path"
done
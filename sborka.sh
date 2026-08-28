#!/bin/bash

# Использование: ./collect_files.sh [папка_проекта] [файл_вывода]
SOURCE_DIR="${1:-.}"
OUTPUT_FILE="${2:-NEW_RGR.txt}"

# Удаляем предыдущий файл, если существует
> "$OUTPUT_FILE"

# Список расширений и имён файлов, которые считаем "своими"
# Добавьте сюда то, что используется в вашем проекте
find "$SOURCE_DIR" \
    -type f \
    -not -path "*/node_modules/*" \
    -not -name "package-lock.json" \
    -not -name "yarn.lock" \
    -not -name "pnpm-lock.yaml" \
    \( \
        -name "*.js" -o \
        -name "*.jsx" -o \
        -name "*.ts" -o \
        -name "*.tsx" -o \
        -name "*.json" -o \
        -name "*.conf" -o \
        -name "*.yml" -o \
        -name "*.sql" -o \
        -name "*.yaml" -o \
        -name "*.sh" -o \
        -name "*.py" -o \
        -name "*.go" -o \
        -name "*.qml" -o \
        -name "*.cpp" -o \
        -name "*.h" -o \
        -name "*.css" -o \
        -name "*.html" -o \
        -name "*.md" -o \
        -name "*.txt" -o \
        -name "*.env" -o \
        -name "*.example" -o \
        -name "*.gitignore" -o \
        -name "Dockerfile" -o \
        -name "Makefile" -o \
        -name "nginx.conf" \
    \) | while read -r file; do
        echo "=== $file ===" >> "$OUTPUT_FILE"
        cat "$file" 2>/dev/null >> "$OUTPUT_FILE"
        echo -e "\n\n" >> "$OUTPUT_FILE"
    done

echo "✅ Готово! Все ваши файлы (без мусора от npm) собраны в: $OUTPUT_FILE"

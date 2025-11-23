
PROJECT_DIR="/home/salero/RGR/rgr_vigenere_great_bigram"

echo "=== Создаю лаунчер для программы EDR ==="

if [ ! -f "$PROJECT_DIR/bin/EDR" ]; then
    echo "Программа еще не собрана, компилирую..."
    make
fi

echo "Создаю файл для запуска..."
cat > "$PROJECT_DIR/EDR" << 'LAUNCHER_EOF'
#!/bin/bash
cd "/home/salero/RGR/rgr_vigenere_great_bigram" && ./bin/EDR
LAUNCHER_EOF

chmod +x "$PROJECT_DIR/EDR"

echo "Добавляю ярлык в меню приложений..."
mkdir -p ~/.local/share/applications

cat > ~/.local/share/applications/edr.desktop << 'DESKTOP_EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=EDR
Comment=Программа шифрования и дешифрования
Exec=/home/salero/RGR/rgr_vigenere_great_bigram/bin/EDR
Categories=Utility;Security;
Terminal=true
StartupNotify=true
DESKTOP_EOF

update-desktop-database ~/.local/share/applications

echo ""
echo "=== Всё готово! ==="
echo "✅ Создан файл для запуска: $PROJECT_DIR/EDR"
echo "✅ Добавлен ярлык в меню приложений"

echo ""
echo "Теперь программу можно запускать тремя способами:"
echo "1. ПРОСТОЙ СПОСОБ: Кликнуть правой кнопкой по файлу 'EDR' в папке проекта → 'Запустить как приложение'"
echo "2. Прописать EDR в терминал"

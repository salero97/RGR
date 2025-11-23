#include "vigenere/vigenere_cipher_interface.h"
#include "vigenere/vigenere_cipher.h"
#include "utils.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <filesystem>
#include <algorithm>
#include <locale>
#include <clocale>

using namespace std;
namespace fs = filesystem;

void printResult(const vector<unsigned char>& data, bool isEncrypted) {
    if (isEncrypted) {
        cout << "Результат (hex): ";
        for (unsigned char c : data) {
            cout << hex << setw(2) << setfill('0') << static_cast<int>(c) << " ";
        }
        cout << dec << endl << "Символьное представление: ";
        
        // Для зашифрованных данных - только ASCII
        for (unsigned char c : data) {
            if (c >= 32 && c < 127) {
                cout << c;
            } else {
                cout << ".";
            }
        }
    } else {
        // Для расшифрованных - выводим как текст
        cout << "Расшифрованный текст: ";
        string text(data.begin(), data.end());
        cout << text;
    }
    cout << endl;
}

void runVigenereCipher() {
    setlocale(LC_ALL, "ru_RU.UTF-8");
    locale::global(locale("ru_RU.UTF-8"));

    try {
        cout << "=== Шифр Виженера ===" << endl;

        bool encrypt = getChoice("Выберите:\n1. Шифровать\n2. Дешифровать\nВаш выбор: ", {1, 2}) == 1;

        string key;
        int keyChoice = getChoice("Ключ:\n1. Ввести\n2. Сгенерировать\nВаш выбор: ", {1, 2});
        
        if (keyChoice == 2) {
            int len = getIntegerInput("Длина ключа (от 1 до 256): ", 1, 256);
            key = generateVigenereKey(len);
            cout << "Сгенерированный ключ (hex): ";
            for (unsigned char c : key) {
                cout << hex << setw(2) << setfill('0') << static_cast<int>(c);
            }
            cout << dec << endl;
        } else {
            // ДОБАВЛЕНО: Выбор формата ввода ключа
            int keyFormat = getChoice("Формат ключа:\n1. Текст\n2. Hex\nВаш выбор: ", {1, 2});
            
            if (keyFormat == 1) {
                key = getLine("Введите ключ: ", false);
                cout << "Ключ принят как текст" << endl;
            } else {
                string hexKey = getLine("Введите ключ в hex: ", false);
                vector<unsigned char> keyBytes = hexToBytes(hexKey);
                key = string(keyBytes.begin(), keyBytes.end());
                cout << "Ключ принят как hex-последовательность" << endl;
            }
        }

        int sourceChoice = getChoice("Данные:\n1. Ввести текст\n2. Работа с файлом\nВаш выбор: ", {1, 2});

        if (sourceChoice == 1) {
            // Обработка текстового ввода
            if (encrypt) {
                string text = getLine("Введите текст: ", false);
                vector<unsigned char> inputData(text.begin(), text.end());
                vector<unsigned char> outputData = vigenereEncrypt(inputData, key);
                printResult(outputData, true);
            } else {
                string hexInput = getLine("Введите hex: ", false);
                vector<unsigned char> inputData = hexToBytes(hexInput);
                vector<unsigned char> outputData = vigenereDecrypt(inputData, key);
                printResult(outputData, false);
            }
        } else {
            // Обработка файлов
            cout << "\nФайлы в текущей директории:\n";
            vector<string> files = getFilesInCurrentDir();
            for (const auto& file : files) {
                cout << "- " << file << endl;
            }
            cout << endl;

            string inputFile = getLine("Введите имя файла или полный путь: ", false);

            // ПРЕДУПРЕЖДЕНИЕ ДЛЯ ИЗОБРАЖЕНИЙ
            if (encrypt && isImageFile(inputFile)) {
                cout << "⚠️  ВНИМАНИЕ: Выбран файл изображения.\n";
                cout << "Шифрование может сделать изображение непригодным для просмотра.\n";
                int continueChoice = getChoice("Продолжить? (1-Да, 2-Нет): ", {1, 2});
                if (continueChoice != 1) {
                    cout << "Операция отменена.\n";
                    return;
                }
            }

            string outputPath = getLine("Куда сохранить результат? (оставьте пустым для сохранения рядом): ", false);

            vector<unsigned char> inputData = readFile(inputFile);
            vector<unsigned char> outputData;

            if (encrypt) {
                outputData = vigenereEncrypt(inputData, key);
                
                if (outputPath.empty()) {
                    fs::path p = fs::path(inputFile);
                    outputPath = p.stem().string() + "_encrypted" + p.extension().string();
                }
            } else {
                outputData = vigenereDecrypt(inputData, key);
                
                if (outputPath.empty()) {
                    fs::path p = fs::path(inputFile);
                    outputPath = p.stem().string() + "_decrypted" + p.extension().string();
                }
            }

            writeFile(outputPath, outputData);
            cout << "Файл будет сохранен по пути: " << fs::absolute(outputPath) << endl;

            // Вывод результата на экран
            cout << "\nРезультат (первые 16 байт в hex): ";
            for (size_t i = 0; i < min(outputData.size(), static_cast<size_t>(16)); ++i) {
                cout << hex << setw(2) << setfill('0') << static_cast<int>(outputData[i]) << " ";
            }
            cout << dec << endl;

            // Создание лог-файла
            createLogFile(outputPath, "Vigenere", encrypt ? "cipher" : "decipher", 
                         key, inputFile, outputPath);
        }
    } catch (const exception& e) {
        cerr << "Ошибка: " << e.what() << endl;
    }
    
    cin.clear();
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}
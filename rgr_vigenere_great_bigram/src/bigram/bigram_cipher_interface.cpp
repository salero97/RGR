#include "bigram/bigram_cipher_interface.h"
#include "bigram/bigram_cipher.h"
#include "utils.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <filesystem>
#include <algorithm>

using namespace std;
namespace fs = filesystem;

void printBigramResult(const vector<uint8_t>& data, bool isEncrypted, bool isFile = false) {
    if (isFile) {
        cout << "Результат (первые 16 байт в hex): ";
        for (size_t i = 0; i < min(data.size(), static_cast<size_t>(16)); ++i) {
            cout << hex << setw(2) << setfill('0') << static_cast<int>(data[i]) << " ";
        }
        cout << dec << endl;
    } else {
        if (isEncrypted) {
            cout << "Результат (hex): ";
            for (uint8_t byte : data) {
                cout << hex << setw(2) << setfill('0') << static_cast<int>(byte) << " ";
            }
            cout << dec << endl << "Текстовое представление: ";
            
            string text(data.begin(), data.end());
            for (char c : text) {
                if (c >= 32 && c < 127) {
                    cout << c;
                } else {
                    cout << ".";
                }
            }
            cout << endl;
        } else {
            // ТОЛЬКО для дешифрования - показываем только текст
            string resultText(data.begin(), data.end());
            cout << "Расшифрованный текст: " << resultText << endl;
        }
    }
}

void runBigramCipher() {
    try {
        cout << "=== Биграммный шифр Тритемия ===" << endl;
        cout << "Классический шифр с матрицей 16x16" << endl;

        bool encrypt = getChoice("Выберите:\n1. Шифровать\n2. Дешифровать\nВаш выбор: ", {1, 2}) == 1;

        // ВВОД КЛЮЧА
        string key;
        int keyChoice = getChoice("Ключ:\n1. Ввести\n2. Сгенерировать\nВаш выбор: ", {1, 2});
        
        if (keyChoice == 2) {
            int length = getIntegerInput("Длина ключа (1-20): ", 1, 20);
            key = generateRandomKey(length);
            cout << "Сгенерированный ключ: " << key << endl;
        } else {
            key = getLine("Введите ключ: ", false);
            if (key.empty()) {
                cout << "Ошибка: Ключ не может быть пустым" << endl;
                return;
            }
        }

        int sourceChoice = getChoice("Данные:\n1. Ввести текст\n2. Работа с файлом\nВаш выбор: ", {1, 2});

        if (sourceChoice == 2) {
            // Файловая работа
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
            vector<uint8_t> inputBytes(inputData.begin(), inputData.end());
            
            vector<uint8_t> outputBytes;
            if (encrypt) {
                outputBytes = BigramCipher::processBytes(inputBytes, key, true);
            } else {
                outputBytes = BigramCipher::processBytes(inputBytes, key, false);
            }

            vector<unsigned char> outputData(outputBytes.begin(), outputBytes.end());

            if (outputPath.empty()) {
                fs::path p = fs::path(inputFile);
                outputPath = p.stem().string() + (encrypt ? "_bigram_enc" : "_bigram_dec") + p.extension().string();
            }

            writeFile(outputPath, outputData);
            cout << "Файл будет сохранен по пути: " << fs::absolute(outputPath) << endl;
            printBigramResult(outputBytes, encrypt, true);
            
            createLogFile(outputPath, "Bigram Cipher (Tritemius)", encrypt ? "cipher" : "decipher", 
                         key, inputFile, outputPath);
        } else {
            // Текстовый ввод
            if (encrypt) {
                string text = getLine("Введите текст: ", false);
                string result = BigramCipher::processText(text, key, true);
                vector<uint8_t> resultBytes(result.begin(), result.end());
                printBigramResult(resultBytes, true);
            } else {
                string hexInput = getLine("Введите hex: ", false);
                vector<unsigned char> data = hexToBytes(hexInput);
                vector<uint8_t> bytes(data.begin(), data.end());
                vector<uint8_t> resultBytes = BigramCipher::processBytes(bytes, key, false);
                printBigramResult(resultBytes, false);
            }
        }
    } catch (const exception& e) {
        cerr << "Ошибка: " << e.what() << endl;
    }
    
    cin.clear();
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}
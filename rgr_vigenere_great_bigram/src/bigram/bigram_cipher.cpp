#include "bigram/bigram_cipher.h"
#include <algorithm>
#include <stdexcept>
#include <cstdint>
#include <functional>
#include <random>
#include <numeric>

using namespace std;

BigramCipher::BigramCipher(const string& key) : key(key) {
    createMatrix();
    permuteMatrix();
    findPositions();
}

void BigramCipher::createMatrix() {
    // Создаем базовую матрицу 16x16
    matrix.resize(16, vector<int>(16));
    
    int value = 0;
    for (int i = 0; i < 16; i++) {
        for (int j = 0; j < 16; j++) {
            matrix[i][j] = value++;
        }
    }
}

void BigramCipher::permuteMatrix() {
    if (key.empty()) return;
    
    // Используем ключ для инициализации генератора
    size_t seed = 0;
    for (char c : key) {
        seed = seed * 31 + static_cast<size_t>(c);
    }
    
    mt19937 generator(seed);
    
    // Создаем случайную перестановку для всей матрицы
    vector<int> indices(256);
    iota(indices.begin(), indices.end(), 0);
    shuffle(indices.begin(), indices.end(), generator);
    
    // Заполняем матрицу в случайном порядке
    int index = 0;
    for (int i = 0; i < 16; i++) {
        for (int j = 0; j < 16; j++) {
            matrix[i][j] = indices[index++];
        }
    }
}

void BigramCipher::findPositions() {
    positions.clear();
    for (int i = 0; i < 16; i++) {
        for (int j = 0; j < 16; j++) {
            positions[matrix[i][j]] = make_pair(i, j);
        }
    }
}

vector<pair<int, int>> BigramCipher::makeBigrams(const vector<int>& codes) {
    vector<pair<int, int>> bigrams;
    
    for (size_t i = 0; i < codes.size(); i += 2) {
        int first = codes[i];
        int second;
        
        if (i + 1 < codes.size()) {
            second = codes[i + 1];
            // Если одинаковые символы, добавляем разделитель
            if (first == second) {
                second = 0xFF; // Специальный символ-разделитель
                i--; // Отступаем, чтобы не пропустить символ
            }
        } else {
            // Если нечетное количество, добавляем заполнитель
            second = 0xFF;
        }
        
        bigrams.push_back(make_pair(first, second));
    }
    
    return bigrams;
}

pair<int, int> BigramCipher::encryptBigram(int a, int b) {
    // Если символы не найдены в матрице, возвращаем как есть
    if (positions.find(a) == positions.end() || positions.find(b) == positions.end()) {
        return make_pair(a, b);
    }
    
    auto posA = positions[a];
    auto posB = positions[b];
    
    int rowA = posA.first, colA = posA.second;
    int rowB = posB.first, colB = posB.second;
    
    if (rowA == rowB) {
        // Одна строка - сдвигаем вправо
        colA = (colA + 1) % 16;
        colB = (colB + 1) % 16;
    } else if (colA == colB) {
        // Один столбец - сдвигаем вниз
        rowA = (rowA + 1) % 16;
        rowB = (rowB + 1) % 16;
    } else {
        // Прямоугольник - меняем столбцы
        swap(colA, colB);
    }
    
    return make_pair(matrix[rowA][colA], matrix[rowB][colB]);
}

pair<int, int> BigramCipher::decryptBigram(int a, int b) {
    if (positions.find(a) == positions.end() || positions.find(b) == positions.end()) {
        return make_pair(a, b);
    }
    
    auto posA = positions[a];
    auto posB = positions[b];
    
    int rowA = posA.first, colA = posA.second;
    int rowB = posB.first, colB = posB.second;
    
    if (rowA == rowB) {
        // Одна строка - сдвигаем влево
        colA = (colA - 1 + 16) % 16;
        colB = (colB - 1 + 16) % 16;
    } else if (colA == colB) {
        // Один столбец - сдвигаем вверх
        rowA = (rowA - 1 + 16) % 16;
        rowB = (rowB - 1 + 16) % 16;
    } else {
        // Прямоугольник - меняем столбцы
        swap(colA, colB);
    }
    
    return make_pair(matrix[rowA][colA], matrix[rowB][colB]);
}

vector<int> BigramCipher::encrypt(const vector<int>& codes) {
    if (codes.empty()) return {};
    
    auto bigrams = makeBigrams(codes);
    vector<int> result;
    
    for (const auto& bigram : bigrams) {
        auto encrypted = encryptBigram(bigram.first, bigram.second);
        result.push_back(encrypted.first);
        result.push_back(encrypted.second);
    }
    
    return result;
}

vector<int> BigramCipher::decrypt(const vector<int>& codes) {
    if (codes.empty() || codes.size() % 2 != 0) return {};
    
    vector<int> result;
    
    for (size_t i = 0; i < codes.size(); i += 2) {
        auto decrypted = decryptBigram(codes[i], codes[i + 1]);
        result.push_back(decrypted.first);
        result.push_back(decrypted.second);
    }
    
    // Убираем заполнители
    result.erase(remove(result.begin(), result.end(), 0xFF), result.end());
    
    return result;
}

vector<uint8_t> BigramCipher::encryptBytes(const vector<uint8_t>& data) {
    vector<int> codes;
    for (uint8_t byte : data) {
        codes.push_back(static_cast<int>(byte));
    }
    
    vector<int> encryptedCodes = encrypt(codes);
    
    vector<uint8_t> result;
    for (int code : encryptedCodes) {
        result.push_back(static_cast<uint8_t>(code));
    }
    
    return result;
}

vector<uint8_t> BigramCipher::decryptBytes(const vector<uint8_t>& data) {
    vector<int> codes;
    for (uint8_t byte : data) {
        codes.push_back(static_cast<int>(byte));
    }
    
    vector<int> decryptedCodes = decrypt(codes);
    
    vector<uint8_t> result;
    for (int code : decryptedCodes) {
        result.push_back(static_cast<uint8_t>(code));
    }
    
    return result;
}

string BigramCipher::encryptText(const string& text) {
    vector<uint8_t> inputBytes(text.begin(), text.end());
    vector<uint8_t> encryptedBytes = encryptBytes(inputBytes);
    return string(encryptedBytes.begin(), encryptedBytes.end());
}

string BigramCipher::decryptText(const string& text) {
    vector<uint8_t> inputBytes(text.begin(), text.end());
    vector<uint8_t> decryptedBytes = decryptBytes(inputBytes);
    return string(decryptedBytes.begin(), decryptedBytes.end());
}

vector<uint8_t> BigramCipher::processBytes(const vector<uint8_t>& data, const string& key, bool encrypt) {
    BigramCipher cipher(key);
    
    if (encrypt) {
        return cipher.encryptBytes(data);
    } else {
        return cipher.decryptBytes(data);
    }
}

string BigramCipher::processText(const string& text, const string& key, bool encrypt) {
    BigramCipher cipher(key);
    
    if (encrypt) {
        return cipher.encryptText(text);
    } else {
        return cipher.decryptText(text);
    }
}
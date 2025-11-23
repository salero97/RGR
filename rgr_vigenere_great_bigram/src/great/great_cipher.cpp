#include "great/great_cipher.h"
#include "utils.h"
#include <algorithm>
#include <functional>
#include <random>

using namespace std;

// Хеш-функция для преобразования строки в seed
uint32_t stringToSeed(const string& key) {
    hash<string> hasher;
    return static_cast<uint32_t>(hasher(key));
}

GreatCipher::GreatCipher(uint32_t seed) : keySeed(seed) {
    createTables();
}

GreatCipher::GreatCipher(const string& key) : keySeed(stringToSeed(key)) {
    createTables();
}

void GreatCipher::createTables() {
    // Используем keySeed для инициализации генератора
    mt19937 generator(keySeed);
    uniform_int_distribution<int> dist(100, 65535);
    
    encryptionTable.clear();
    decryptionTable.clear();
    homophoneSequence.clear();
    
    // Создаем таблицы омофонов с использованием ключа
    for (int symbol = 0; symbol < 256; symbol++) {
        vector<uint16_t> codes;
        int numHomophones = 2 + (symbol % 5); // 2-6 омофонов на символ
        
        for (int i = 0; i < numHomophones; i++) {
            uint16_t code = dist(generator);
            codes.push_back(code);
            
            encryptionTable[code].push_back(static_cast<uint8_t>(symbol));
        }
        
        // Перемешиваем коды для этого символа для случайности
        shuffle(codes.begin(), codes.end(), generator);
        decryptionTable[static_cast<uint8_t>(symbol)] = codes;
    }
    
    // Создаем последовательность для выбора омофонов
    for (int i = 0; i < 1000; i++) {
        homophoneSequence.push_back(dist(generator));
    }
}

uint16_t GreatCipher::getNextCode(size_t position) {
    return homophoneSequence[position % homophoneSequence.size()];
}

vector<uint8_t> GreatCipher::encrypt(const vector<uint8_t>& data) {
    if (data.empty()) return {};
    
    vector<uint8_t> encrypted;
    
    for (size_t i = 0; i < data.size(); i++) {
        uint8_t symbol = data[i];
        
        if (decryptionTable.find(symbol) != decryptionTable.end()) {
            // Выбираем случайный омофон для этого символа
            const auto& codes = decryptionTable[symbol];
            size_t index = (i + getNextCode(i)) % codes.size();
            uint16_t code = codes[index];
            
            // Разбиваем 16-битный код на 2 байта
            encrypted.push_back(static_cast<uint8_t>(code >> 8));
            encrypted.push_back(static_cast<uint8_t>(code & 0xFF));
        } else {
            // Если символа нет в таблице, используем прямое преобразование
            encrypted.push_back(symbol);
            encrypted.push_back(0);
        }
    }
    
    return encrypted;
}

vector<uint8_t> GreatCipher::decrypt(const vector<uint8_t>& data) {
    if (data.empty() || data.size() % 2 != 0) return {};
    
    vector<uint8_t> decrypted;
    
    for (size_t i = 0; i < data.size(); i += 2) {
        uint16_t code = (static_cast<uint16_t>(data[i]) << 8) | data[i + 1];
        
        if (encryptionTable.find(code) != encryptionTable.end()) {
            // Выбираем первый вариант декодирования (омофоны)
            const auto& symbols = encryptionTable[code];
            decrypted.push_back(symbols[0]);
        } else {
            // Прямое преобразование для неизвестных кодов
            decrypted.push_back(data[i]);
        }
    }
    
    return decrypted;
}

string GreatCipher::encryptText(const string& text) {
    vector<uint8_t> inputBytes(text.begin(), text.end());
    vector<uint8_t> encryptedBytes = encrypt(inputBytes);
    return string(encryptedBytes.begin(), encryptedBytes.end());
}

string GreatCipher::decryptText(const string& text) {
    vector<uint8_t> inputBytes(text.begin(), text.end());
    vector<uint8_t> decryptedBytes = decrypt(inputBytes);
    return string(decryptedBytes.begin(), decryptedBytes.end());
}

vector<uint8_t> GreatCipher::processBytes(const vector<uint8_t>& data, const string& key, bool encrypt) {
    GreatCipher cipher(key);
    
    if (encrypt) {
        return cipher.encrypt(data);
    } else {
        return cipher.decrypt(data);
    }
}

string GreatCipher::processText(const string& text, const string& key, bool encrypt) {
    GreatCipher cipher(key);
    
    if (encrypt) {
        return cipher.encryptText(text);
    } else {
        return cipher.decryptText(text);
    }
}
#include "vigenere/vigenere_cipher.h"
#include "utils.h"
#include <stdexcept>
#include <algorithm>

using namespace std;

vector<unsigned char> vigenereEncrypt(const vector<unsigned char>& data, const string& key) {
    validateKey(key);
    if (data.empty()) return {};

    vector<unsigned char> result;
    result.reserve(data.size());
    size_t key_index = 0;

    for (unsigned char c : data) {
        unsigned char k = static_cast<unsigned char>(key[key_index % key.size()]);
        result.push_back((c + k) % 256);
        key_index++;
    }

    return result;
}

vector<unsigned char> vigenereDecrypt(const vector<unsigned char>& data, const string& key) {
    validateKey(key);
    if (data.empty()) return {};

    vector<unsigned char> result;
    result.reserve(data.size());
    size_t key_index = 0;

    for (unsigned char c : data) {
        unsigned char k = static_cast<unsigned char>(key[key_index % key.size()]);
        result.push_back((c - k + 256) % 256);
        key_index++;
    }

    return result;
}

string generateVigenereKey(int length) {
    if (length <= 0 || length > 256) {
        throw invalid_argument("Длина ключа должна быть от 1 до 256");
    }
    
    string key;
    key.reserve(length);
    
    for (int i = 0; i < length; ++i) {
        key.push_back(static_cast<char>(randomInt(0, 255)));
    }
    
    return key;
}
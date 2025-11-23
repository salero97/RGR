#ifndef VIGENERE_CIPHER_H
#define VIGENERE_CIPHER_H

#include <vector>
#include <string>
#include "utils.h"

using namespace std;

inline void validateKey(const string& key) {
    if (key.empty()) {
        throw invalid_argument("Ключ не может быть пустым");
    }
}

vector<unsigned char> vigenereEncrypt(const vector<unsigned char>& data, const string& key);
vector<unsigned char> vigenereDecrypt(const vector<unsigned char>& data, const string& key);
string generateVigenereKey(int length);

#endif
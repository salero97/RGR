#ifndef VIGENERE_CIPHER_H
#define VIGENERE_CIPHER_H

#include <vector>
#include <string>
#include "utils.h"

inline void validateKey(const std::string& key) {
    if (key.empty()) {
        throw std::invalid_argument("Ключ не может быть пустым");
    }
}

std::vector<unsigned char> vigenereEncrypt(const std::vector<unsigned char>& data, const std::string& key);
std::vector<unsigned char> vigenereDecrypt(const std::vector<unsigned char>& data, const std::string& key);
std::string generateVigenereKey(int length);

#endif
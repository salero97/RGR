#ifndef BIGRAM_CIPHER_H
#define BIGRAM_CIPHER_H

#include <vector>
#include <string>
#include <map>
#include <utility>
#include <cstdint>

class BigramCipher {
private:
    std::vector<std::vector<int>> matrix;
    std::map<int, std::pair<int, int>> positions;
    std::string key;
    
    void createMatrix();
    void permuteMatrix();
    void findPositions();
    std::vector<std::pair<int, int>> makeBigrams(const std::vector<int>& codes);
    
    std::pair<int, int> encryptBigram(int a, int b);
    std::pair<int, int> decryptBigram(int a, int b);
    
public:
    BigramCipher(const std::string& key);
    
    std::vector<int> encrypt(const std::vector<int>& codes);
    std::vector<int> decrypt(const std::vector<int>& codes);
    
    std::vector<uint8_t> encryptBytes(const std::vector<uint8_t>& data);
    std::vector<uint8_t> decryptBytes(const std::vector<uint8_t>& data);
    
    std::string encryptText(const std::string& text);
    std::string decryptText(const std::string& text);
    
    static std::vector<uint8_t> processBytes(const std::vector<uint8_t>& data, const std::string& key, bool encrypt);
    static std::string processText(const std::string& text, const std::string& key, bool encrypt);
};

#endif
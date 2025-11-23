#ifndef GREAT_CIPHER_H
#define GREAT_CIPHER_H

#include <vector>
#include <string>
#include <map>
#include <cstdint>

class GreatCipher {
private:
    std::map<uint16_t, std::vector<uint8_t>> encryptionTable;
    std::map<uint8_t, std::vector<uint16_t>> decryptionTable;
    std::vector<uint16_t> homophoneSequence;
    uint32_t keySeed;
    
    void createTables();
    uint16_t getNextCode(size_t position);
    
public:
    GreatCipher(uint32_t seed);
    GreatCipher(const std::string& key);
    
    std::vector<uint8_t> encrypt(const std::vector<uint8_t>& data);
    std::vector<uint8_t> decrypt(const std::vector<uint8_t>& data);
    
    std::string encryptText(const std::string& text);
    std::string decryptText(const std::string& text);
    
    static std::vector<uint8_t> processBytes(const std::vector<uint8_t>& data, const std::string& key, bool encrypt);
    static std::string processText(const std::string& text, const std::string& key, bool encrypt);
};

#endif
#ifndef GREAT_CIPHER_H
#define GREAT_CIPHER_H

#include <vector>
#include <string>
#include <map>
#include <cstdint>

using namespace std;

class GreatCipher {
private:
    map<uint16_t, vector<uint8_t>> encryptionTable;
    map<uint8_t, vector<uint16_t>> decryptionTable;
    vector<uint16_t> homophoneSequence;
    uint32_t keySeed;
    
    void createTables();
    uint16_t getNextCode(size_t position);
    
public:
    GreatCipher(uint32_t seed);
    GreatCipher(const string& key);
    
    vector<uint8_t> encrypt(const vector<uint8_t>& data);
    vector<uint8_t> decrypt(const vector<uint8_t>& data);
    
    string encryptText(const string& text);
    string decryptText(const string& text);
    
    static vector<uint8_t> processBytes(const vector<uint8_t>& data, const string& key, bool encrypt);
    static string processText(const string& text, const string& key, bool encrypt);
};

#endif
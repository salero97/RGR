#ifndef BIGRAM_CIPHER_H
#define BIGRAM_CIPHER_H

#include <vector>
#include <string>
#include <map>
#include <utility>
#include <cstdint>

using namespace std;

class BigramCipher {
private:
    vector<vector<int>> matrix;
    map<int, pair<int, int>> positions;
    string key;
    
    void createMatrix();
    void permuteMatrix();
    void findPositions();
    vector<pair<int, int>> makeBigrams(const vector<int>& codes);
    
    pair<int, int> encryptBigram(int a, int b);
    pair<int, int> decryptBigram(int a, int b);
    
public:
    BigramCipher(const string& key);
    
    vector<int> encrypt(const vector<int>& codes);
    vector<int> decrypt(const vector<int>& codes);
    
    vector<uint8_t> encryptBytes(const vector<uint8_t>& data);
    vector<uint8_t> decryptBytes(const vector<uint8_t>& data);
    
    string encryptText(const string& text);
    string decryptText(const string& text);
    
    static vector<uint8_t> processBytes(const vector<uint8_t>& data, const string& key, bool encrypt);
    static string processText(const string& text, const string& key, bool encrypt);
};

#endif
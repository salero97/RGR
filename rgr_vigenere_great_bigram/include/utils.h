#ifndef UTILS_H
#define UTILS_H

#include <vector>
#include <string>
#include <initializer_list>
#include <filesystem>
#include <chrono>
#include <map>
#include <utility>

using namespace std;
namespace fs = filesystem;


void clearInputBuffer();
int getChoice(const string& prompt, const initializer_list<int>& options);
int getIntegerInput(const string& prompt, int min, int max);
string getLine(const string& prompt, bool maskInput = false);
bool isDigits(const string& str);
void initLocale();
string generateRandomKey(int length);

vector<unsigned char> readFile(const string& filename);
void writeFile(const string& filename, const vector<unsigned char>& data);
vector<string> getFilesInCurrentDir();
string getFileType(const std::string& filename);
void createLogFile(const string& outputPath, const string& cipherName,
                 const string& operation, const string& key,
                 const string& inputFile, const string& outputFile);

vector<string> getFilesInCurrentDir();
void createLogFile(const string& outputPath, const string& cipherName,
                 const string& operation, const string& key,
                 const string& inputFile, const string& outputFile);


int randomInt(int min, int max);


void printHex(const vector<unsigned char>& data);
void printTextRepresentation(const vector<unsigned char>& data);


vector<unsigned char> hexToBytes(const string& hex);
void saveKeyToFile(const string& filename, const map<pair<unsigned char, unsigned char>, unsigned char>& key);
map<pair<unsigned char, unsigned char>, unsigned char> loadKeyFromFile(const string& filename);
string bytesToHex(const vector<unsigned char>& data);


bool isImageFile(const std::string& filename);
std::string getFileExtension(const std::string& filename);

#endif
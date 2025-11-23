#include "utils.h"
#include <iostream>
#include <limits>
#include <fstream>
#include <random>
#include <termios.h>
#include <unistd.h>
#include <cctype>
#include <locale>
#include <iomanip>
#include <sstream>
#include <ctime>
#include <algorithm>
#include <codecvt>

using namespace std;

void clearInputBuffer() {
    cin.clear();
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

int getChoice(const string& prompt, const initializer_list<int>& options) {
    int choice;
    while (true) {
        cout << prompt;
        if (!(cin >> choice)) {
            cout << "Ошибка: Некорректный ввод. Пожалуйста, введите число.\n";
            clearInputBuffer();
            continue;
        }

        bool valid = false;
        for (int option : options) {
            if (choice == option) {
                valid = true;
                break;
            }
        }

        if (!valid) {
            cout << "Ошибка: Недопустимый выбор. Пожалуйста, выберите из предложенных вариантов.\n";
            clearInputBuffer();
            continue;
        }

        clearInputBuffer();
        return choice;
    }
}

int getIntegerInput(const string& prompt, int min, int max) {
    int value;
    while (true) {
        cout << prompt;
        if (!(cin >> value)) {
            cout << "Ошибка: Некорректный ввод. Пожалуйста, введите число.\n";
            clearInputBuffer();
            continue;
        }

        if (value < min || value > max) {
            cout << "Ошибка: Значение должно быть между " << min << " и " << max << "\n";
            clearInputBuffer();
            continue;
        }

        clearInputBuffer();
        return value;
    }
}


string getLine(const string& prompt, bool maskInput) {
    string input;
    cout << prompt;
    cout.flush();

    if (maskInput) {
        termios oldt;
        tcgetattr(STDIN_FILENO, &oldt);
        termios newt = oldt;
        newt.c_lflag &= ~ECHO;

        if (tcsetattr(STDIN_FILENO, TCSANOW, &newt) != 0) {
            cerr << "Ошибка: Не удалось настроить терминал. Ввод будет видимым." << endl;
            getline(cin, input);
        } else {
            getline(cin, input);
            tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
            cout << endl;
        }
    } else {
        getline(cin, input);
    }
    return input;
}

bool isDigits(const string& str) {
    for (char c : str) {
        if (!isdigit(static_cast<unsigned char>(c))) {
            return false;
        }
    }
    return !str.empty();
}

void initLocale() {
    setlocale(LC_ALL, "");
    locale::global(locale(""));
    cout.imbue(locale());
}

// ================== Работа с файлами ==================

vector<unsigned char> readFile(const string& filename) {
    ifstream file(filename, ios::binary);
    if (!file) {
        throw runtime_error("Не удалось открыть файл для чтения: " + filename);
    }

    file.seekg(0, ios::end);
    streamsize size = file.tellg();
    file.seekg(0, ios::beg);

    vector<unsigned char> buffer(size);
    if (!file.read(reinterpret_cast<char*>(buffer.data()), size)) {
        throw runtime_error("Ошибка чтения файла: " + filename);
    }
    
    return buffer;
}

void writeFile(const string& filename, const vector<unsigned char>& data) {
    ofstream file(filename, ios::binary);
    if (!file) {
        throw runtime_error("Не удалось открыть файл для записи: " + filename);
    }
    file.write(reinterpret_cast<const char*>(data.data()), data.size());
}

vector<string> getFilesInCurrentDir() {
    vector<string> files;
    try {
        for (const auto& entry : fs::directory_iterator(fs::current_path())) {
            if (entry.is_regular_file()) {
                string filename = entry.path().filename().string();
                if (isImageFile(filename)) {
                    files.push_back(filename + " 🖼️");
                } else {
                    files.push_back(filename);
                }
            }
        }
    } catch (const exception& e) {
        cerr << "Ошибка чтения директории: " << e.what() << endl;
    }
    return files;
}

// ================== Определение типа файла ==================

bool isImageFile(const std::string& filename) {
    static const vector<string> imageExtensions = {
        ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff", ".tif", 
        ".webp", ".raw", ".ico", ".svg", ".psd"
    };
    
    string ext = getFileExtension(filename);
    transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
    
    return find(imageExtensions.begin(), imageExtensions.end(), ext) != imageExtensions.end();
}

std::string getFileExtension(const std::string& filename) {
    fs::path p(filename);
    return p.extension().string();
}

std::string getFileType(const std::string& filename) {
    if (isImageFile(filename)) {
        return "Изображение";
    }
    
    string ext = getFileExtension(filename);
    transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
    
    // Проверки для других типов файлов
    static const vector<string> textExtensions = {
        ".txt", ".doc", ".docx", ".pdf", ".rtf", ".odt", 
        ".tex", ".md", ".log", ".csv"
    };
    static const vector<string> archiveExtensions = {
        ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", 
        ".xz", ".tgz", ".tbz2"
    };
    static const vector<string> audioExtensions = {
        ".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", 
        ".m4a", ".opus"
    };
    static const vector<string> videoExtensions = {
        ".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", 
        ".webm", ".m4v", ".3gp"
    };
    static const vector<string> codeExtensions = {
        ".cpp", ".c", ".h", ".hpp", ".java", ".py", ".js", 
        ".html", ".css", ".php", ".xml", ".json"
    };
    static const vector<string> execExtensions = {
        ".exe", ".bin", ".app", ".deb", ".rpm", ".msi"
    };
    
    if (find(textExtensions.begin(), textExtensions.end(), ext) != textExtensions.end()) {
        return "Текстовый файл";
    } else if (find(archiveExtensions.begin(), archiveExtensions.end(), ext) != archiveExtensions.end()) {
        return "Архив";
    } else if (find(audioExtensions.begin(), audioExtensions.end(), ext) != audioExtensions.end()) {
        return "Аудио файл";
    } else if (find(videoExtensions.begin(), videoExtensions.end(), ext) != videoExtensions.end()) {
        return "Видео файл";
    } else if (find(codeExtensions.begin(), codeExtensions.end(), ext) != codeExtensions.end()) {
        return "Исходный код";
    } else if (find(execExtensions.begin(), execExtensions.end(), ext) != execExtensions.end()) {
        return "Исполняемый файл";
    } else if (ext.empty()) {
        return "Файл без расширения";
    } else {
        return "Другой файл";
    }
}

void createLogFile(const string& outputPath, const string& cipherName,
                 const string& operation, const string& key,
                 const string& inputFile, const string& outputFile) {
    try {
        fs::path logPath = fs::path(outputPath).parent_path() / 
                          (fs::path(outputPath).stem().string() + 
                          "_" + operation + "_log.txt");
        
        ofstream log(logPath);
        auto now = chrono::system_clock::now();
        auto now_time = chrono::system_clock::to_time_t(now);
        
        log << "=== Лог операции ===" << "\n"
            << "Тип операции: " << (operation == "cipher" ? "Шифрование" : "Дешифрование") << "\n"
            << "Алгоритм: " << cipherName << "\n"
            << "Входной файл: " << inputFile << "\n"
            << "Тип файла: " << getFileType(inputFile) << "\n"
            << "Ключ: " << key << "\n"
            << "Выходной файл: " << outputFile << "\n"
            << "Время выполнения: " << put_time(localtime(&now_time), "%Y-%m-%d %H:%M:%S") << "\n";
    } catch (const exception& e) {
        cerr << "Ошибка создания лог-файла: " << e.what() << endl;
    }
}

// ================== Генерация случайных чисел ==================

int randomInt(int min, int max) {
    static random_device rd;
    static mt19937 gen(rd());
    uniform_int_distribution<> distrib(min, max);
    return distrib(gen);
}

string generateRandomKey(int length) {
    const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    string key;
    
    for (int i = 0; i < length; i++) {
        key += chars[randomInt(0, chars.length() - 1)];
    }
    
    return key;
}

// ================== Вывод результатов ==================

void printHex(const vector<unsigned char>& data) {
    cout << "Результат (hex): ";
    for (unsigned char c : data) {
        cout << hex << setw(2) << setfill('0') << static_cast<int>(c) << " ";
    }
    cout << dec << endl;
}

void printTextRepresentation(const vector<unsigned char>& data) {
    cout << "Символьное представление: ";
    for (unsigned char c : data) {
        if (isprint(c)) cout << c;
        else cout << ".";
    }
    cout << endl;
}

// ================== Функции для работы с hex ==================

vector<unsigned char> hexToBytes(const string& hex) {
    vector<unsigned char> bytes;
    string hexClean = hex;
    
    hexClean.erase(remove_if(hexClean.begin(), hexClean.end(), ::isspace), hexClean.end());
    
    if (hexClean.length() % 2 != 0) {
        throw runtime_error("Hex строка должна иметь четное количество символов");
    }

    for (size_t i = 0; i < hexClean.length(); i += 2) {
        string byteString = hexClean.substr(i, 2);
        char* end;
        unsigned long byte = strtoul(byteString.c_str(), &end, 16);
        if (*end != '\0' || byte > 255) {
            throw runtime_error("Неверный hex формат");
        }
        bytes.push_back(static_cast<unsigned char>(byte));
    }
    
    return bytes;
}

void saveKeyToFile(const string& filename, const map<pair<unsigned char, unsigned char>, unsigned char>& key) {
    ofstream file(filename, ios::binary);
    if (!file) throw runtime_error("Не удалось открыть файл для записи ключа");

    for (const auto& entry : key) {
        file.write(reinterpret_cast<const char*>(&entry.first.first), sizeof(unsigned char));
        file.write(reinterpret_cast<const char*>(&entry.first.second), sizeof(unsigned char));
        file.write(reinterpret_cast<const char*>(&entry.second), sizeof(unsigned char));
    }
}

map<pair<unsigned char, unsigned char>, unsigned char> loadKeyFromFile(const string& filename) {
    ifstream file(filename, ios::binary);
    if (!file) throw runtime_error("Не удалось открыть файл для чтения ключа");

    map<pair<unsigned char, unsigned char>, unsigned char> key;
    unsigned char first, second, value;

    while (file.read(reinterpret_cast<char*>(&first), sizeof(unsigned char))) {
        if (!file.read(reinterpret_cast<char*>(&second), sizeof(unsigned char))) break;
        if (!file.read(reinterpret_cast<char*>(&value), sizeof(unsigned char))) break;
        key[make_pair(first, second)] = value;
    }

    return key;
}

string bytesToHex(const vector<unsigned char>& data) {
    ostringstream oss;
    oss << hex << setfill('0');
    for (unsigned char c : data) {
        oss << setw(2) << static_cast<int>(c) << " ";
    }
    return oss.str();
}
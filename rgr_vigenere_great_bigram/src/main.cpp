#include <iostream>
#include <string>
#include <locale.h>
#include <clocale>
#include "vigenere/vigenere_cipher_interface.h"
#include "great/great_cipher_interface.h"
#include "bigram/bigram_cipher_interface.h"
#include "utils.h"

using namespace std;

void runVigenereWrapper() {
    runVigenereCipher();
}

void runGreatCipherWrapper() {
    runGreatCipher();
}

void runBigramWrapper() {
    runBigramCipher();
}


bool checkPassword() {
    const string correctPassword = "securepass";
    int attempts = 3;

    while (attempts > 0) {
        string input = getLine("Введите пароль: ", true);
        if (input == correctPassword) {
            cout << "Доступ разрешён!\n";
            return true;
        }
        attempts--;
        cout << "Неверный пароль. Осталось попыток: " << attempts << endl;
    }

    cout << "Доступ запрещён. Программа завершает работу.\n";
    return false;
}

int main() {
    // Инициализация локали
    setlocale(LC_ALL, "ru_RU.UTF-8");
    locale::global(locale("ru_RU.UTF-8"));
    cout.imbue(locale("ru_RU.UTF-8"));
    cin.imbue(locale("ru_RU.UTF-8"));
    
    if (!checkPassword()) return 1;

    while (true) {
        int choice = getChoice(
            "Выберите шифр:\n"
            "1. Шифр Виженера\n"
            "2. Великий шифр\n"
            "3. Биграммный шифр\n"
            "4. Выход\n"
            "Ваш выбор: ", {1, 2, 3, 4}
        );

        if (choice == 4) break;

        try {
            switch (choice) {
                case 1: runVigenereCipher(); break;
                case 2: runGreatCipher(); break;
                case 3: runBigramCipher(); break;
            }
        } catch (const exception& e) {
            cerr << "Ошибка: " << e.what() << endl;
        }
        
        cout << "\nНажмите Enter для продолжения...";
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }

    return 0;
}
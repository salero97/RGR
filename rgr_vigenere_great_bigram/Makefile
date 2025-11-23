CXX :=  g++
CXXFLAGS :=	-std=c++17 -Wall -Wextra -Iinclude -Iinclude/vigenere -Iinclude/great -Iinclude/bigram -O3 -march=native
LDLIBS :=   -lm -lstdc++fs

TARGET :=   EDR
BIN_DIR :=  bin
OBJ_DIR :=  obj
SRC_DIR :=  src

SOURCES :=  \
    $(SRC_DIR)/vigenere/vigenere_cipher.cpp \
    $(SRC_DIR)/vigenere/vigenere_cipher_interface.cpp \
    $(SRC_DIR)/great/great_cipher.cpp \
	$(SRC_DIR)/great/great_cipher_interface.cpp \
	$(SRC_DIR)/bigram/bigram_cipher.cpp \
	$(SRC_DIR)/bigram/bigram_cipher_interface.cpp \
	$(SRC_DIR)/utils.cpp \
	$(SRC_DIR)/main.cpp

OBJECTS :=  $(patsubst $(SRC_DIR)/%.cpp,$(OBJ_DIR)/%.o,$(SOURCES))

.PHONY: all clean install uninstall

all: create_dirs $(BIN_DIR)/$(TARGET)

create_dirs:
	@mkdir -p $(BIN_DIR)
	@mkdir -p $(OBJ_DIR)/vigenere
	@mkdir -p $(OBJ_DIR)/great
	@mkdir -p $(OBJ_DIR)/bigram

$(BIN_DIR)/$(TARGET): $(OBJECTS)
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) $^ -o $@ $(LDLIBS)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	@rm -rf $(OBJ_DIR) $(BIN_DIR)

install: $(BIN_DIR)/$(TARGET)
	@echo "Установка $(TARGET) в /usr/local/bin"
	@sudo install -m 755 $(BIN_DIR)/$(TARGET) /usr/local/bin/$(TARGET)
	@echo "Установка завершена. Теперь используйте '$(TARGET)' в терминале"

uninstall:
	@echo "Удаление $(TARGET) из системы"
	@sudo rm -f /usr/local/bin/$(TARGET)
	@echo "Программа удалена"
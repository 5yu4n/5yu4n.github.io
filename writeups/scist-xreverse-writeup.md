
# SCIST Reverse Writeup

## Sharingan

**分數：50**

先用 `xxd` 看 `itachi.jpg` 檔頭：

```
xxd itachi.jpg
```

發現檔案開頭是 `e0ff d8ff`，但 JPEG 正確的開頭應該是 `ffd8 dde0`。旁邊還有 `464a 1000`，但正常應是 `0010 4a46`。推測中間資料被做了類似字節顛倒處理。

處理流程：

1. 把檔案轉成一行純 hex：

```bash
xxd -p -c 9999999 itachi.jpg > 1.hex
```

2. 用 Python 程式把中間資料（去掉頭尾）每 4 bytes 做反轉：

```python
def decrypt_middle_hex(data_hex):
    if len(data_hex) < 16:
        raise ValueError("資料長度太短，無法處理")

    prefix = data_hex[:8]
    suffix = data_hex[-8:]
    middle = data_hex[8:-8]

    # 裁切成 8 的倍數長度
    cut_length = len(middle) - (len(middle) % 8)
    middle = middle[:cut_length]

    result = bytearray.fromhex(prefix)
    for i in range(0, len(middle), 8):
        block = middle[i:i+8]
        bytes_list = [block[j:j+2] for j in range(0, 8, 2)]
        result.extend(bytes.fromhex(''.join(reversed(bytes_list))))
    result.extend(bytearray.fromhex(suffix))

    return result

def main():
    with open("1.hex", "r") as f:
        hex_data = f.read().replace("\n", "").strip()

    decrypted_bytes = decrypt_middle_hex(hex_data)

    with open("2.hex", "w") as f:
        f.write(decrypted_bytes.hex())

    print("✅ 解密完成：已輸出至 2.hex")

if __name__ == "__main__":
    main()
```

3. 執行後，手動把 `2.hex` 檔案開頭改成 `ffd8ffe0`，結尾改成 `00104a46`。

4. 轉回二進位檔：

```bash
xxd -p -r 2.hex test.jpg
```

5. 用圖片瀏覽器打開 `test.jpg` 即可看到正確照片。

---

## Entry Point

**分數：50**

分析反編譯碼後發現，`sub_11EA` 裡有條件：

```c
if ( v1 == 1418168133 )
```

只要輸入 `1418168133` 即可過關。

---

## xor-checker

**分數：50**

此題可參考原碼：[xor\_checker.c](https://github.com/kazmatw/Kazma-Reverse-Engineering-Course/blob/main/lab-source/xor_checker.c)

可知用 `xor_key = 0x5A` 對加密flag陣列逐字元做 XOR，還原原始字串。

解法示範：

```python
encrypted_flag = [
    60, 54, 59, 61, 33, 35, 53, 47, 5, 50, 
    59, 44, 63, 5, 54, 63, 59, 40, 52, 63, 
    62, 5, 60, 54, 59, 61, 5, 57, 50, 63, 
    57, 49, 63, 40, 39
]

xor_key = 0x5A
flag = ''.join(chr(b ^ xor_key) for b in encrypted_flag)
print(flag)
```

執行後即可得到正確 flag。

---

觀察力驚人😦：D
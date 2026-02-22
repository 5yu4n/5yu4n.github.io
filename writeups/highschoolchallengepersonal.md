

# 高中跨校資安實務素養體驗賽 個人賽2025
by syuan

## PicoCTF解題 - Vigenere
這題可以用專門的工具解
https://cryptii.com/pipes/vigenere-cipher
把密鑰
和密文貼上去就可以解開了![image](https://hackmd.io/_uploads/BJzrnDl1Wg.png)
或者用這段程式碼去解也可以
```
ciphertext = "rgnoDVD{O0NU_WQ3_G1G3O3T3_A1AH3S_2951c89f}"
key = "CYLAB"

def vigenere_decrypt(cipher, key):
    result = []
    key = key.upper()
    ki = 0
    for ch in cipher:
        if ch.isalpha():
            k = ord(key[ki % len(key)]) - ord('A')
            if ch.isupper():
                dec = chr((ord(ch) - ord('A') - k) % 26 + ord('A'))
            else:
                dec = chr((ord(ch) - ord('a') - k) % 26 + ord('a'))
            result.append(dec)
            ki += 1
        else:
            result.append(ch)
    return ''.join(result)

plaintext = vigenere_decrypt(ciphertext, key)

print(plaintext)
```
flag:`picoCTF{D0NT_US3_V1G3N3R3_C1PH3R_2951a89h}`
## ABCTF – 凱薩加密法
這題可以用爆破的方式(因為答案也只有26種)
可以用
https://cryptii.com/pipes/caesar-cipher 
手動去猜
![image](https://hackmd.io/_uploads/SyTqaDlkWg.png)
或者跑腳本看哪個看起來比較像是flag就行
```
def caesar_decrypt_alphanumeric(text, shift):
    result = ""
    charset = "abcdefghijklmnopqrstuvwxyz"
    
    for char in text:
        if char.lower() in charset:
            index = charset.index(char.lower())
            new_index = (index - shift) % 26
            if char.isupper():
                result += charset[new_index].upper()
            else:
                result += charset[new_index]
        else:
            result += char
    return result

def brute_force_caesar_alphanumeric(ciphertext):
    for shift in range(26):
        decrypted = caesar_decrypt_alphanumeric(ciphertext, shift)
        print(f"mov {shift:2d}: {decrypted}")

ciphertext = "xyzqc{t3_qelrdeq_t3_k33a3a_lk3_lc_qe3p3}"
brute_force_caesar_alphanumeric(ciphertext)
```
flag:`abctf{w3_thought_w3_n33d3d_on3_of_th3s3}`
## RC3 - 凱薩加密進階
這題他把字符集多了0-9
所以把剛才的程式碼加一點東西就行
```
def caesar_decrypt_alphanumeric(text, shift):
    result = ""
    charset = "0123456789abcdefghijklmnopqrstuvwxyz"
    
    for char in text:
        if char.lower() in charset:
            index = charset.index(char.lower())
            new_index = (index - shift) % 36
            if char.isupper():
                result += charset[new_index].upper()
            else:
                result += charset[new_index]
        else:
            result += char
    return result

def brute_force_caesar_alphanumeric(ciphertext):
    for shift in range(36):
        decrypted = caesar_decrypt_alphanumeric(ciphertext, shift)
        print(f"mov {shift:2d}: {decrypted}")

ciphertext = "7sj-ighm-742q3w4t"
brute_force_caesar_alphanumeric(ciphertext)
```
flag:`rc3-2016-romangod`

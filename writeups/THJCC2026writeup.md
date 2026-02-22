# THJCC 2026 writeup

## 前言
這次比賽其實我原本有出3題但是兩題有點太通不敢放所以這次大家只有看到我的一個web
其實我原本預期大家會第一個解出的會是我的題目~~解果看來大家都用ai在打~~
蠻訝異的不過沒關系下次細節多注意就好


## noaiiiiiii

這題其實算是需要注重細節and真的不能用ai解，我算是挖了很多坑給ai跳
首先應該有很多人都跳到的是ssti的坑不過如果認真系統化地去探就可以發現他除了0-9之外所有字元都被ban了也因此我們必須得轉向去探別的地方
![image](https://hackmd.io/_uploads/SJ0pCcdOZl.png)
有些人是注意到我的提示或用dirb都可以發現有robots.txt的存在
![image](https://hackmd.io/_uploads/rk2M1suOZl.png)
進去後就可以看到我的大提示
接著我們去看就可以發現
![image](https://hackmd.io/_uploads/Sycd1jOd-e.png)
其中Dockerfile是一個重點認真看會發現這個web用的是node:8.5.0這個超上古版本
上古版本很多都有已知的cve去查就可以找到一大票
![image](https://hackmd.io/_uploads/H144lju_We.png)
這邊解釋一下CVE-2017-14849由於 Node.js 8.5.0裡面normalize處理目錄路徑時函數存在邏輯錯誤而導致的一個神奇漏洞理論上我們不應該可以路徑跳躍
like this
![image](https://hackmd.io/_uploads/H1IeWsu_Ze.png)
but神奇的點在於如果我們在中間塞一個錯誤路徑例如
![image](https://hackmd.io/_uploads/rypubsdO-x.png)
此時前面的../會被錯誤處理掉也就是變成
http://chal.thjcc.org:3001/static/../../../etc/passwd
然後後面的../會正常的路徑跳躍
因此產生CVE-2017-14849
so 利用這個cve和Dockerfile提示的路徑我們可以
```curl http://chal.thjcc.org:3001/static/../../a/../../../flag_F7aQ9L2mX8RkC4ZP --path-as-is```
就能輕鬆解決這題了


.w.

![image](https://hackmd.io/_uploads/By-uziOdWg.png)
最後有29人解出來(wwww開心
btw謝謝Auron寶幫我架題目
![image](https://hackmd.io/_uploads/HynxXsduWx.png)

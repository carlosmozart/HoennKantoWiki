"""Redimensiona PNG sem dependencias externas (Pillow nao esta disponivel).

Le PNG de 8 bits nos tipos de cor 2 (RGB), 4 (cinza+alfa) e 6 (RGBA), aplica
reducao por media de area e regrava. Usado para trazer artes do Bulbagarden
(que chegam com 1200x2500 e varios MB) para o tamanho dos cards do projeto.
"""
import struct
import sys
import zlib

CANAIS = {0: 1, 2: 3, 4: 2, 6: 4}


def ler(caminho):
    d = open(caminho, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n', 'nao e PNG'
    i, idat, hdr, plte, trns = 8, b'', None, None, None
    while i < len(d):
        ln = struct.unpack('>I', d[i:i + 4])[0]
        tipo = d[i + 4:i + 8]
        dados = d[i + 8:i + 8 + ln]
        if tipo == b'IHDR':
            hdr = struct.unpack('>IIBBBBB', dados)
        elif tipo == b'IDAT':
            idat += dados
        elif tipo == b'PLTE':
            plte = dados
        elif tipo == b'tRNS':
            trns = dados
        i += 12 + ln
    w, h, bd, ct, _, _, il = hdr
    assert bd == 8 and il == 0, f'suporta apenas 8 bits sem entrelacamento (bd={bd}, il={il})'

    canais = 4 if ct == 3 else CANAIS[ct]
    origem = 1 if ct == 3 else CANAIS[ct]
    raw = zlib.decompress(idat)
    stride = w * origem
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        linha = bytearray(raw[p:p + stride]); p += stride
        for x in range(stride):
            a = linha[x - origem] if x >= origem else 0
            b = prev[x]
            c = prev[x - origem] if x >= origem else 0
            if f == 1: linha[x] = (linha[x] + a) & 255
            elif f == 2: linha[x] = (linha[x] + b) & 255
            elif f == 3: linha[x] = (linha[x] + ((a + b) >> 1)) & 255
            elif f == 4:
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                linha[x] = (linha[x] + pr) & 255
        out[y * stride:(y + 1) * stride] = linha
        prev = linha

    # normaliza tudo para RGBA
    px = bytearray(w * h * 4)
    for i2 in range(w * h):
        if ct == 3:
            idx = out[i2]
            px[i2*4:i2*4+3] = plte[idx*3:idx*3+3]
            px[i2*4+3] = trns[idx] if trns and idx < len(trns) else 255
        elif ct == 6:
            px[i2*4:i2*4+4] = out[i2*4:i2*4+4]
        elif ct == 2:
            px[i2*4:i2*4+3] = out[i2*3:i2*3+3]; px[i2*4+3] = 255
        elif ct == 4:
            v = out[i2*2]; px[i2*4:i2*4+3] = bytes([v, v, v]); px[i2*4+3] = out[i2*2+1]
        elif ct == 0:
            v = out[i2]; px[i2*4:i2*4+3] = bytes([v, v, v]); px[i2*4+3] = 255
    return w, h, px


def escrever(caminho, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y*w*4:(y+1)*w*4]) for y in range(h))
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    open(caminho, 'wb').write(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b''))


def redimensionar(origem, destino, altura_max):
    w, h, px = ler(origem)
    if h <= altura_max:
        escrever(destino, w, h, px)
        return w, h
    escala = altura_max / h
    nw, nh = max(1, round(w * escala)), altura_max
    dst = bytearray(nw * nh * 4)
    # media de area: melhor que vizinho mais proximo ao reduzir muito
    for y in range(nh):
        y0, y1 = int(y * h / nh), max(int(y * h / nh) + 1, int((y + 1) * h / nh))
        for x in range(nw):
            x0, x1 = int(x * w / nw), max(int(x * w / nw) + 1, int((x + 1) * w / nw))
            r = g = b = a = n = 0
            for sy in range(y0, y1):
                base = sy * w * 4
                for sx in range(x0, x1):
                    o = base + sx * 4
                    al = px[o + 3]
                    r += px[o] * al; g += px[o+1] * al; b += px[o+2] * al
                    a += al; n += 1
            o = (y * nw + x) * 4
            if a:
                dst[o] = min(255, r // a); dst[o+1] = min(255, g // a); dst[o+2] = min(255, b // a)
            dst[o+3] = a // n if n else 0
    escrever(destino, nw, nh, dst)
    return nw, nh


if __name__ == '__main__':
    origem, destino, alt = sys.argv[1], sys.argv[2], int(sys.argv[3])
    import os
    antes = os.path.getsize(origem)
    nw, nh = redimensionar(origem, destino, alt)
    print(f'{destino}: {nw}x{nh}, {antes/1024:.0f} KB -> {os.path.getsize(destino)/1024:.0f} KB')

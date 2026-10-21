#!/usr/bin/env python3
"""Preprocesa las cabezas de Kenney Mini Characters para el editor de avatares.

Problema: en algunas cabezas el pelo y los ojos usan la misma franja de la paleta
(columna 1, fila 3), así que recolorear el pelo cambiaría también los ojos.

Solución: mueve las UV de las piezas de pelo a la columna 0 de la misma fila, que tiene
prácticamente el mismo color. El aspecto original no cambia, pero el pelo pasa a tener
una franja propia. Los rasgos faciales se reconocen como componentes conexos pequeños
situados en el plano frontal y centrados en la cara, y no se tocan.

Uso: python3 tools/split_hair_uv.py <origen_dir> <destino_dir>
Licencia de los modelos: CC0 (Kenney). Este script solo modifica coordenadas UV.
"""
import glob
import json
import os
import struct
import sys

SHARED_CELL = (1, 3)  # (columna, fila) de la paleta 16x4
HAIR_COLUMN = 0
FACE_Z = 0.12
FEATURE_SIZE = 0.12
FACE_HALF_WIDTH = 0.13


def read_glb(path):
    data = open(path, "rb").read()
    json_len = struct.unpack("<I", data[12:16])[0]
    gltf = json.loads(data[20:20 + json_len])
    off = 20 + json_len
    bin_len = struct.unpack("<I", data[off:off + 4])[0]
    return data, gltf, off + 8, bin_len


def accessor_info(gltf, index):
    acc = gltf["accessors"][index]
    view = gltf["bufferViews"][acc["bufferView"]]
    start = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
    return acc, view, start


def components(indices, n):
    parent = list(range(n))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]
        for x, y in ((a, b), (b, c)):
            ra, rb = find(x), find(y)
            if ra != rb:
                parent[ra] = rb
    groups = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(i)
    return list(groups.values())


def process(src, dst):
    data, gltf, bin_start, _ = read_glb(src)
    out = bytearray(data)
    moved = 0
    for mesh in gltf["meshes"]:
        if mesh["name"] != "head-mesh":
            continue
        for prim in mesh["primitives"]:
            uv_acc, uv_view, uv_start = accessor_info(gltf, prim["attributes"]["TEXCOORD_0"])
            _, pos_view, pos_start = accessor_info(gltf, prim["attributes"]["POSITION"])
            idx_acc, idx_view, idx_start = accessor_info(gltf, prim["indices"])
            n = uv_acc["count"]
            uv_stride = uv_view.get("byteStride", 8)
            pos_stride = pos_view.get("byteStride", 12)
            fmt = {5121: "<B", 5123: "<H", 5125: "<I"}[idx_acc["componentType"]]
            isz = struct.calcsize(fmt)
            indices = [struct.unpack(fmt, data[bin_start + idx_start + k * isz:bin_start + idx_start + (k + 1) * isz])[0] for k in range(idx_acc["count"])]
            uvs = [struct.unpack("<ff", data[bin_start + uv_start + k * uv_stride:bin_start + uv_start + k * uv_stride + 8]) for k in range(n)]
            pos = [struct.unpack("<fff", data[bin_start + pos_start + k * pos_stride:bin_start + pos_start + k * pos_stride + 12]) for k in range(n)]
            for group in components(indices, n):
                in_cell = [k for k in group if (int(uvs[k][0] * 16), int(uvs[k][1] * 4)) == SHARED_CELL]
                if not in_cell:
                    continue
                xs = [pos[k][0] for k in group]
                ys = [pos[k][1] for k in group]
                is_feature = (min(pos[k][2] for k in group) > FACE_Z and max(xs) - min(xs) < FEATURE_SIZE
                              and max(ys) - min(ys) < FEATURE_SIZE and abs((max(xs) + min(xs)) / 2) < FACE_HALF_WIDTH)
                if is_feature:
                    continue
                for k in in_cell:
                    u, v = uvs[k]
                    u = (HAIR_COLUMN + (u * 16 - SHARED_CELL[0])) / 16.0
                    struct.pack_into("<ff", out, bin_start + uv_start + k * uv_stride, u, v)
                    moved += 1
    with open(dst, "wb") as f:
        f.write(out)
    return moved


def main():
    src_dir, dst_dir = sys.argv[1], sys.argv[2]
    os.makedirs(dst_dir, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(src_dir, "character-*.glb"))):
        moved = process(path, os.path.join(dst_dir, os.path.basename(path)))
        print(f"{os.path.basename(path)}: {moved} vértices de pelo movidos a su propia franja")


if __name__ == "__main__":
    main()

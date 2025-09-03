import bpy
import math
import os
import sys
from math import radians, sin, cos


def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)
    for block in bpy.data.textures:
        if block.users == 0:
            bpy.data.textures.remove(block)
    for block in bpy.data.images:
        if block.users == 0:
            bpy.data.images.remove(block)


def new_collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def clear_selection():
    for o in bpy.context.selected_objects:
        o.select_set(False)


def set_active(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def make_mat(name, color=(1, 1, 1, 1), metallic=0.0, rough=0.45, transmission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Transmission"].default_value = transmission
    return mat


def add_cylinder(name, r, depth, z=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=(0, 0, z))
    o = bpy.context.active_object
    o.name = name
    return o


def add_box(name, size_x, size_y, size_z, loc, rot_z=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=(0, 0, rot_z))
    o = bpy.context.active_object
    o.name = name
    o.scale = (size_x / 2, size_y / 2, size_z / 2)
    bpy.ops.object.transform_apply(scale=True)
    return o


def add_text(body, size, extrude, loc, rot=(0, 0, 0), font_path=""):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    t = bpy.context.active_object
    t.data.body = body
    if font_path:
        try:
            t.data.font = bpy.data.fonts.load(font_path)
        except Exception:
            pass
    t.data.align_x = 'CENTER'
    t.data.align_y = 'CENTER'
    t.data.size = size
    t.data.extrude = extrude
    return t


def build_clock(
    radius=0.15,
    rim_width=0.012,
    rim_depth=0.035,
    face_depth=0.002,
    glass_thickness=0.001,
    tick_height=0.0015,
    tick_width=0.003,
    tick_len_short=0.008,
    tick_len_long=0.016,
    digit_extrude=0.0015,
    digit_size=0.035,
    digit_radius_ratio=0.78,
    hour_hand_len=0.075,
    hour_hand_w=0.009,
    min_hand_len=0.115,
    min_hand_w=0.006,
    sec_hand_len=0.125,
    sec_hand_w=0.0025,
    hands_thickness=0.003,
    pose_h=10,
    pose_m=10,
    pose_s=0,
    font_path="",
):
    clock_col = new_collection("Clock")

    # Materials
    mat_black = make_mat("ClockBlack", (0.05, 0.05, 0.05, 1), metallic=0.0, rough=0.35)
    mat_white = make_mat("ClockWhite", (0.98, 0.98, 0.98, 1), metallic=0.0, rough=0.25)
    mat_gold = make_mat("ClockGold", (0.86, 0.75, 0.23, 1), metallic=0.7, rough=0.25)
    mat_glass = make_mat("ClockGlass", (1, 1, 1, 1), metallic=0.0, rough=0.03, transmission=1.0)

    # Geometry
    rim = add_cylinder("Rim", radius, rim_depth, z=rim_depth / 2)
    rim.data.materials.append(mat_black)
    clock_col.objects.link(rim)
    bpy.context.scene.collection.objects.unlink(rim)

    face_r = radius - rim_width
    face = add_cylinder("Face", face_r, face_depth, z=face_depth / 2 + 0.0005)
    face.data.materials.append(mat_white)
    clock_col.objects.link(face)
    bpy.context.scene.collection.objects.unlink(face)

    glass = add_cylinder("Glass", face_r * 0.995, glass_thickness, z=rim_depth - glass_thickness / 2)
    glass.data.materials.append(mat_glass)
    clock_col.objects.link(glass)
    bpy.context.scene.collection.objects.unlink(glass)

    # Ticks
    ticks_objs = []
    for i in range(60):
        ang = radians(i * 6.0)
        is_long = (i % 5 == 0)
        tlen = tick_len_long if is_long else tick_len_short
        tw = tick_width if is_long else tick_width * 0.7
        r_mid = face_r - 0.012 - tlen / 2
        x = sin(ang) * r_mid
        y = cos(ang) * r_mid
        rot = -ang
        tick = add_box(
            f"Tick_{i:02d}", tw, tlen, tick_height, (x, y, face_depth + tick_height / 2 + 0.0006), rot
        )
        tick.data.materials.append(mat_black)
        ticks_objs.append(tick)

    clear_selection()
    for o in ticks_objs:
        o.select_set(True)
    set_active(ticks_objs[0])
    bpy.ops.object.join()
    ticks = bpy.context.active_object
    ticks.name = "Ticks"
    clock_col.objects.link(ticks)
    bpy.context.scene.collection.objects.unlink(ticks)

    # Digits
    digit_objs = []
    for n in range(1, 13):
        ang = radians((n % 12) * 30.0)
        r_pos = face_r * digit_radius_ratio
        x = sin(ang) * r_pos
        y = cos(ang) * r_pos
        t = add_text(str(n), digit_size, digit_extrude, (x, y, face_depth + digit_extrude / 2 + 0.0008), font_path=font_path)
        digit_objs.append(t)

    for t in digit_objs:
        set_active(t)
        bpy.ops.object.convert(target='MESH')
    clear_selection()
    for o in digit_objs:
        o.select_set(True)
    set_active(digit_objs[0])
    bpy.ops.object.join()
    digits = bpy.context.active_object
    digits.name = "Digits"
    digits.data.materials.append(mat_black)
    clock_col.objects.link(digits)
    bpy.context.scene.collection.objects.unlink(digits)

    # Hands
    pivot_z = face_depth + 0.002

    def make_hand(name, length, width, z):
        hand = add_box(name, width, length, hands_thickness, (0, 0, z - hands_thickness / 2))
        hand.location.y = length / 2
        hand.location.x = 0
        hand.location.z = z - hands_thickness / 2
        hand.data.materials.append(mat_black)
        set_active(hand)
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
        hand.location = (0, 0, z - hands_thickness / 2)
        return hand

    hour_hand = make_hand("HourHand", hour_hand_len, hour_hand_w, pivot_z + 0.002)
    min_hand = make_hand("MinuteHand", min_hand_len, min_hand_w, pivot_z + 0.006)
    sec_hand = make_hand("SecondHand", sec_hand_len, sec_hand_w, pivot_z + 0.010)

    cap = add_cylinder("CenterCap", 0.004, 0.0035, z=pivot_z + 0.012)
    cap.data.materials.append(mat_gold)

    def set_time_pose(h, m, s):
        min_ang = -(m * 6.0)
        hour_ang = -((h % 12) * 30.0 + m * 0.5)
        sec_ang = -(s * 6.0)
        hour_hand.rotation_euler[2] = radians(hour_ang)
        min_hand.rotation_euler[2] = radians(min_ang)
        sec_hand.rotation_euler[2] = radians(sec_ang)

    set_time_pose(pose_h, pose_m, pose_s)

    for o in [hour_hand, min_hand, sec_hand, cap]:
        clock_col.objects.link(o)
        bpy.context.scene.collection.objects.unlink(o)

    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    root = bpy.context.active_object
    root.name = "ClockRoot"
    for o in [rim, face, glass, ticks, digits, hour_hand, min_hand, sec_hand, cap]:
        o.parent = root

    return root


def ensure_outdir(path):
    out_dir = os.path.dirname(path)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)


def export_gltf(filepath):
    ensure_outdir(filepath)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_yup=True,
        export_animations=False,
        export_materials='EXPORT',
    )


def main(argv):
    # Defaults
    out_path = os.getenv('CLOCK_OUT', os.path.join(os.getcwd(), 'exports', 'clock.glb'))
    font_path = ''

    # Parse args after '--'
    if '--' in argv:
        idx = argv.index('--') + 1
        args = argv[idx:]
    else:
        args = []

    i = 0
    while i < len(args):
        if args[i] in ('-o', '--out') and i + 1 < len(args):
            out_path = args[i + 1]
            i += 2
        elif args[i] in ('-f', '--font') and i + 1 < len(args):
            font_path = args[i + 1]
            i += 2
        else:
            i += 1

    purge_scene()
    build_clock(font_path=font_path)
    export_gltf(out_path)
    print(f"Exported clock to: {out_path}")


if __name__ == '__main__':
    main(sys.argv)


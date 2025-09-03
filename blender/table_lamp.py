#!/usr/bin/env python3
"""
Parametric Table Lamp generator for Blender (2.93+).

Usage (GUI):
  - Open Blender > Scripting workspace > Text Editor
  - Open this file and press Run

Usage (CLI):
  blender -b -P blender/table_lamp.py -- --export ./table_lamp.glb --scale 1.0 --energy 50

Args:
  --export PATH   Optional: export selection as GLB/GLTF/FBX (by extension)
  --scale S       Optional: uniform scale (default 1.0)
  --no-cord       Optional: skip power cord creation
  --energy W      Optional: light power in Watts (default 40)
"""

import sys
import math
import bpy


def parse_args():
    import argparse
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    p = argparse.ArgumentParser(add_help=False)
    p.add_argument("--export", type=str, default=None)
    p.add_argument("--scale", type=float, default=1.0)
    p.add_argument("--no-cord", action="store_true")
    p.add_argument("--energy", type=float, default=40.0)
    return p.parse_args(argv)


def ensure_collection(name: str) -> bpy.types.Collection:
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def new_material(name: str) -> bpy.types.Material:
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
    for n in mat.node_tree.nodes:
        mat.node_tree.nodes.remove(n)
    return mat


def make_materials():
    # Base/Stem: brushed metal
    metal = new_material("Lamp_Metal")
    nodes = metal.node_tree.nodes
    links = metal.node_tree.links
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.6, 0.62, 0.65, 1)
    bsdf.inputs["Metallic"].default_value = 0.9
    bsdf.inputs["Roughness"].default_value = 0.35
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"]) 

    # Shade: warm fabric
    shade = new_material("Lamp_Shade")
    nodes = shade.node_tree.nodes
    links = shade.node_tree.links
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.92, 0.88, 0.78, 1)
    bsdf.inputs["Subsurface"].default_value = 0.25
    bsdf.inputs["Subsurface Color"].default_value = (0.96, 0.90, 0.80, 1)
    bsdf.inputs["Roughness"].default_value = 0.9
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"]) 

    # Bulb: emissive glass
    bulb = new_material("Lamp_Bulb")
    nodes = bulb.node_tree.nodes
    links = bulb.node_tree.links
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (1.0, 0.95, 0.85, 1)
    emission.inputs["Strength"].default_value = 25.0
    glass = nodes.new("ShaderNodeBsdfGlass")
    glass.inputs["IOR"].default_value = 1.45
    mix = nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.2
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(emission.outputs["Emission"], mix.inputs[1])
    links.new(glass.outputs["BSDF"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"]) 

    # Cord: rubber/plastic
    cord = new_material("Lamp_Cord")
    nodes = cord.node_tree.nodes
    links = cord.node_tree.links
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.05, 0.05, 0.05, 1)
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 0.6
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"]) 

    return {
        "metal": bpy.data.materials["Lamp_Metal"],
        "shade": bpy.data.materials["Lamp_Shade"],
        "bulb": bpy.data.materials["Lamp_Bulb"],
        "cord": bpy.data.materials["Lamp_Cord"],
    }


def deselect_all():
    for o in bpy.context.selected_objects:
        o.select_set(False)


def set_smooth(obj: bpy.types.Object):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    if obj.data and hasattr(obj.data, "use_auto_smooth"):
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = math.radians(60)


def add_bevel(obj: bpy.types.Object, width=0.002, segments=3):
    m = obj.modifiers.new(name="Bevel", type='BEVEL')
    m.width = width
    m.segments = segments
    m.limit_method = 'ANGLE'


def create_table_lamp(scale=1.0, add_cord=True, light_energy=40.0) -> bpy.types.Object:
    col = ensure_collection("TableLamp")
    mats = make_materials()

    # Root empty for easy manipulation
    root = bpy.data.objects.new("TableLamp_Root", None)
    col.objects.link(root)
    root.empty_display_type = 'PLAIN_AXES'
    root.location = (0, 0, 0)

    # Dimensions (meters) before scale
    base_r = 0.10
    base_h = 0.03
    stem_r = 0.008
    stem_h = 0.28
    shade_h = 0.14
    shade_r_bottom = 0.12
    shade_r_top = 0.06
    bulb_r = 0.03

    # Create base
    deselect_all()
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=base_r*scale, depth=base_h*scale, location=(0, 0, base_h*scale/2))
    base = bpy.context.active_object
    base.name = "Lamp_Base"
    base.data.materials.append(mats["metal"]) 
    add_bevel(base, width=0.002*scale)
    set_smooth(base)
    base.parent = root

    # Create stem
    deselect_all()
    stem_z = base_h*scale + stem_h*scale/2
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=stem_r*scale, depth=stem_h*scale, location=(0, 0, stem_z))
    stem = bpy.context.active_object
    stem.name = "Lamp_Stem"
    stem.data.materials.append(mats["metal"]) 
    set_smooth(stem)
    stem.parent = root

    # Create shade (truncated cone)
    deselect_all()
    shade_z = base_h*scale + stem_h*scale + shade_h*scale/2 - 0.02*scale
    bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=shade_r_bottom*scale, radius2=shade_r_top*scale, depth=shade_h*scale, location=(0, 0, shade_z))
    shade = bpy.context.active_object
    shade.name = "Lamp_Shade"
    # Solidify for thickness
    solid = shade.modifiers.new(name="Solidify", type='SOLIDIFY')
    solid.thickness = 0.002 * scale
    set_smooth(shade)
    shade.data.materials.append(mats["shade"]) 
    shade.parent = root

    # Create bulb inside shade
    deselect_all()
    bulb_z = base_h*scale + stem_h*scale + 0.02*scale
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=bulb_r*scale, location=(0, 0, bulb_z))
    bulb = bpy.context.active_object
    bulb.name = "Lamp_Bulb"
    bulb.data.materials.append(mats["bulb"]) 
    set_smooth(bulb)
    bulb.parent = root

    # Add a point light slightly below shade top (helps in Eevee)
    light_data = bpy.data.lights.new(name="Lamp_Light", type='POINT')
    light_data.energy = light_energy  # Watts in Cycles; intensity in Eevee
    light_data.shadow_soft_size = 0.03 * scale
    light_obj = bpy.data.objects.new(name="Lamp_Light", object_data=light_data)
    light_obj.location = (0, 0, bulb_z)
    col.objects.link(light_obj)
    light_obj.parent = root

    # Optional: simple power cord as a curved cable
    if add_cord:
        deselect_all()
        curve_data = bpy.data.curves.new(name="Lamp_Cord_Curve", type='CURVE')
        curve_data.dimensions = '3D'
        spline = curve_data.splines.new(type='BEZIER')
        spline.bezier_points.add(2)  # total 3 points
        p0, p1, p2 = spline.bezier_points[0], spline.bezier_points[1], spline.bezier_points[2]
        # Start near base edge
        p0.co = (base_r*0.7*scale, 0.0, base_h*scale*0.6)
        p0.handle_left_type = p0.handle_right_type = 'AUTO'
        # Drop to table surface and curve
        p1.co = (base_r*1.4*scale, 0.05*scale, 0.005*scale)
        p1.handle_left_type = p1.handle_right_type = 'AUTO'
        # Extend outward/back
        p2.co = (base_r*2.2*scale, -0.25*scale, 0.005*scale)
        p2.handle_left_type = p2.handle_right_type = 'AUTO'
        curve_data.bevel_depth = 0.0025 * scale
        curve_data.bevel_resolution = 3
        cord_obj = bpy.data.objects.new("Lamp_Cord", curve_data)
        col.objects.link(cord_obj)
        if len(cord_obj.data.materials) == 0:
            cord_obj.data.materials.append(mats["cord"]) 
        cord_obj.parent = root

    # Put all objects in the collection if not already
    for obj in (base, stem, shade, bulb):
        if obj.name not in col.objects:
            col.objects.link(obj)

    # Set render engine defaults to Cycles if available
    try:
        bpy.context.scene.render.engine = 'CYCLES'
        bpy.context.scene.cycles.samples = 64
    except Exception:
        pass

    return root


def export_selected(path: str):
    path = str(path)
    ext = path.split('.')[-1].lower()
    deselect_all()
    for o in bpy.data.objects:
        if o.name.startswith("TableLamp") or o.name.startswith("Lamp_"):
            o.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects.get("TableLamp_Root")

    if ext in ("glb", "gltf"):
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB' if ext == 'glb' else 'GLTF', use_selection=True)
    elif ext == "fbx":
        bpy.ops.export_scene.fbx(filepath=path, use_selection=True, apply_scale_options='FBX_SCALE_ALL')
    elif ext in ("obj",):
        bpy.ops.export_scene.obj(filepath=path, use_selection=True)
    else:
        raise ValueError(f"Unsupported export extension: {ext}")


def main():
    args = parse_args()

    # Optional: clean previous lamp
    for o in list(bpy.data.objects):
        if o.name.startswith("TableLamp") or o.name.startswith("Lamp_"):
            try:
                bpy.data.objects.remove(o, do_unlink=True)
            except Exception:
                pass
    for c in list(bpy.data.collections):
        if c.name == "TableLamp" and not c.objects:
            try:
                bpy.data.collections.remove(c)
            except Exception:
                pass

    root = create_table_lamp(scale=args.scale, add_cord=(not args.no_cord), light_energy=args.energy)
    print(f"Created Table Lamp: root={root.name}, scale={args.scale}, energy={args.energy}W, cord={not args.no_cord}")

    if args.export:
        export_selected(args.export)
        print(f"Exported selection to: {args.export}")


if __name__ == "__main__":
    main()


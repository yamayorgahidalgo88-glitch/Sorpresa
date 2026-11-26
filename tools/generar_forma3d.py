import glob,os,time,shutil,sys
from gradio_client import Client, handle_file
f=lambda n: handle_file(n) if os.path.exists(n) else None
todo=[t for t in sys.argv[1:] if not os.path.exists(f'{t}_shape.glb')]
for attempt in range(40):
    if not todo: break
    t=todo[0]; before=set(glob.glob('/tmp/gradio/*/*.glb')); msg='ok'
    left=f'{t}_left.png' if os.path.exists(f'{t}_left.png') else f'{t}_side.png'
    try:
        Client('tencent/Hunyuan3D-2mv',verbose=False).predict(caption=None,image=None,mv_image_front=f(f'{t}_front.png'),mv_image_back=f(f'{t}_back.png'),mv_image_left=f(left),mv_image_right=f(f'{t}_right.png'),steps=5,guidance_scale=5.0,seed=1234,octree_resolution=256,check_box_rembg=True,num_chunks=8000,randomize_seed=False,api_name='/shape_generation')
    except Exception as e: msg=str(e)[:160]
    new=sorted(set(glob.glob('/tmp/gradio/*/*.glb'))-before)
    if new: shutil.copy(new[-1],f'{t}_shape.glb'); todo.pop(0); print(time.strftime('%H:%M'),t,'DONE',flush=True); continue
    print(time.strftime('%H:%M'),t,'FAIL',msg,flush=True); time.sleep(420)
print('END remaining',todo,flush=True)

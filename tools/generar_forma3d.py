import sys,glob,os,time,shutil
from gradio_client import Client, handle_file
t=sys.argv[1]; f=lambda n: handle_file(n) if os.path.exists(n) else None
c=Client('tencent/Hunyuan3D-2mv'); t0=time.time()
before=set(glob.glob('/tmp/gradio/*/*.glb'))
try:
  c.predict(caption=None,image=None,mv_image_front=f(f'{t}_front.png'),mv_image_back=f(f'{t}_back.png'),mv_image_left=f(f'{t}_side.png'),mv_image_right=f(f'{t}_sideR.png'),steps=5,guidance_scale=5.0,seed=1234,octree_resolution=256,check_box_rembg=True,num_chunks=8000,randomize_seed=False,api_name='/shape_generation')
except Exception as e: print('ERR',str(e)[:300])
new=set(glob.glob('/tmp/gradio/*/*.glb'))-before
print(t, time.time()-t0, new)
for n in new: shutil.copy(n,f'{t}_shape.glb')

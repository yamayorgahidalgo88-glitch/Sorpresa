import sys, numpy as np, trimesh, fast_simplification
from PIL import Image
from scipy import ndimage
t=sys.argv[1]; views=sys.argv[2].split(','); target=int(sys.argv[3]) if len(sys.argv)>3 else 120000
A='/home/user/Sorpresa/bestiario/assets/'
m=trimesh.load(f'{t}_shape.glb',force='mesh'); m.merge_vertices()
m.update_faces(m.nondegenerate_faces()); m.update_faces(m.unique_faces()); m.remove_unreferenced_vertices()
parts=sorted(m.split(only_watertight=False),key=lambda p:-len(p.faces)); m=trimesh.util.concatenate([p for p in parts if len(p.faces)>len(parts[0].faces)*0.02])
print('clean',len(m.vertices),len(m.faces))
r=1-target/len(m.faces)
if r>0:
    v,f=fast_simplification.simplify(m.vertices.astype(np.float32),m.faces,target_reduction=r)
    m=trimesh.Trimesh(v,f,process=True)
V=m.vertices; N=m.vertex_normals
x,y,z=V[:,0],V[:,1],V[:,2]
acc=np.zeros((len(V),3)); wsum=np.zeros(len(V))
size=np.ptp(V,axis=0).max()
for spec in views:
    parts_=spec.split(':')
    if parts_[0] in ('top','bottom'):
        key=parts_[1] if len(parts_)>1 else parts_[0]; mir=False
        if parts_[0]=='top': u,v,d,dr=x,z,y,(0,1,0)
        else: u,v,d,dr=x,-z,-y,(0,-1,0)
        wgt=1.0
    else:
        a=np.radians(float(parts_[0])); key=parts_[1]; mir=len(parts_)>2
        dr=(np.sin(a),0,np.cos(a)); rt=(np.cos(a),0,-np.sin(a))
        u=V@np.array(rt); v=-y; d=V@np.array(dr)
        wgt=1.0 if float(parts_[0])%90==0 else 0.6
    im=Image.open(A+f'{t}_{key}.webp').convert('RGBA')
    if mir: im=im.transpose(Image.FLIP_LEFT_RIGHT)
    a_=np.asarray(im).astype(float); H,W=a_.shape[:2]
    px=(u-u.min())/np.ptp(u)*(W-1); py=(v-v.min())/np.ptp(v)*(H-1)
    R=256; gx=np.clip((px/(W-1)*(R-1)).astype(int),0,R-1); gy=np.clip((py/(H-1)*(R-1)).astype(int),0,R-1)
    dm=np.full((R,R),-1e9); np.maximum.at(dm,(gy,gx),d); dm=ndimage.maximum_filter(dm,size=5)
    vis=d>=dm[gy,gx]-size*0.03
    ix=np.clip(np.round(px).astype(int),0,W-1); iy=np.clip(np.round(py).astype(int),0,H-1)
    col=a_[iy,ix]; al=col[:,3]/255
    w=wgt*np.clip(N@np.array(dr,float),0,1)**3*vis*(al>0.5)
    acc+=col[:,:3]*w[:,None]; wsum+=w
    print(spec,'covered',(w>0.05).mean().round(3))
miss=wsum<1e-4
col=acc/np.maximum(wsum,1e-6)[:,None]
# fill uncovered vertices from neighbours
if miss.any():
    adj=m.vertex_neighbors
    for it in range(30):
        idx=np.where(miss)[0]
        if not len(idx): break
        for i in idx:
            nb=[j for j in adj[i] if not miss[j]]
            if nb: col[i]=col[nb].mean(0); miss[i]=False
print('missing',miss.sum())
m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=np.c_[np.clip(col,0,255),np.full(len(V),255)].astype(np.uint8))
# center at feet, height 1
m.apply_translation([-m.bounds[:,0].mean(),-m.bounds[0,1],-m.bounds[:,2].mean()]); m.apply_scale(1/np.ptp(m.vertices[:,1]))
m.export(f'{t}.glb'); import os; print(t,len(m.vertices),len(m.faces),os.path.getsize(f'{t}.glb')//1024,'KB')

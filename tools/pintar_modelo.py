import sys, numpy as np, trimesh, fast_simplification, xatlas, io
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
t=sys.argv[1]; specs=sys.argv[2].split(','); NF=int(sys.argv[3]) if len(sys.argv)>3 else 30000; T=1024
A='/home/user/Sorpresa/bestiario/assets/'
m=trimesh.load(f'{t}_shape.glb',force='mesh'); m.merge_vertices()
m.update_faces(m.nondegenerate_faces()); m.update_faces(m.unique_faces()); m.remove_unreferenced_vertices()
parts=sorted(m.split(only_watertight=False),key=lambda p:-len(p.faces)); m=trimesh.util.concatenate([p for p in parts if len(p.faces)>len(parts[0].faces)*0.01])
# normalizar: pies en y=0, centrado, altura 1
m.apply_translation([-m.bounds[:,0].mean(),-m.bounds[0,1],-m.bounds[:,2].mean()]); m.apply_scale(1/np.ptp(m.vertices[:,1]))
D=np.asarray(m.vertices)                      # malla densa para oclusión y encaje
v,f=fast_simplification.simplify(D.astype(np.float32),m.faces,target_reduction=1-NF/len(m.faces))
s=trimesh.Trimesh(v,f,process=True)
vm,F,UV=xatlas.parametrize(s.vertices,s.faces)
V=np.asarray(s.vertices)[vm]; N=np.asarray(s.vertex_normals)[vm]
# rasterizar el atlas: posición y normal por texel
P=np.zeros((T,T,3),np.float32); NM=np.zeros((T,T,3),np.float32); M=np.zeros((T,T),bool)
uvp=UV*(T-1)
for tri in F:
    a,b,c=uvp[tri]; x0,y0=np.floor(np.minimum(np.minimum(a,b),c)).astype(int); x1,y1=np.ceil(np.maximum(np.maximum(a,b),c)).astype(int)
    xs,ys=np.meshgrid(np.arange(max(x0-1,0),min(x1+2,T)),np.arange(max(y0-1,0),min(y1+2,T)))
    den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(den)<1e-9: continue
    w0=((b[1]-c[1])*(xs-c[0])+(c[0]-b[0])*(ys-c[1]))/den; w1=((c[1]-a[1])*(xs-c[0])+(a[0]-c[0])*(ys-c[1]))/den; w2=1-w0-w1
    ins=(w0>=-0.02)&(w1>=-0.02)&(w2>=-0.02)
    if not ins.any(): continue
    W=np.stack([w0[ins],w1[ins],w2[ins]],1)
    P[ys[ins],xs[ins]]=W@V[tri]; NM[ys[ins],xs[ins]]=W@N[tri]; M[ys[ins],xs[ins]]=True
pts=P[M]; nr=NM[M]; nr/=np.linalg.norm(nr,axis=1,keepdims=True)+1e-9
acc=np.zeros((len(pts),3)); ws=np.zeros(len(pts))
def sample(img,px,py):
    H,W=img.shape[:2]; px=np.clip(px,0,W-1.001); py=np.clip(py,0,H-1.001); x0=px.astype(int); y0=py.astype(int); fx=(px-x0)[:,None]; fy=(py-y0)[:,None]
    return img[y0,x0]*(1-fx)*(1-fy)+img[y0,x0+1]*fx*(1-fy)+img[y0+1,x0]*(1-fx)*fy+img[y0+1,x0+1]*fx*fy
for sp in specs:
    q=sp.split(':'); name=q[0]; img=q[1]; wgt=float(q[2]) if len(q)>2 else 1.0
    im=np.asarray(Image.open(A+f'{t}_{img}.webp').convert('RGBA')).astype(np.float32); al=im[...,3]>150
    ys_,xs_=np.where(al); bx0,bx1,by0,by1=xs_.min(),xs_.max(),ys_.min(),ys_.max()
    core=ndimage.binary_erosion(al,iterations=2).astype(np.float32)
    if name=='top': proj=lambda X:(X[:,0],X[:,2],X[:,1]); dr=np.array([0,1,0.])
    else:
        a=np.radians(float(name)); dr=np.array([np.sin(a),0,np.cos(a)]); rt=np.array([np.cos(a),0,-np.sin(a)])
        proj=lambda X,rt=rt,dr=dr:(X@rt,-X[:,1],X@dr)
    du,dv,dd=proj(D); u0,u1,v0,v1=du.min(),du.max(),dv.min(),dv.max()
    R=420; gx=np.clip(((du-u0)/(u1-u0)*(R-1)).astype(int),0,R-1); gy=np.clip(((dv-v0)/(v1-v0)*(R-1)).astype(int),0,R-1)
    dm=np.full((R,R),-9.); np.maximum.at(dm,(gy,gx),dd); dm=ndimage.maximum_filter(dm,size=3)
    u,vv,d=proj(pts)
    vis=d>=dm[np.clip(((vv-v0)/(v1-v0)*(R-1)).astype(int),0,R-1),np.clip(((u-u0)/(u1-u0)*(R-1)).astype(int),0,R-1)]-0.02
    px=bx0+(u-u0)/(u1-u0)*(bx1-bx0); py=by0+(vv-v0)/(v1-v0)*(by1-by0)
    col=sample(im[...,:3],px,py); ok=sample(core[...,None],px,py)[:,0]>0.9
    w=wgt*np.clip(nr@dr,0,1)**2*vis*ok; w=w**3
    acc+=col*w[:,None]; ws+=w; print(sp,'cubre',round(float((w>1e-4).mean()),3))
good=ws>1e-5; col=np.zeros_like(acc); col[good]=acc[good]/ws[good,None]
if (~good).any():
    _,idx=cKDTree(pts[good]).query(pts[~good],k=4); col[~good]=col[good][idx].mean(1)
tex=np.zeros((T,T,3),np.float32); tex[M]=col
_,ind=ndimage.distance_transform_edt(~M,return_indices=True); tex=tex[ind[0],ind[1]]   # relleno de bordes del atlas
img=Image.fromarray(np.clip(tex,0,255).astype(np.uint8)).transpose(Image.FLIP_TOP_BOTTOM)
buf=io.BytesIO(); img.save(buf,'JPEG',quality=90); jimg=Image.open(io.BytesIO(buf.getvalue()))
mat=trimesh.visual.material.PBRMaterial(baseColorTexture=jimg,metallicFactor=0,roughnessFactor=1)
out=trimesh.Trimesh(V,F,vertex_normals=N,visual=trimesh.visual.TextureVisuals(uv=UV,material=mat),process=False)
out.export(f'/home/user/Sorpresa/bestiario/assets/models/{t}.glb'); import os
print(t,len(V),len(F),os.path.getsize(f'/home/user/Sorpresa/bestiario/assets/models/{t}.glb')//1024,'KB','sin cubrir',round(float((~good).mean()),3))

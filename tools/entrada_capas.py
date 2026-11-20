"""Genera las capas de la Entrada: cambios minimos sobre casa/entrada.webp.
Cada capa es un recorte RGBA (webp con transparencia) que se coloca encima de la imagen base.
Uso: python3 tools/entrada_capas.py [carpeta_preview]"""
import sys, json, numpy as np, cv2
from PIL import Image
R='/home/user/Sorpresa/'
base=np.array(Image.open(R+'casa/entrada.webp').convert('RGB')).astype(np.float32)
alt =np.array(Image.open(R+'casa/entrada-alt.webp').convert('RGB')).astype(np.float32)
H,W=base.shape[:2]
OUT=R+'casa/entrada/'; import os; os.makedirs(OUT,exist_ok=True)
layers={}

def poly(pts):
    m=np.zeros((H,W),np.uint8);cv2.fillPoly(m,[np.array(pts,np.int32)],255);return m>0
def rect(x0,y0,x1,y1):
    m=np.zeros((H,W),bool);m[y0:y1,x0:x1]=True;return m
def match(src,ref_region_mask,src_region_mask=None):
    """colour-match src to base using statistics on a region (Lab mean/std)"""
    if src_region_mask is None: src_region_mask=ref_region_mask
    s=cv2.cvtColor(np.clip(src,0,255).astype(np.uint8),cv2.COLOR_RGB2LAB).astype(np.float32)
    b=cv2.cvtColor(base.astype(np.uint8),cv2.COLOR_RGB2LAB).astype(np.float32)
    for c in range(3):
        ms,ss=s[...,c][src_region_mask].mean(),s[...,c][src_region_mask].std()+1e-3
        mb,sb=b[...,c][ref_region_mask].mean(),b[...,c][ref_region_mask].std()+1e-3
        s[...,c]=(s[...,c]-ms)*(sb/ss)*.85+ (s[...,c]-ms)*.15 + mb
    return cv2.cvtColor(np.clip(s,0,255).astype(np.uint8),cv2.COLOR_LAB2RGB).astype(np.float32)
def shift(img,dx,dy,sx=1.0,cx=0,sy=1.0,cy=0):
    M=np.float32([[sx,0,cx-sx*cx+dx],[0,sy,cy-sy*cy+dy]])
    return cv2.warpAffine(img,M,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
def pixelize(img,k=3):
    small=cv2.resize(img,(W//k,H//k),interpolation=cv2.INTER_AREA)
    return cv2.resize(small,(W,H),interpolation=cv2.INTER_NEAREST)
def inpaint(img,mask,r=6):
    return cv2.inpaint(np.clip(img,0,255).astype(np.uint8),(mask*255).astype(np.uint8),r,cv2.INPAINT_TELEA).astype(np.float32)
def save(name,rgb,alpha,hits,feather=2):
    """alpha: float 0..1 full-size; crop to bbox and save"""
    a=cv2.GaussianBlur(alpha.astype(np.float32),(0,0),feather) if feather else alpha.astype(np.float32)
    a=np.maximum(a,alpha*1.0) if feather==0 else a
    ys,xs=np.where(a>0.01);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    rgba=np.dstack([np.clip(rgb,0,255),np.clip(a*255,0,255)])[y0:y1,x0:x1].astype(np.uint8)
    Image.fromarray(rgba,'RGBA').save(OUT+name+'.webp','WEBP',quality=90,method=6)
    layers[name]={'x':int(x0),'y':int(y0),'w':int(x1-x0),'h':int(y1-y0),'hits':hits}
    return a

def poisson(src,mask):
    ys,xs=np.where(mask);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    mk=np.zeros((H,W),np.uint8);mk[mask]=255
    mk=cv2.dilate(mk,np.ones((3,3),np.uint8))
    c=((x0+x1)//2,(y0+y1)//2)
    sub=np.clip(src,0,255).astype(np.uint8)[y0-2:y1+2,x0-2:x1+2];msub=mk[y0-2:y1+2,x0-2:x1+2]
    r=cv2.seamlessClone(sub,np.clip(base,0,255).astype(np.uint8),msub,(x0-2+sub.shape[1]//2,y0-2+sub.shape[0]//2),cv2.NORMAL_CLONE)
    return r.astype(np.float32)
def harmonic(init,mask,known):
    # smooth (Laplace) fill of `mask` using only `known` pixels as boundary; other neighbours are ignored
    ys,xs=np.where(mask);x0,x1,y0,y1=max(xs.min()-4,0),xs.max()+5,max(ys.min()-4,0),ys.max()+5
    U=mask[y0:y1,x0:x1];K=known[y0:y1,x0:x1];V=init[y0:y1,x0:x1].copy();V[K]=base[y0:y1,x0:x1][K]
    w=(U|K).astype(np.float32)
    def step(V):
        num=np.zeros_like(V);den=np.zeros(V.shape[:2],np.float32)
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
            num+=np.roll(V*w[...,None],(dy,dx),(0,1));den+=np.roll(w,(dy,dx),(0,1))
        n=num/np.maximum(den,1e-3)[...,None];V2=V.copy();V2[U]=n[U];return V2
    for _ in range(1500): V=step(V)
    out=init.copy();out[y0:y1,x0:x1][U]=V[U];return out
def texture(region):
    # high-frequency detail of a real wall area, tiled over the whole picture
    ys,xs=np.where(region);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    t=base[y0:y1,x0:x1];hf=t-cv2.GaussianBlur(t,(0,0),4)
    hf=np.clip(hf,-25,25)
    reps=(H//hf.shape[0]+2,W//hf.shape[1]+2,1)
    tile=np.concatenate([hf,hf[:, ::-1]],1);tile=np.concatenate([tile,tile[::-1]],0)
    return np.tile(tile,(H//tile.shape[0]+1,W//tile.shape[1]+1,1))[:H,:W]
def is_wall(img):
    r,g,b=img[...,0],img[...,1],img[...,2]
    return (r>130)&(r-g>55)&(r-g<115)&(g-b>15)&(g-b<80)&(b<100)

# ---------------- abrigos (coats) ----------------
def wallfit(mask,ring):
    # row by row: median colour of the visible wall left of the coats, smoothed vertically
    out=base.copy();wl=is_wall(base)
    rows=np.full((H,3),np.nan)
    for y in range(300,600):
        xs=[x for x in range(240,316) if wl[y,x]]
        if len(xs)>8: rows[y]=np.median(base[y,xs],0)
    idx=np.arange(H);ok=~np.isnan(rows[:,0])
    for c in range(3): rows[:,c]=np.interp(idx,idx[ok],rows[ok,c])
    rows=cv2.GaussianBlur(rows.astype(np.float32)[:,None,:],(1,0),sigmaX=0.1,sigmaY=12)[:,0,:]
    my,mx=np.where(mask);out[my,mx]=rows[my]
    rng=np.random.default_rng(3);noise=rng.normal(0,2.0,(H//3+1,W//3+1)).repeat(3,0).repeat(3,1)[:H,:W]
    out[mask]+=noise[mask][:,None];return out
area=poly([(316,338),(478,338),(482,546),(312,546),(312,455)])
r,g,b=base[...,0],base[...,1],base[...,2]
gold=(r>170)&(g>120)&(b<120)&(r-b>90)
gold=cv2.dilate(cv2.morphologyEx(gold.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8)),np.ones((3,3),np.uint8))>0
m=area&~(gold&poly([(296,440),(356,440),(356,560),(296,560)]))
ring=(cv2.dilate(area.astype(np.uint8),np.ones((41,41),np.uint8))>0)&~area&is_wall(base)&rect(290,330,490,560)
rack=rect(300,318,482,382)
fill=wallfit(m,ring)
altm=match(alt,rack&~m,rack)
fill[m&rack]=altm[m&rack]
fill=harmonic(fill,m&~rack,is_wall(base)&~m)

out=base.copy();out[m]=fill[m]
save('abrigos',out,m.astype(np.float32),[[300,320,180,220]],feather=1.2)

# ---------------- corona de la lampara (chandelier wreath) ----------------
reg=rect(780,60,950,180)
r,g,b=base[...,0],base[...,1],base[...,2]
green=(g>r*0.85)&(g>b)&(g>40)
red=(r>140)&(g<90)&(b<90)
yellowlight=(r>220)&(g>200)&(b<170)
wm=reg&(green|red|yellowlight)
wm=cv2.morphologyEx(wm.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
wm=cv2.dilate(wm,np.ones((7,7),np.uint8))>0
wm&=reg
a2=shift(alt,0,0,sx=0.887,cx=857)
a2=match(a2,rect(760,60,960,190)&~wm)
a2=pixelize(a2,3)*0.6+a2*0.4
out=base.copy();out[wm]=a2[wm]
save('corona',out,wm.astype(np.float32),[[730,0,260,200]],feather=1.5)

# ---------------- cojin (cushion falls from the bench to the floor) ----------------
cm=poly([(357,547),(431,542),(448,559),(460,618),(451,626),(388,638),(376,632),(368,600),(357,575)])
cm=cv2.dilate(cm.astype(np.uint8),np.ones((5,5),np.uint8))>0
yy,xx=np.mgrid[0:H,0:W]
back_edge=632-0.155*(xx-350)          # where the seat meets the backrest
wallz=cm&(yy<563)
rail=cm&(yy>=563)&(yy<572)&(xx<=458)
post=cm&(xx>=447)&(xx<=457)&(yy>=572)&(yy<back_edge)
panel=cm&(yy>=572)&(yy<back_edge)&~post
seat=cm&(yy>=back_edge)
out=base.copy()
out=harmonic(out,wallz,is_wall(base)&~cm)
rng=np.random.default_rng(7)
def paint(mask,col,jit=6):
    n=rng.normal(0,jit,(H//3+1,W//3+1)).repeat(3,0).repeat(3,1)[:H,:W]
    out[mask]=np.array(col,np.float32)+n[mask][:,None]
paint(rail,(118,52,6));paint(post,(112,48,4))
pv=np.clip((yy-572)/40,0,1)
out[panel]=(np.array([112,16,14])*(1-pv[panel][:,None])+np.array([70,4,6])*pv[panel][:,None])
seatknown=(~cm)&(yy>=back_edge)&(yy<=640-0.147*(xx-350))&(xx>340)&(xx<470)&(base[...,0]>90)&(base[...,1]<60)
out=harmonic(out,seat,seatknown)
# outlines
for x in range(352,458):
    for yv in (563,571): 
        if cm[yv,x]: out[yv,x]=(40,6,0)
for y in range(572,640):
    if y<back_edge[y,447] and cm[y,447]: out[y,447]=(40,6,0)
for x in range(350,462):
    y=int(round(back_edge[0,x]))
    if 0<=y<H and cm[y,x]: out[y,x]=(60,4,2)
out=np.where(cm[...,None],pixelize(out,3)*0.55+out*0.45,out)
a_off=save('cojin_banco',out,cm.astype(np.float32),[],feather=1.0)

# cushion on the floor, cut from the new picture and moved a little to the right
DX,DY=42,6
fpoly=[(417,714),(448,697),(478,688),(505,687),(540,698),(567,718),(540,731),(495,744),(470,739),(430,723)]
fm=poly(fpoly)
src=match(alt,poly([(362,556),(426,548),(452,618),(390,632)]),fm)    # same reds as the original cushion
src=pixelize(src,3)*0.6+src*0.4
moved=shift(src,DX,DY);fmm=poly([(x+DX,y+DY) for x,y in fpoly])
shadow=np.zeros((H,W),np.float32);cv2.ellipse(shadow,(int(492+DX),int(733+DY)),(78,14),0,0,360,1,-1)
shadow=cv2.GaussianBlur(shadow,(0,0),5)*0.55
out=base*(1-shadow[...,None])
out[fmm]=moved[fmm]
alpha=np.maximum(fmm.astype(np.float32),shadow)
save('cojin_suelo',out,alpha,[],feather=0.8)
layers['cojin_banco']['hits']=[[355,540,105,100]]
layers['cojin_suelo']['hits']=[[455,688,155,62]]
layers['cojin_banco']['group']=layers['cojin_suelo']['group']='cojin'

# ---------------- alfombras (rugs lift) ----------------
def lifted(name,box,keep,hits,grow=7,feather=2.5):
    x0,y0,x1,y1=box;B=rect(x0,y0,x1,y1)
    r,g,b=base[...,0],base[...,1],base[...,2]
    rugb=(r>90)&(g<70)&(r>2.2*g)            # red carpet in the original
    floor=B&~cv2.dilate(rugb.astype(np.uint8),np.ones((15,15),np.uint8)).astype(bool)
    am=match(alt,floor,floor)                 # new picture with the original's floor colours
    d=np.abs(am-base).sum(2)>70
    m=B&(d|rugb)&keep
    m=cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
    m=(cv2.dilate(m,np.ones((grow,grow),np.uint8))>0)&B&keep
    am=pixelize(am,3)*0.5+am*0.5
    out=base.copy();out[m]=am[m]
    save(name,out,m.astype(np.float32),hits,feather=feather)
everything=np.ones((H,W),bool)
lifted('alfombrilla',(1170,640,1450,775),everything,[[1180,650,250,115]])
lifted('alfombra_pasillo',(492,560,705,668),~rect(690,560,705,668),[[500,565,200,100]])
lifted('alfombra',(328,770,760,941),poly([(328,941),(520,776),(628,776),(668,812),(712,880),(742,941)]),[[330,800,250,141]],feather=5)

# ---------------- muebles: the original drawers and doors open ----------------
def quadwarp(srcq,dstq):
    M=cv2.getPerspectiveTransform(np.float32(srcq),np.float32(dstq))
    return cv2.warpPerspective(base,M,(W,H),flags=cv2.INTER_NEAREST,borderMode=cv2.BORDER_REPLICATE)
def qmask(q):return poly([tuple(map(int,map(round,p))) for p in q])
def hole_fill(q,out,shelf=True):
    m=qmask(q);ys,xs=np.where(m);y0,y1=ys.min(),ys.max()
    t=np.clip((np.arange(H)-y0)/max(1,y1-y0),0,1)
    col=np.array([34,16,6])[None,:]*(1-t[:,None])+np.array([92,52,22])[None,:]*t[:,None]
    out[m]=col[ys]
    if shelf:   # a shelf across the middle
        (x0,a0),(x1,a1)=q[0],q[1];(_,b1),(_,b0)=q[2],q[3]
        for x in range(int(min(x0,q[3][0])),int(max(x1,q[2][0]))+1):
            f=(x-x0)/max(1,x1-x0);ytop=a0+(a1-a0)*f;ybot=b0+(b1-b0)*f;ym=int(round(ytop+(ybot-ytop)*0.52))
            for k,c in ((0,(150,92,40)),(1,(110,62,24)),(2,(60,30,10)),(3,(30,14,4))):
                if m[ym+k,x]:out[ym+k,x]=c
    edge=m&~(cv2.erode(m.astype(np.uint8),np.ones((3,3),np.uint8))>0);out[edge]=(20,8,2)
    return m
def door(name,q,hinge,openness=0.42):
    TL,TR,BR,BL=[np.float32(p) for p in q]
    out=base.copy();hm=hole_fill(q,out)
    if hinge=='l':
        hT,hB=TL,BL;w=TR[0]-TL[0];fT=TL+np.float32([-openness*w,-7]);fB=BL+np.float32([-openness*w,9])
        dst=[fT,hT,hB,fB]
    else:
        hT,hB=TR,BR;w=TR[0]-TL[0];fT=TR+np.float32([openness*w,-7]);fB=BR+np.float32([openness*w,9])
        dst=[hT,fT,fB,hB]
    panel=quadwarp(q,dst)*0.72                # back side of the door, a bit darker
    pm=qmask(dst);out[pm]=panel[pm]
    pe=pm&~(cv2.erode(pm.astype(np.uint8),np.ones((3,3),np.uint8))>0);out[pe]=(30,12,2)
    m=hm|pm
    save(name,out,m.astype(np.float32),[],feather=0)
    x,y,w2,h2=cv2.boundingRect(qmask(q).astype(np.uint8));layers[name]['hits']=[[x,y,w2,h2]]
def drawer(name,q,pull=20,grow=1.10):
    TL,TR,BR,BL=[np.float32(p) for p in q]
    out=base.copy();hm=hole_fill(q,out,shelf=False)
    c=(BL+BR)/2;dst=[(p-c)*grow+c+np.float32([0,pull]) for p in (TL,TR,BR,BL)]
    # inside of the drawer (seen from above): between the opening and the pulled-out front
    inner=[TL+np.float32([3,3]),TR+np.float32([-3,3]),dst[1]+np.float32([-4,2]),dst[0]+np.float32([4,2])]
    im=qmask(inner);ys,xs=np.where(im)
    t=np.clip((ys-ys.min())/max(1,ys.max()-ys.min()),0,1)
    out[ys,xs]=(np.array([40,20,6])*(1-t[:,None])+np.array([96,56,24])*t[:,None])
    for side in ((TL,dst[0]),(TR,dst[1])):
        a,b=side;n=int(np.hypot(*(b-a)))+1
        for k in range(n):
            pnt=a+(b-a)*k/max(1,n-1);xx,yy=int(pnt[0]),int(pnt[1])
            out[yy-1:yy+2,xx-2:xx+2]=(150,90,40)
    front=quadwarp(q,dst);fm=qmask(dst);out[fm]=front[fm]
    sh=qmask([dst[3],dst[2],dst[2]+np.float32([2,6]),dst[3]+np.float32([-2,6])]);out[sh&~fm]=out[sh&~fm]*0.55
    m=hm|im|fm|sh
    save(name,out,m.astype(np.float32),[],feather=0)
    x,y,w2,h2=cv2.boundingRect(qmask(q).astype(np.uint8));layers[name]['hits']=[[x,y,w2,h2]]
drawer('cajon_izq_1',[(144,630),(252,613),(252,660),(144,687)])
drawer('cajon_izq_2',[(255,610),(338,595),(338,638),(255,657)])
door('puerta_izq_1',[(144,697),(222,677),(222,790),(144,823)],'l')
door('puerta_izq_2',[(224,677),(285,660),(285,765),(224,790)],'r')
door('puerta_izq_3',[(288,658),(340,645),(340,747),(288,765)],'r')
door('puerta_der_1',[(1525,643),(1578,665),(1578,777),(1525,750)],'l')
door('puerta_der_2',[(1580,667),(1643,688),(1643,813),(1580,777)],'r')

for k,v in layers.items(): v.setdefault('group',k)
json.dump(layers,open(OUT+'capas.json','w'),indent=1)
# inline the layer table into casa.html
html=open(R+'casa.html').read()
a=html.index('/*CAPAS_ENTRADA*/');b=html.index('/*FIN_CAPAS*/')
html=html[:a]+'/*CAPAS_ENTRADA*/'+json.dumps(layers,separators=(',',':'))+html[b:]
open(R+'casa.html','w').write(html)
if len(sys.argv)>1:
    pv=base.copy()
    for n,l in layers.items():
        im=np.array(Image.open(OUT+n+'.webp')).astype(np.float32);x,y,w,h=l['x'],l['y'],l['w'],l['h']
        al=im[...,3:]/255;pv[y:y+h,x:x+w]=pv[y:y+h,x:x+w]*(1-al)+im[...,:3]*al
    Image.fromarray(pv.astype(np.uint8)).save(sys.argv[1]+'/preview.png')
    print(layers)

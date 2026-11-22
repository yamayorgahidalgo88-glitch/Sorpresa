"""Builds texturas/carga.webp: the green wall with the 5 golden frames, each one holding a photo.
Each photo fills exactly the opening of its frame (detected from the picture), cropped around the faces."""
import numpy as np, sys
from PIL import Image, ImageFilter, ImageOps
from scipy import ndimage
U='/root/.claude/uploads/6e868c25-a3a5-5e21-b831-70530985a0a3/'
bg=Image.open(U+'a772bd3c-image.png').convert('RGB');S=2           # work at 2x for sharper photos
big=bg.resize((bg.width*S,bg.height*S),Image.LANCZOS)
a=np.array(bg).astype(int)
green=(a[...,1]>a[...,0]+15)&(a[...,1]>a[...,2])                    # the wall colour
# (frame, centre of its opening, photo, vertical focus 0..1 of the photo)
FR=[((240,400),'e9ed16bf-image.jpg',.47),((712,330),'c9b4b247-image.jpg',.46),
    ((690,820),'c51db12a-image.jpg',(170,400,828,1345)),((240,965),'fe750bda-image.jpg',.47),((680,1330),'bb22e70f-image.jpg',.55)]
lab,_=ndimage.label(green)
out=big.copy()
for (cx,cy),f,fy in FR:
  m=lab==lab[cy,cx]; m=ndimage.binary_fill_holes(m)
  m=ndimage.binary_dilation(m,iterations=2)                         # slide the photo a hair under the frame
  ys,xs=np.where(m);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
  w,h=(x1-x0)*S,(y1-y0)*S
  ph=ImageOps.exif_transpose(Image.open(U+f)).convert('RGB')
  if isinstance(fy,tuple): ph=ph.crop(fy);fy=.5                       # explicit crop box around the two of us
  r=max(w/ph.width,h/ph.height);ph=ph.resize((round(ph.width*r),round(ph.height*r)),Image.LANCZOS)
  ox=(ph.width-w)//2;oy=int(np.clip(fy*ph.height-h/2,0,ph.height-h))
  ph=ph.crop((ox,oy,ox+w,oy+h))
  mk=Image.fromarray((m[y0:y1,x0:x1]*255).astype('uint8')).resize((w,h),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.8))
  # soft inner shadow from the frame
  sh=Image.fromarray((ndimage.distance_transform_edt(m[y0:y1,x0:x1])).astype('float32'))
  d=np.array(sh.resize((w,h)));k=np.clip(d/10,0,1)*.35+.65
  ph=Image.fromarray((np.array(ph)*k[...,None]).astype('uint8'))
  out.paste(ph,(x0*S,y0*S),mk)
# extend the wall downwards (mirrored strips of empty wall) so it fills tall phones
strip=out.crop((0,1520*S,out.width,1672*S));ext=Image.new('RGB',(out.width,out.height+900*S))
ext.paste(out,(0,0));y=out.height;flip=True
while y<ext.height:
  t=strip.transpose(Image.FLIP_TOP_BOTTOM) if flip else strip;ext.paste(t,(0,y));y+=t.height;flip=not flip
out=ext
out.save('texturas/carga.webp','WEBP',quality=84)
if len(sys.argv)>1: out.resize((bg.width,bg.height)).save(sys.argv[1])

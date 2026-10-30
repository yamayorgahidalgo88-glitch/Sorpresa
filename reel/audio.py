# Audio provisional sintetizado (sin dependencias salvo numpy). Sustituye por tu música/efectos si quieres.
import sys, wave, numpy as np
SR=44100; D=21; n=SR*D; t=np.arange(n)/SR; rng=np.random.default_rng(7)
mix=np.zeros(n)
def env(a,b,at=.02,rl=.1):
    e=np.zeros(n); i,j=int(a*SR),int(b*SR); k=np.arange(j-i)/SR
    e[i:j]=np.minimum(1,k/max(at,1e-3))*np.minimum(1,(b-a-k)/max(rl,1e-3)); return e
def add(sig,g=1): global mix; mix+=sig*g
def lp(x,c):  # filtro paso bajo simple
    a=np.exp(-2*np.pi*c/SR); y=np.zeros_like(x); s=0.
    for i in range(len(x)): s=(1-a)*x[i]+a*s; y[i]=s
    return y
# 0-9 s: zumbido tenso (disonante) que sube
drone=(np.sin(2*np.pi*55*t)+.8*np.sin(2*np.pi*58.3*t)+.4*np.sin(2*np.pi*77.8*t)+.15*np.sin(2*np.pi*(220+6*np.sin(t))*t))
add(drone*env(0,9.6,1,.6)*(.12+.06*np.sin(2*np.pi*.4*t)),1)
# 3-6 s: golpes secos en la puerta
for k in (3.35,4.05,4.75):
    m=(t>=k)&(t<k+.3); x=t[m]-k
    th=np.sin(2*np.pi*(95-120*x)*x)*np.exp(-x*22)+.5*rng.standard_normal(m.sum())*np.exp(-x*60)
    mix[m]+=th*.9
# 6-9 s: crujido de puerta (ruido filtrado con barrido) + latido
m=(t>=6.1)&(t<8.4); x=t[m]-6.1; f=300+500*np.sin(np.pi*x/2.3)
cre=np.sin(2*np.pi*np.cumsum(f)/SR)*np.sign(np.sin(2*np.pi*(40+20*x)*x))*.5+rng.standard_normal(m.sum())*.15
mix[m]+=cre*.14*np.minimum(1,np.minimum(x/.3,(2.3-x)/.5))
for k in np.arange(6.0,9.2,1.05):
    for off,g in ((0,1),(.2,.7)):
        m=(t>=k+off)&(t<k+off+.25); x=t[m]-k-off
        mix[m]+=np.sin(2*np.pi*(55-40*x)*x)*np.exp(-x*18)*.8*g
# 9-12 s: cambio de tono: acorde mayor cálido que florece + campanitas
chord=sum(np.sin(2*np.pi*f*t) for f in (261.6,329.6,392,523.3))
add(chord*env(9.1,13,.8,1.5)*.05,1)
for i,(tm,f) in enumerate(zip(np.arange(10.3,17,.25),[523,659,784,659,880,784,659,523]*4)):
    m=(t>=tm)&(t<tm+.5); x=t[m]-tm
    mix[m]+=np.sin(2*np.pi*f*x)*np.exp(-x*7)*.06*(1 if tm<17 else 0)
# 12-17 s: risas de niños (modulación de formantes)
for k in np.arange(12.2,16.8,.52):
    for j in range(4):
        tm=k+j*.11; m=(t>=tm)&(t<tm+.09); x=t[m]-tm; f0=480+rng.integers(0,260)
        v=sum(np.sin(2*np.pi*f0*h*x)/h for h in (1,2,3))*np.sin(np.pi*x/.09)
        mix[m]+=v*.07
# 17-21 s: máquina de escribir + risa de bruja
for i in range(15):
    tm=17.9+.09*i; m=(t>=tm)&(t<tm+.03); mix[m]+=rng.standard_normal(m.sum())*.18*np.exp(-(t[m]-tm)*120)
for i,tm in enumerate(np.arange(18.5,20.9,.22)):
    m=(t>=tm)&(t<tm+.17); x=t[m]-tm; f=420+40*i+120*np.sin(2*np.pi*9*x)
    saw=2*((np.cumsum(f)/SR)%1)-1
    mix[m]+=lp(saw,1800)*np.sin(np.pi*x/.17)*.16*(1-i/14)
mix=np.tanh(mix*1.3)
fade=np.minimum(1,np.minimum(t/.4,(D-t)/.8)); mix*=fade
pcm=(mix/np.max(np.abs(mix))*.85*32767).astype('<i2')
with wave.open(sys.argv[1] if len(sys.argv)>1 else 'audio.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

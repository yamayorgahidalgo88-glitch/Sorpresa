// Traducciones al inglés para la versión de CrazyGames.
// Cada bloque sigue el mismo orden que las preguntas en español de esa categoría.
// E(respuesta, texto, unidad, nota) — la respuesta sirve para comprobar que la fila corresponde.
// X(respuesta) — pregunta demasiado española: no se incluye en la versión de CrazyGames.
const EN={};
function E(a,t,u='',n=''){return {a,t,u,n};}
function X(a){return {a,skip:true};}
function addEN(cat,list){EN[cat]=list;}

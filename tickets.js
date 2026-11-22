// Lo que da cada casita. Cambia aquí el título y la explicación de cada ticket.
// (Las casitas 1..24 se desbloquean el día correspondiente de diciembre.)
export const TICKETS = Array.from({length: 24}, (_, i) => ({
  titulo: `Ticket ${i + 1}`,
  texto: 'Pronto sabrás qué esconde este ticket… 🎁',
}));

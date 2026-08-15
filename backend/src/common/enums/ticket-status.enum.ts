export enum TicketStatus {
  A_ATTRIBUER = 'a_attribuer',
  ASSIGNE = 'assigne',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
}

// Ordre des statuts pour la vue Kanban et les transitions autorisées
export const STATUS_ORDER = [
  TicketStatus.A_ATTRIBUER,
  TicketStatus.ASSIGNE,
  TicketStatus.EN_COURS,
  TicketStatus.TERMINE,
];

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_ORDER = exports.TicketStatus = void 0;
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["A_ATTRIBUER"] = "a_attribuer";
    TicketStatus["ASSIGNE"] = "assigne";
    TicketStatus["EN_COURS"] = "en_cours";
    TicketStatus["TERMINE"] = "termine";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
exports.STATUS_ORDER = [
    TicketStatus.A_ATTRIBUER,
    TicketStatus.ASSIGNE,
    TicketStatus.EN_COURS,
    TicketStatus.TERMINE,
];
//# sourceMappingURL=ticket-status.enum.js.map
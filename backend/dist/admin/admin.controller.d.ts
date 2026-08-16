import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getSessions(): Promise<import("../realtime/sessions.service").LiveSession[]>;
    invalidate(socketId: string): Promise<{
        message: string;
    }>;
    statsOverview(): Promise<{
        ticketsOuverts: any;
        ticketsTermines: any;
        techniciensActifs: any;
        revenuTotal: any;
        enLigne: number;
    }>;
    statsRepartition(): Promise<any>;
}

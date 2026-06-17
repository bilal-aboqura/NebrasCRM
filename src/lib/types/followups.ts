import { z } from "zod";

export const createFollowUpSchema = z.object({
  facilityId: z.string().min(1),
  contactId: z.string().optional(),
  type: z.enum(["call", "visit", "email", "whatsapp"]),
  dueAt: z.string().refine((value) => new Date(value).getTime() > Date.now(), "Due date must be in the future"),
  notes: z.string().max(2000).optional()
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

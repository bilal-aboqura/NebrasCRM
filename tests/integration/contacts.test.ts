import { describe, expect, it } from "vitest";
import { createContact, updateContact } from "@/lib/actions/contacts";
import { contacts } from "@/lib/data/mock";

describe("contact management", () => {
  it("supports atomic primary contact swaps", async () => {
    const contact = await createContact({ facilityId: "fac-1", name: "Primary Test", title: "Director", phone: "0509998877", isPrimary: true });
    expect(contact.isPrimary).toBe(true);
    expect(contacts.filter((item) => item.facilityId === "fac-1" && item.isPrimary)).toHaveLength(1);
    const updated = await updateContact(contact.id, { phone: "509998877" });
    expect(updated.phone).toBe("+966509998877");
  });
});

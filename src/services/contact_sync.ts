import * as Contacts from "expo-contacts";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../local_db/db";
import { contacts as contactsTable } from "../local_db/schema";
import { eq } from "drizzle-orm";

interface ContactModal {
  name: string;
  phone: string;
  public_id?: string;
  imageUrl?: string | null;
}

export class ContactService {
  private api = axios.create({
    baseURL: "http://37.60.242.176:8001",
    headers: { "Content-Type": "application/json" },
  });

  // Add JWT token to Axios headers dynamically
  private async setAuthHeader() {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }

  async syncContacts() {
    const permission = await Contacts.requestPermissionsAsync();
    if (!permission.granted) return;

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    const phoneBookContacts = this.sanitizeContacts(data);

    const localContacts = await db.select().from(contactsTable).all();

    const localContactsModals: ContactModal[] = localContacts.map(c => ({
      name: c.name,
      phone: c.phone,
      publicId: c.publicId,
      imageUrl: c.imageUrl,
    }));

    // ✅ set token before making any API requests
    await this.setAuthHeader();

    if (!localContactsModals.length) {
      await this.syncWithRemoteDb(phoneBookContacts);
      return;
    }

    await this.syncWithLocalContacts(phoneBookContacts, localContactsModals);
    await this.syncUnsavedContacts(phoneBookContacts, localContactsModals);
    await this.refreshContactImageUrls(localContactsModals);
  }

  sanitizeContacts(rawContacts: any[]): ContactModal[] {
    const result: ContactModal[] = [];
  
    rawContacts.forEach(contact => {
      const name = contact.name;
  
      (contact.phoneNumbers || []).forEach((phone: any) => {
        let num = phone.number.replace(/\D/g, ""); // keep only digits
  
        // Convert +94 / 94 to leading zero form
        if (num.startsWith("94") && num.length === 11) {
          num = "0" + num.substring(2);  // 94712345678 → 0712345678
        }
  
        // Fix case: number starts with 7 (missing 0)
        if (num.length === 9 && num.startsWith("7")) {
          num = "0" + num;  // 712345678 → 0712345678
        }
  
        // Only accept valid Sri Lankan mobile numbers (10 digits) 
        if (num.length === 10 && num.startsWith("0")) {
          result.push({ name, phone: num });
        }
      });
    });
  
    return result;
  }
  

  async syncWithLocalContacts(phoneBook: ContactModal[], local: ContactModal[]) {
    const localMap = new Map(local.map(c => [c.phone, c]));

    for (const contact of phoneBook) {
      const localEntry = localMap.get(contact.phone);
      if (localEntry && localEntry.name !== contact.name) {
        await db
          .update(contactsTable)
          .set({ name: contact.name })
          .where(eq(contactsTable.publicId, localEntry.public_id!));
      }
    }
  }

  async syncUnsavedContacts(phoneBook: ContactModal[], local: ContactModal[]) {
    const localPhones = new Set(local.map(c => c.phone));
    const unsynced = phoneBook.filter(c => !localPhones.has(c.phone));
    if (unsynced.length) {
      await this.syncWithRemoteDb(unsynced);
    }
  }

  async syncWithRemoteDb(contactList: ContactModal[]) {
    try {
      console.log(contactList);
      const response = await this.api.post("/users/sync-contacts", contactList);
      const returnedContacts: ContactModal[] = response.data.contacts;

      console.log(response.data);

      for (const contact of returnedContacts) {
        await db.insert(contactsTable).values({
          name: contact.name,
          phone: contact.phone,
          publicId: contact.public_id!,
          imageUrl: contact.imageUrl,
        });
      }
    } catch (e) {
      console.error("Failed to sync contacts:", e);
    }
  }

  async refreshContactImageUrls(localContacts: ContactModal[]) {
    const publicIds = localContacts.map(c => c.public_id).filter(Boolean);
    if (!publicIds.length) return;

    try {
      const response = await this.api.post("/users/refresh-contact-images", { public_ids: publicIds });
      const updatedContacts: ContactModal[] = response.data.contacts;

      for (const contact of updatedContacts) {
        await db
          .update(contactsTable)
          .set({ imageUrl: contact.imageUrl })
          .where(eq(contactsTable.publicId, contact.public_id!));
      }
    } catch (e) {
      console.warn("Failed to refresh contact images:", e);
    }
  }
}

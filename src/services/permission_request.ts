import * as Contacts from 'expo-contacts';

export async function getPhoneContacts() {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return [];

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers],
  });

  // Filter and sanitize contacts similar to your Dart _sanitizeContacts
  const sanitizedContacts = [];
  data.forEach(contact => {
    const name = contact.name || "";
    contact.phoneNumbers?.forEach(phone => {
      let number = phone.number.replace(/\D/g, ''); // remove non-numeric
      if (number.startsWith('94')) number = number.slice(2); // remove country code
      if (number) sanitizedContacts.push({ name, phone: number });
    });
  });

  return sanitizedContacts;
}

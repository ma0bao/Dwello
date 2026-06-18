export const demoProperties = [
  {
    address: '142 Maple Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    tenantName: 'Sarah Mitchell',
    tenantEmail: 'sarah.mitchell@email.com',
    rent: 2200,
    estimatedValue: 485000,
    squareFeet: 1850,
    photoUrl: 'https://placehold.co/400x200/2D6A4F/B7E4C7?text=142+Maple+St'
  },
  {
    address: '78 Birchwood Ave',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    tenantName: 'James Okafor',
    tenantEmail: 'james.okafor@email.com',
    rent: 2800,
    estimatedValue: 620000,
    squareFeet: 2100,
    photoUrl: 'https://placehold.co/400x200/D4A853/1A2420?text=78+Birchwood+Ave'
  },
  {
    address: '331 Lakeview Drive',
    city: 'Nashville',
    state: 'TN',
    zip: '37201',
    tenantName: 'Priya Nair',
    tenantEmail: 'priya.nair@email.com',
    rent: 1950,
    estimatedValue: 395000,
    squareFeet: 1650,
    photoUrl: 'https://placehold.co/400x200/40916C/F8F6F1?text=331+Lakeview+Dr'
  }
];

export function seedDemoProperties(db) {
  const row = db.prepare('SELECT COUNT(*) AS count FROM properties').get();
  if (row.count > 0) return;

  const insert = db.prepare(`
    INSERT INTO properties (
      address, city, state, zip, tenant_name, tenant_email,
      rent, estimated_value, square_feet, photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((properties) => {
    for (const property of properties) {
      insert.run(
        property.address,
        property.city,
        property.state,
        property.zip,
        property.tenantName,
        property.tenantEmail,
        property.rent,
        property.estimatedValue,
        property.squareFeet,
        property.photoUrl
      );
    }
  });

  insertMany(demoProperties);
}

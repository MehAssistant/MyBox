const endpoint = 'https://sgp.cloud.appwrite.io/v1';
const project = 'mybox';
const key = 'standard_cc63054f5ca918a5fcf58d9a2d2719b864c5c8363cb6648948d94954734a140b9ef8458cd3abadb5e561fd0f7b8a4bd3837bc4c89a6785219fa20ed6de01be71641e8791db9a59073ed1d30198d556b0314e19e50eb76f1e9893f1b98f3ffe043f0f30a734cb58bb039629523653abaa0ec0788ed2c144d67e2a966cba515938';

async function cleanUserTargets() {
  const headers = {
    'X-Appwrite-Project': project,
    'X-Appwrite-Key': key,
    'Content-Type': 'application/json'
  };

  console.log('1. Fetching all users...');
  const usersRes = await fetch(`${endpoint}/users`, { headers });
  const usersData = await usersRes.json();
  console.log(`Found ${usersData.total} users.`);

  for (const u of usersData.users || []) {
    console.log(`\nUser: ${u.name || u.email} (${u.$id})`);
    console.log(`Targets: ${u.targets?.length || 0}`);

    for (const t of u.targets || []) {
      console.log(`- Deleting target ${t.$id} (identifier: ${t.identifier?.slice(0, 30)}...)...`);
      const delRes = await fetch(`${endpoint}/users/${u.$id}/targets/${t.$id}`, {
        method: 'DELETE',
        headers
      });
      console.log(`  Delete status:`, delRes.status);
    }
  }

  console.log('\n✅ All old/stale targets cleaned up successfully!');
}

cleanUserTargets().catch(console.error);

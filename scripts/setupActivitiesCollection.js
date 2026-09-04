const endpoint = 'https://sgp.cloud.appwrite.io/v1';
const project = 'mybox';
const key = 'standard_cc63054f5ca918a5fcf58d9a2d2719b864c5c8363cb6648948d94954734a140b9ef8458cd3abadb5e561fd0f7b8a4bd3837bc4c89a6785219fa20ed6de01be71641e8791db9a59073ed1d30198d556b0314e19e50eb76f1e9893f1b98f3ffe043f0f30a734cb58bb039629523653abaa0ec0788ed2c144d67e2a966cba515938';
const dbId = 'db_mybox';

async function safeFetch(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function setup() {
  const headers = {
    'X-Appwrite-Project': project,
    'X-Appwrite-Key': key,
    'Content-Type': 'application/json'
  };

  console.log('Checking collection col_activities in db_mybox...');
  let colRes = await safeFetch(`${endpoint}/databases/${dbId}/collections/col_activities`, { headers });
  if (!colRes || !colRes.ok) {
    console.log('Creating collection col_activities...');
    colRes = await safeFetch(`${endpoint}/databases/${dbId}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collectionId: 'col_activities',
        name: 'Aktivitas Sistem & Top Up',
        permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
        documentSecurity: false
      })
    });
    console.log('col_activities created:', colRes?.status, await colRes?.text());
  } else {
    console.log('Collection col_activities already exists!');
  }

  const stringAttrs = [
    { key: 'user_id', size: 255 },
    { key: 'type', size: 50 },
    { key: 'title', size: 255 },
    { key: 'description', size: 2000 },
    { key: 'envelope_name', size: 255 },
    { key: 'envelope_id', size: 255 },
    { key: 'details', size: 5000 },
    { key: 'timestamp', size: 255 }
  ];

  for (const a of stringAttrs) {
    try {
      const res = await safeFetch(`${endpoint}/databases/${dbId}/collections/col_activities/attributes/string`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: a.key, size: a.size, required: false })
      });
      console.log(`String attr ${a.key} res:`, res?.status);
    } catch (e) {
      console.log(`String attr ${a.key} error:`, e.message);
    }
  }

  try {
    const res = await safeFetch(`${endpoint}/databases/${dbId}/collections/col_activities/attributes/float`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key: 'amount', required: false })
    });
    console.log(`Float attr amount res:`, res?.status);
  } catch (e) {
    console.log(`Float attr amount error:`, e.message);
  }

  console.log('Done setupActivitiesCollection!');
}

setup().catch(console.error);

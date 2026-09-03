const endpoint = 'https://sgp.cloud.appwrite.io/v1';
const project = 'mybox';
const key = 'standard_cc63054f5ca918a5fcf58d9a2d2719b864c5c8363cb6648948d94954734a140b9ef8458cd3abadb5e561fd0f7b8a4bd3837bc4c89a6785219fa20ed6de01be71641e8791db9a59073ed1d30198d556b0314e19e50eb76f1e9893f1b98f3ffe043f0f30a734cb58bb039629523653abaa0ec0788ed2c144d67e2a966cba515938';
const dbId = 'db_mybox';

async function setup() {
  const headers = {
    'X-Appwrite-Project': project,
    'X-Appwrite-Key': key,
    'Content-Type': 'application/json'
  };

  console.log('1. Checking database...');
  let dbRes = await fetch(`${endpoint}/databases/${dbId}`, { headers });
  if (!dbRes.ok) {
    console.log('Creating database db_mybox...');
    dbRes = await fetch(`${endpoint}/databases`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ databaseId: dbId, name: 'MyBox DB' })
    });
    console.log('DB create:', await dbRes.text());
  } else {
    console.log('Database db_mybox exists!');
  }

  console.log('2. Checking collection col_push_subscribers...');
  let colRes = await fetch(`${endpoint}/databases/${dbId}/collections/col_push_subscribers`, { headers });
  if (!colRes.ok) {
    console.log('Creating collection col_push_subscribers...');
    colRes = await fetch(`${endpoint}/databases/${dbId}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collectionId: 'col_push_subscribers',
        name: 'Push Subscribers',
        permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
        documentSecurity: false
      })
    });
    console.log('Col create:', colRes.status, await colRes.text());
  } else {
    console.log('Collection col_push_subscribers exists! Updating permissions...');
    await fetch(`${endpoint}/databases/${dbId}/collections/col_push_subscribers`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: 'Push Subscribers',
        permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
        documentSecurity: false
      })
    });
  }

  // 3. Create attributes
  const attrs = [
    { key: 'user_id', type: 'string', size: 255 },
    { key: 'endpoint', type: 'string', size: 1000 },
    { key: 'device_name', type: 'string', size: 255 },
    { key: 'subscription_json', type: 'string', size: 5000 }
  ];

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

  for (const a of attrs) {
    console.log(`Checking/Creating attribute ${a.key}...`);
    try {
      const attrRes = await safeFetch(`${endpoint}/databases/${dbId}/collections/col_push_subscribers/attributes/${a.type}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: a.key,
          size: a.size,
          required: false
        })
      });
      console.log(`Attr ${a.key} res:`, attrRes.status);
    } catch (e) {
      console.log(`Attr ${a.key} notice:`, e.message);
    }
  }

  // 4. Checking collection col_dailycam
  console.log('4. Checking collection col_dailycam...');
  try {
    let camColRes = await safeFetch(`${endpoint}/databases/${dbId}/collections/col_dailycam`, { headers });
    if (!camColRes || !camColRes.ok) {
      console.log('Creating collection col_dailycam...');
      camColRes = await safeFetch(`${endpoint}/databases/${dbId}/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          collectionId: 'col_dailycam',
          name: 'DailyCam Snaps',
          permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
          documentSecurity: false
        })
      });
      console.log('Col col_dailycam create:', camColRes?.status);
    } else {
      console.log('Collection col_dailycam exists!');
    }

    const camAttrs = [
      { key: 'user_id', type: 'string', size: 255 },
      { key: 'file_id', type: 'string', size: 255 },
      { key: 'day_number', type: 'integer', min: 1, max: 10000 },
      { key: 'timestamp', type: 'string', size: 255 },
      { key: 'note', type: 'string', size: 1000 }
    ];

    for (const a of camAttrs) {
      const body = a.type === 'integer' 
        ? { key: a.key, required: false, min: a.min, max: a.max }
        : { key: a.key, size: a.size, required: false };
      const res = await safeFetch(`${endpoint}/databases/${dbId}/collections/col_dailycam/attributes/${a.type}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      console.log(`Cam attr ${a.key} res:`, res?.status);
    }
  } catch (e) {
    console.warn('DailyCam setup error:', e.message);
  }

  // 5. Checking collection col_textpaste
  console.log('5. Checking collection col_textpaste...');
  try {
    let pasteColRes = await safeFetch(`${endpoint}/databases/${dbId}/collections/col_textpaste`, { headers });
    if (!pasteColRes || !pasteColRes.ok) {
      console.log('Creating collection col_textpaste...');
      pasteColRes = await safeFetch(`${endpoint}/databases/${dbId}/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          collectionId: 'col_textpaste',
          name: 'TextPaste Items',
          permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
          documentSecurity: false
        })
      });
      console.log('Col col_textpaste create:', pasteColRes?.status);
    } else {
      console.log('Collection col_textpaste exists!');
    }

    const pasteAttrs = [
      { key: 'user_id', type: 'string', size: 255 },
      { key: 'category', type: 'string', size: 100 },
      { key: 'label', type: 'string', size: 255 },
      { key: 'value', type: 'string', size: 5000 },
      { key: 'timestamp', type: 'string', size: 255 }
    ];

    for (const a of pasteAttrs) {
      const res = await safeFetch(`${endpoint}/databases/${dbId}/collections/col_textpaste/attributes/${a.type}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: a.key, size: a.size, required: false })
      });
      console.log(`Paste attr ${a.key} res:`, res?.status);
    }
  } catch (e) {
    console.warn('TextPaste setup error:', e.message);
  }

  // 6. Checking Storage bucket
  const bucketId = '6a98130500111e865d17';
  console.log(`6. Checking storage bucket ${bucketId}...`);
  try {
    let bucketRes = await safeFetch(`${endpoint}/storage/buckets/${bucketId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: 'MyBox Storage',
        permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")', 'read("users")', 'create("users")', 'update("users")', 'delete("users")'],
        fileSecurity: false,
        enabled: true,
        maximumFileSize: 50000000,
        allowedFileExtensions: []
      })
    });
    console.log('Bucket update status:', bucketRes?.status);
  } catch (e) {
    console.warn('Bucket setup error:', e.message);
  }

  console.log('Done ensuring all collections and bucket!');
}

setup().catch(console.error);

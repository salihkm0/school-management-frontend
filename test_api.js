const axios = require('axios');
async function test() {
  const resp = await axios.get('http://localhost:5055/api/staff', { params: { limit: 1000 } });
  console.log(Object.keys(resp.data));
  console.log(Object.keys(resp.data.data || {}));
}
test().catch(console.error);

const { fetchUserLocations } = require('./services/fetchUserLocations');
const { fetchUserServices } = require('./services/fetchUserServices');

const userId = 'a55e9572-6a61-43c7-9bbb-ef319554b974'; // seu ID real

(async () => {
  const cities = await fetchUserLocations(userId);
  const services = await fetchUserServices(userId);

  console.log('🌆 Cities:', cities);
  console.log('🔧 Services:', services);
})();

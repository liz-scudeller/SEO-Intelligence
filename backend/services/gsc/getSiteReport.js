import getSearchConsole from './gscClient.js';

 const getSiteReport = async ({ siteUrl, startDate, endDate, dimensions = ['page'], rowLimit = 1000 }) => {
  const searchConsole = getSearchConsole();

  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
      aggregationType: 'auto',
    },
  });

  return response.data.rows || [];
};

export default getSiteReport;
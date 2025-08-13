import API from './axios';

export const getTotalReports = async () => {
  const res = await API.get('/statistics/total-reports');
  return res.data;   
};

export const getMaliciousReports = async () => {
  const res = await API.get('/statistics/malicious-reports');
  return res.data;
};

export const getSafeReports = async () => {
  const res = await API.get('/statistics/safe-reports');
  return res.data;
};

export const getRepeatedDomains = async () => {
  const res = await API.get('/statistics/repeated-domains');
  return res.data;
};

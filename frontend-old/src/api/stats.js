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


export const getPendingReportsCount = async () => {
  const res = await API.get('/statistics/pending-reports');
  return res.data;
};

export const getResolvedReportsCount = async () => {
  const res = await API.get('/statistics/resolved-reports');
  return res.data;
};

export const getInProgressReportsCount = async () => {
  const res = await API.get('/statistics/in-progress-reports');
  return res.data;
};

export const getReportsByYear = async () => {
  const res = await API.get('/statistics/reports-by-year');
  return res.data;
};

export const getReportsByWeek = async () => {
  const res = await API.get('/statistics/reports-by-week');
  return res.data;
};

export const getReportsByDay = async () => {
  const res = await API.get('/statistics/reports-by-day');
  return res.data;
};
const reports = [];

exports.addReport = ({ domain, reason }) => {
  const report = {
    id: reports.length + 1,
    domain,
    reason,
    submittedAt: new Date(),
    analyzed: false,
    analysis: null
  };
  reports.push(report);
  return report;
};

exports.getAllReports = () => reports;

exports.findReport = (id) => reports.find(r => r.id === parseInt(id));

//Get un-analyzed reports
exports.getPendingReports = () => reports.filter(r => !r.analyzed);

//Add analysis result
exports.saveAnalysis = (id, analysis) => {
  const report = reports.find(r => r.id === parseInt(id));
  if (!report) return null;
  report.analysis = analysis;
  report.analyzed = true;
  return report;
};

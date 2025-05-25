const reports = [];

exports.addReport = ({ domain, reason }) => {
  const report = {
    id: reports.length + 1,
    domain,
    reason,
    submittedAt: new Date(),
  };
  reports.push(report);
  return report;
};

exports.getAllReports = () => reports;
exports.findReport = (id) => reports.find(r => r.id === parseInt(id));

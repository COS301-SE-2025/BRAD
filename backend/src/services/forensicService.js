exports.performAnalysis = (report) => {
  return {
    domain: report.domain,
    riskScore: Math.floor(Math.random() * 100),
    summary: "Keyword scan completed. Mock analysis only."
  };
};

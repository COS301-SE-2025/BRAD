"use client"

const ReporterQuestions = [
  {
    question: "What is B.R.A.D.?",
    answer:
      "B.R.A.D. (Bot to Report Abusive Domains) is a platform that allows users to report suspicious URLs. The system uses AI-based and human investigator analysis to determine the risk level of submitted websites.",
  },
  {
    question: "How do I submit a report?",
    answer:
      "After logging in as a Reporter, you can submit a report by entering the suspicious URL and optionally uploading evidence such as screenshots or documents. Click the 'Submit' button to finalize your report.",
  },
  {
    question: "How are reports analysed?",
    answer:
      "Once a report is submitted, it is first evaluated by B.R.A.D.'s AI bot. Then, an investigator reviews the bot's analysis and any attached evidence to make a final decision.",
  },
  {
    question: "How long does it take to get a report resolved?",
    answer:
      "The AI bot typically analyzes a report within seconds. Manual investigation may take up to 24 hours depending on workload.",
  },
  {
    question: "Can I track the status of my reports?",
    answer:
      "Yes. As a Reporter, you can view your report history and see which reports are still pending or have been resolved. Resolved reports will also display the final decision and risk score.",
  },
  {
    question: "How will adding evidence help analysing my report?",
    answer:
      "A reporter is able to submit optional evidence in the form of screenshots, documents etc. This can be used to give the Investigator more insight on where the URL was found, who shared the URL, etc. This can help the investigator during their analysis and improve the accuracy of the report.",
  },
  {
    question: "Who can I contact for technical support?",
    answer:
      "You can contact the B.R.A.D. development team via the email provided in the Help menu's Contact section.",
  },
];

const InvestigatorQuestions = [
  {
    question: 'What is the role of an investigator in B.R.A.D ?',
    answer:
      'An Investigator\'s role in B.R.A.D is to use the bot\'s result after analysing the report to give a clear analysis of the report by reviewing evidence like screenshots or documents, leaving a comment to advise the reporter.'
  },
  {
    question: 'How can I view the result of the bot\'s response?',
    answer:
      'As soon as a report is submitted by a user, the bot analyzes the report. The result is then available for review on the investigator dashboard under "Pending Reports". Click "View Report" to begin.'
  },
  {
    question: 'What type of information do I see in the bot\'s response?',
    answer:
      'You will see: date scanned, risk score, malware detection, IP address, registrar, SSL validation, WHOIS owner, raw WHOIS data, DNS records, structure info, crawled links, raw HTML, submitted evidence, and number of red flags.'
  },
  {
    question: 'How can I use optional evidence submitted by a reporter?',
    answer:
      'Optional evidence (screenshots, documents, etc.) helps the Investigator understand where the URL was found, who shared it, and gives more context for accurate analysis.'
  },
  {
    question: 'Can I relaunch the bot to my specifications?',
    answer:
      'Yes! Investigators can relaunch the bot with custom specifications to get more specific results.'
  },
  {
    question: 'Do I have the final say in the analysis result?',
    answer:
      'Yes. The user only sees the final investigator result, not the bot\'s analysis. This ensures malicious users cannot exploit the bot\'s insights.'
  }
];

const AdminQuestions = [
  {
    question: 'What is my role in B.R.A.D as an admin?',
    answer: 'An admin\'s role in B.R.A.D is to manage users.'
  },
  {
    question: 'Can I add a new user?',
    answer:
      'Yes! Enter the user\'s email and username. They\'ll receive an OTP and link to set their password. They can log in with their new credentials.'
  },
  {
    question: 'Can I remove a user?',
    answer: 'Yes! You can remove any user except another admin.'
  },
  {
    question: 'Can I change a user\'s role?',
    answer:
      'Yes! You can assign users the roles of reporter, investigator, or admin. However, you can’t modify the role of another admin.'
  },
  {
    question: 'What does managing users entail?',
    answer:
      'Managing users includes adding, removing, changing roles, searching, and filtering users by name or role.'
  }
];

export default function FAQ({ searchTerm = "", role = "reporter" }) {
  let questions = ReporterQuestions
  if (role === "investigator") questions = InvestigatorQuestions
  if (role === "admin") questions = AdminQuestions

  const filtered = questions.filter((q) =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const userIconUrl = "/user-icon.png"
  const bradRobotUrl = "/BRAD_robot.png"

  return (
    <div className="faq-chat mt-6">
      {filtered.map((q, idx) => (
        <div key={idx} className="faq-exchange">
          <div className="faq-user">
            <img src={userIconUrl} alt="User" className="faq-avatar" />
            <div className="faq-question">
              <p>{q.question}</p>
            </div>
          </div>
          <div className="faq-brad">
            <div className="faq-answer">
              <p>{q.answer}</p>
            </div>
            <img src={bradRobotUrl} alt="BRAD Robot" className="faq-avatar" />
          </div>
        </div>
      ))}
    </div>
  )
}
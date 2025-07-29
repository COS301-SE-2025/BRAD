import React from 'react';

const FAQ = () => {
  const questions = [
    {
      question: 'What is B.R.A.D.?',
      answer:
        'B.R.A.D. (Bot to Report Abusive Domains) is a platform that allows users to report suspicious URLs. The system uses AI-based and human investigator analysis to determine the risk level of submitted websites.'
    },
    {
      question: 'How do I submit a report?',
      answer:
        'After logging in as a Reporter, you can submit a report by entering the suspicious URL and optionally uploading evidence such as screenshots or documents. Click the "Submit" button to finalize your report.'
    },
    {
      question: 'How are reports analyzed?',
      answer:
        'Once a report is submitted, it is first evaluated by B.R.A.D.\'s AI bot. Then, an investigator reviews the bot\'s analysis and any attached evidence to make a final decision.'
    },
    {
      question: 'How long does it take to get a report resolved?',
      answer:
        'The AI bot typically analyzes a report within seconds. Manual investigation may take up to 24 hours depending on workload.'
    },
    {
      question: 'Can I track the status of my reports?',
      answer:
        'Yes. As a Reporter, you can view your report history and see which reports are still pending or have been resolved. Resolved reports will also display the final decision and risk score.'
    },
    {
      question: 'Who can I contact for technical support?',
      answer:
        'You can contact the B.R.A.D. development team via the email provided in the Help menu\'s Contact section.'
    }
  ];

  return (
    <div className="faq-section">
      <h2>Frequently Asked Questions</h2>
      {questions.map((q, idx) => (
        <div className="faq-item" key={idx}>
          <details>
            <summary>{q.question}</summary>
            <p>{q.answer}</p>
          </details>
        </div>
      ))}
    </div>
  );
};

export default FAQ;

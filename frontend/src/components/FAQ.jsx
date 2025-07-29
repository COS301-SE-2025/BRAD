import React from 'react';
import '../styles/Help.css'
import userIcon from '../assets/user-icon.png'; 
import bradRobot from '../assets/BRAD_robot.png';

const FAQ = ({ searchTerm }) => {
  const ReporterQuestions = [
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
      question: 'How are reports analysed?',
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
      question: 'How will adding evidence help analysing my report?',
      answer:'A reporter is able to submit optional evidence in the form of screenshots, documents etc, this can be used to give the Investigator more insight on where the URL wss found, who sent shared the URL etc, this can help the investigator during their analysis of the report and help them give a more accurate report. '
    },
    {
      question: 'Who can I contact for technical support?',
      answer:
        'You can contact the B.R.A.D. development team via the email provided in the Help menu\'s Contact section.'
    }
  ];

  const investigatorQuestions = [
    {
        question:'What is the role of an investigator in B.R.A.D ?',
        answer:"An Investigator's role in B.R.A.D is to use the bot's result after analysing the report to give a clear analysis of the report by reviewing evidence like screenshots or documents etc, leaving a comment to advise the reporter on how to continue"
    },
    {
        question:"How can I as an Investigator view the result of the bot's response ?",
        answer:"As soon as a report is submitted by a user, the bot is launched to analyse this report and then the bot's is available to an investigator to review on their dashboard under pending reports, click view report to start the investigation process"
    },
    {
        question:"What type of information will I as an Investigator be able to see from the bot's response",
        answer:'When viewing a report to start the investigation, an Investigator will be able to see the following information : date scanned, risk score, malware detection, IP Address, Registar, SSL Validation, WHOIS owner, Raw WHOIS data, SND records, Structure information, crawled links, Raw HTML and evidence submitted by reporter as well as number of red flags.'
    },
    {
        question:'How can an Investigator use the optional evidence a reporter submitted ?',
        answer:'A reporter is able to submit optional evidence in the form of screenshots, documents etc, this can be used to give the Investigator more insight on where the URL wss found, who sent shared the URL etc, this can help the investigator during their analysis of the report and help them give a more accurate report. '
    },
    {
        question:'Can I as the Investigator relaunch the bot to my specifications? ',
        answer:'Yes! An Investigator is able to relaunch the bot to receive a more accurate response according to more specific specifications '
    },
    {
        question:'Do I as the Investigator have the final say of what the result of the analysis is ?',
        answer:"Yes! The user who submitted the report will only be able to view the analysis of the Investigator and never the bot's response, this means that any user's with malicious intent are not able to use B.R.A.D to help them protect against our bot. "
    }

  ];

  const adminQuestions = [
    {
      question:"What is my role in B.R.A.D as an admin?",
      answer:"An admin's role in B.R.A.D is to manage users."
    },
    {
      question:"Can I as an Admin add a new user?",
      answer:"Yes! An admin is able to add a user by enter the user's email and username, that user will receive an email with a OTP and a link to change their password, then that user is able to log in with their user name and newly updated password."
    },
    {
      question:"Can I as an Admin remove a user?",
      answer:"Yes! As an admin you are able to remove any user accepts another admin."
    },
    {
      question:"Can I as an Admin change the role of a user?",
      answer:"Yes! An admin is able to change a user's role to reporter, investigator or admin, but not able to change the role of another admin."
    },
    {
      question:"What does managing user's entail?",
      answer:"Managing users as an admin includes : adding,removing ans changing user's roles as well as being able to search and filter through all user's to view their roles and usernames."
    }
    
  ];

  const filtered = ReporterQuestions.filter((q) =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="faq-chat">
      {filtered.map((q, idx) => (
        <div key={idx} className="faq-exchange">
          <div className="faq-user">
            <img src={userIcon} alt="User" className="faq-avatar" />
            <div className="faq-question">
              <p>{q.question}</p>
            </div>
          </div>
          <div className="faq-brad">
            <div className="faq-answer">
              <p>{q.answer}</p>
            </div>
            <img src={bradRobot} alt="BRAD Robot" className="faq-avatar" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FAQ;
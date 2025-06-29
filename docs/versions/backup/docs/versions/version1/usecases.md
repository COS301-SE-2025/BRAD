> **B.R.A.D** **System:** **Use** **Cases for** **Demo** **1**

This outlines and analyses the three main use cases of the B.R.A.D (Bot
to Report Abusive Domains) cybersecurity application. Each use case is
detailed with user perspectives,system responsibilities, and variations
in workflow depending on the implementation of automated vs manual bot
analysis.

> **Use** **Case** **1:** **Submit** **Domain** **Report**

**User Perspective:** 

The Reporter wants to submit a suspicious domain via a
simple and secure interface.They may optionally upload supporting evidence (screenshots,emails,etc.).

**System** **Role:**
• Validates the domain

• Stores the report in the database

•Optionally or automatically triggers the
investigation bot depending on chosen version

•Provides confirmation of submission

**Steps(General):**

 1\. Reporter logs into the platform.

 2\. Fills in the domain name.

 3\. Uploads evidence(optional).

 4\. Submits the report.

 5\. System processes the submission accordingly.

**Version** **1:**

**Bot is triggered** **automatically u pon** **submission.**

• Trigger BotAnalysis becomes an\<\<include\>\>usecase.

• Investigation starts immediately in the background.

• Reporter receives a confirmation that investigation has started.

• Optional: Investigator is notified post-analysis.

<img src="./images/Usecase1V1.png"
style="width:6.31514in;height:2.65903in" />

**Version** **2:**


**Investigator** **manually launches the bot later.**

 • Submission is stored and queued for human review.

 • Investigator decides when to initiate investigation.

<img src="./images/Usecase2V2.png"
style="width:7.26805in;height:2.98889in" />


> **Use** **Case2: View** **Submitted** **Reports**

**User Perspective:** 

The Reporter wants to track the status of their
previous submissions,including any analysis results or reports generated by investigators.

**System** **Role:**

• Authenticates the user

• Retrieves and displays submission history and current statuses

• Optionally allows filtering,downloading reports,or receiving notifications

In Version1: statuses update quickly as bot analysis runs automatically.
InVersion2: status may show as "AwaitingInvestigation"
until an investigator initiates the process.

<img src="./images/Usecase2.png"
style="width:7.26806in;height:2.00555in" />

> **Use** **Case 3:** **Analyse** **Forensic**

**User Perspective:**

The Investigator logs in to review assigned or submitted domain reports.They
access metadata, interpret bot analysis results,and provide a final analysis.

 **System** **Role:**

• Authenticates the investigator with secure access

• Displays report information and metadata

• Runs or fetches bot out put depending on the version

• Supports visual analysis tools,export features,and escalation options


**Version** **1:Bot is Auto Triggered**

• Investigator accesses already-analysed results

• Main task is interpretation and risk assessment

<img src="./images/Usecase3V1.png"
style="width:7.26805in;height:2.30069in" />

**Version** **2:Bot is Manually Triggered**

• Investigator must explicitly launch the bot from the dashboard

• Once results are ready,analysis and reporting proceed as usual

<img src="./images/Usecase3V2.png"
style="width:7.26805in;height:4.41944in" />


**Version** **1**is ideal for
rapid,scalable analysis where automation speeds up feedback loops.

<img src="./images/Version1.png"
style="width:7.26805in;height:4.41944in" />

**Version** **2** introduces flexibility and manual control for nuanced investigations.

<img src="./images/Version2.png"
style="width:7.26805in;height:4.41944in" />

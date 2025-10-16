"use client";

const steps = [
  {
    title: "Submit URL & Evidence",
    description: "Enter the suspicious URL and optionally upload evidence files.",
    image: "/file-upload.png",
  },
  {
    title: "Bot Analysis",
    description: "Our bot analyzes the URL and scrapes for malware or threats.",
    image: "/analysing.png",
  },
  {
    title: "Investigator Review",
    description: "Investigators review the bot’s findings and your evidence to make a verdict.",
    image: "/magnifying-glass.png",
  },
  {
    title: "Report Resolved",
    description: "You will receive the final verdict and can view the resolved report.",
    image: "/file.svg",
  },
];

export default function ReportStepsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      {steps.map((step, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center"
        >
          <img src={step.image} alt={step.title} className="mx-auto mb-4 h-20 w-20" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{step.title}</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

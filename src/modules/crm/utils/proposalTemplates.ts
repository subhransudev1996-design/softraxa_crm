export interface ProposalData {
  clientName: string;
  projectName: string;
  overview: string;
  features: string[];
  cost: string;
  paymentTerms: {
    percentage: string;
    description: string;
  }[];
  timeline: string;
  authorName: string;
  companyName: string;
  contactInfo: string;
}

export const generateProposalMarkdown = (data: ProposalData): string => {
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const paymentTermsStr = data.paymentTerms
    .map(term => `* ${term.percentage}% (${term.description})`)
    .join('\n');

  const featuresStr = data.features
    .map((feature, index) => `### ${index + 1}. ${feature.split(':')[0]}\n\n* ${feature.split(':').slice(1).join(':').trim() || feature}`)
    .join('\n\n---\n\n');

  return `Dear ${data.clientName},

Thank you for the opportunity to develop your ${data.projectName}. Based on your requirements, we are pleased to present a comprehensive proposal for designing and developing a scalable, user-friendly, and business-oriented solution using modern technologies.

---

## 📱 Project Overview

${data.overview}

---

## 🚀 Key Features & Functionalities

${featuresStr}

---

## ⚙️ Technology Stack

* Frontend: Modern Web / Mobile Frameworks
* Backend: Scalable Cloud Infrastructure
* Database: High-performance Managed Databases
* Integration: Secure API & Payment Gateways

---

## 💰 Project Cost

**Total Project Cost: ${data.cost}**

---

## 💳 Payment Terms

${paymentTermsStr}

---

## ⏱️ Project Timeline

* Total Duration: ${data.timeline}

---

## 🔧 Post-Delivery Support

* 15 days of free support after delivery
* Bug fixes and minor improvements included
* Optional AMC (Annual Maintenance Contract) available

---

## 📌 Additional Notes

* Solution will be scalable for future features
* Clean UI/UX for better engagement
* Code will be structured and maintainable
* Future upgrade support available

---

We are confident that this solution will significantly enhance your business operations and engagement.

Please feel free to reach out for any clarification or modifications to this proposal.

Looking forward to working with you.

Best Regards,
${data.authorName}
${data.companyName}
${data.contactInfo}

*Generated on ${date}*`;
};

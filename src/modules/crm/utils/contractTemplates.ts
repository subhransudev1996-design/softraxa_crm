export interface ContractData {
  clientName: string;
  projectName: string;
  scopeOfWork: string;
  totalCost: string;
  startDate: string;
  endDate: string;
  paymentSchedule: {
    milestone: string;
    amount: string;
  }[];
  authorName: string;
  companyName: string;
}

export const generateContractMarkdown = (data: ContractData): string => {
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const paymentScheduleStr = data.paymentSchedule
    .map((p: any) => `* **${p.milestone}**: ${p.amount}`)
    .join('\n');

  return `# SOFTWARE DEVELOPMENT & SERVICES AGREEMENT

This Agreement is made on this **${date}** between:

**${data.companyName}**, (hereinafter referred to as the "Service Provider")
AND
**${data.clientName}**, (hereinafter referred to as the "Client")

---

## 1. SCOPE OF WORK
The Service Provider agrees to design, develop, and deliver the **${data.projectName}**. 

${data.scopeOfWork}

## 2. PROJECT TIMELINE
* **Effective Date**: ${data.startDate}
* **Estimated Completion**: ${data.endDate}
* Total Duration: As specified in the technical roadmap.

## 3. PROJECT COST & PAYMENT TERMS
The total consideration for the project is **${data.totalCost}**. The payment shall be made as per the following schedule:

${paymentScheduleStr}

## 4. INTELLECTUAL PROPERTY
Upon full and final payment of all dues, the ownership of the final software code and assets specifically developed for this project shall be transferred to the Client.

## 5. CONFIDENTIALITY
Both parties agree to keep all project-related information, business secrets, and technical data strictly confidential during and after the completion of the project.

## 6. TERMINATION
Either party may terminate this agreement with 15 days of written notice. In case of termination, the Client shall pay for all work completed up to the date of termination.

---

**For ${data.companyName}**
*(Authorized Signatory)*

**For ${data.clientName}**
*(Authorized Signatory)*`;
};

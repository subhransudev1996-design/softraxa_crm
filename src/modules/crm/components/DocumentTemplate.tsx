import React from 'react';

interface DocumentTemplateProps {
  title: string;
  clientName: string;
  projectName: string;
  content: string;
  type: 'proposal' | 'contract';
}

export const DocumentTemplate = ({ title, clientName, projectName, content, type }: DocumentTemplateProps) => {
  return (
    <div id="pdf-document" style={{
      width: '794px', // A4 width at 96 DPI
      padding: '40px 60px',
      backgroundColor: '#ffffff',
      fontFamily: '"Geist", sans-serif',
      color: '#000000',
      minHeight: '1123px', // A4 height at 96 DPI
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* CSS to prevent breaking inside elements */}
      <style>{`
        .pdf-section { page-break-inside: avoid; margin-bottom: 30px; }
        h1, h2, h3 { page-break-after: avoid; }
        ul, ol { page-break-before: avoid; }
        .markdown-content p { margin-bottom: 12px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px', borderBottom: '2px solid #f4f4f5', paddingBottom: '30px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <img src="/logo.png" alt="Softraxa Logo" style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
          </div>
          <p style={{ fontSize: '12px', color: '#71717a', fontWeight: '500' }}>www.softraxa.com | info@softraxa.com</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#a1a1aa', margin: '0' }}>{type === 'proposal' ? 'Project Proposal' : 'Service Agreement'}</h1>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', marginTop: '5px' }}>DOC-{Math.random().toString(36).substring(7).toUpperCase()}</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="pdf-section" style={{ marginBottom: '50px' }}>
        <p style={{ fontSize: '12px', fontWeight: '900', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Prepared For</p>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#000', margin: '0 0 16px 0' }}>{clientName}</h2>
        <div style={{ padding: '24px', backgroundColor: '#fafafa', borderRadius: '24px', border: '1px solid #f4f4f5' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '4px' }}>Project Context</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', margin: '0' }}>{projectName}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="markdown-content" style={{ 
        flex: 1,
        fontSize: '14px', 
        lineHeight: '1.8', 
        color: '#27272a', 
        whiteSpace: 'pre-wrap',
        marginBottom: '60px' 
      }}>
        {content.split('\n\n').map((block, i) => (
          <div key={i} className="pdf-section">
            {block}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pdf-section" style={{ 
        marginTop: 'auto', 
        borderTop: '1px solid #f4f4f5', 
        paddingTop: '30px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', margin: '0 0 4px 0' }}>Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p style={{ fontSize: '10px', color: '#a1a1aa', margin: '0' }}>Document ID: SOFT-{Math.random().toString(36).substring(7).toUpperCase()}</p>
        </div>
        <p style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: '500', lineHeight: '1.6' }}>
          © {new Date().getFullYear()} Softraxa Solutions Private Limited. All Rights Reserved. <br/>
          This document is generated digitally and is valid without a physical signature. <br/>
          www.softraxa.com
        </p>
      </div>
    </div>
  );
};

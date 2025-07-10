/**
 * PRIVACY POLICY PAGE
 * 
 * GDPR compliant privacy policy page
 * Based on GDPR.eu template requirements
 */

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> July 11, 2025<br />
              <strong>Last Updated:</strong> July 11, 2025<br />
              <strong>Version:</strong> 1.0
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 mb-4">
                Fleetopia (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our transport and logistics marketplace platform.
              </p>
              <p className="text-gray-700 mb-4">
                This policy complies with the General Data Protection Regulation (GDPR) and other applicable privacy laws. By using our services, you consent to the data practices described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Data Controller Information
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Company:</strong> Fleetopia SRL<br />
                  <strong>Address:</strong> [Company Address]<br />
                  <strong>Email:</strong> privacy@fleetopia.com<br />
                  <strong>Phone:</strong> [Company Phone]<br />
                  <strong>Data Protection Officer:</strong> dpo@fleetopia.com
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Information We Collect
              </h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                3.1 Personal Information
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Name, email address, phone number</li>
                <li>Company information (name, VAT number, address)</li>
                <li>Professional role (provider, carrier, admin)</li>
                <li>Identity verification documents</li>
                <li>Payment and billing information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                3.2 Business Information
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Cargo listings and transport requests</li>
                <li>Vehicle information and specifications</li>
                <li>Transport offers and quotations</li>
                <li>GPS location data (when enabled)</li>
                <li>Communication records and chat messages</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                3.3 Technical Information
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and feature interactions</li>
                <li>Performance and error data</li>
                <li>AI feedback and suggestions data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. How We Use Your Information
              </h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                4.1 Service Provision (Legal Basis: Contract)
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Creating and managing your account</li>
                <li>Processing cargo listings and transport requests</li>
                <li>Facilitating communication between users</li>
                <li>Processing payments and billing</li>
                <li>Providing customer support</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                4.2 Legal Compliance (Legal Basis: Legal Obligation)
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Identity verification and KYC processes</li>
                <li>Tax reporting and regulatory compliance</li>
                <li>Fraud prevention and security measures</li>
                <li>Responding to legal requests</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                4.3 Legitimate Interests
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Improving our services and user experience</li>
                <li>AI-powered suggestions and optimizations</li>
                <li>Analytics and performance monitoring</li>
                <li>Security and fraud prevention</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                4.4 Consent-Based Processing
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Marketing communications (with explicit consent)</li>
                <li>GPS location tracking (with permission)</li>
                <li>Optional features and integrations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data Sharing and Disclosure
              </h2>
              
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                5.1 Service Providers
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Cloud hosting services (data centers within EU)</li>
                <li>Payment processors (with PCI DSS compliance)</li>
                <li>Email service providers</li>
                <li>Analytics and monitoring services</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                5.2 Platform Users
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Contact information for verified transport agreements</li>
                <li>Public cargo listings (without personal contact details)</li>
                <li>Professional ratings and reviews</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                5.3 Legal Requirements
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Compliance with court orders or legal process</li>
                <li>Protection of our rights and safety</li>
                <li>Investigation of fraud or security issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Data Retention
              </h2>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Retention Periods
                </h3>
                <ul className="list-disc pl-6 text-blue-800 space-y-1">
                  <li><strong>Account Data:</strong> 7 years after account closure</li>
                  <li><strong>Transaction Records:</strong> 7 years (legal requirement)</li>
                  <li><strong>Communication Data:</strong> 3 years</li>
                  <li><strong>Technical Logs:</strong> 1 year</li>
                  <li><strong>Marketing Data:</strong> Until consent withdrawal</li>
                </ul>
              </div>
              
              <p className="text-gray-700">
                We retain personal data only for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Your Rights Under GDPR
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Right to Access</h3>
                    <p className="text-green-800 text-sm">Request a copy of your personal data</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Right to Rectification</h3>
                    <p className="text-blue-800 text-sm">Correct inaccurate personal data</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">Right to Erasure</h3>
                    <p className="text-purple-800 text-sm">&quot;Right to be forgotten&quot; - delete your data</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">Right to Restrict Processing</h3>
                    <p className="text-yellow-800 text-sm">Limit how we process your data</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-indigo-900 mb-2">Right to Data Portability</h3>
                    <p className="text-indigo-800 text-sm">Export your data in machine-readable format</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Right to Object</h3>
                    <p className="text-red-800 text-sm">Object to processing based on legitimate interests</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Right to Withdraw Consent</h3>
                    <p className="text-gray-800 text-sm">Withdraw consent for processing at any time</p>
                  </div>
                  
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-teal-900 mb-2">Right to Lodge a Complaint</h3>
                    <p className="text-teal-800 text-sm">File a complaint with supervisory authority</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">
                  How to Exercise Your Rights
                </h3>
                <p className="text-orange-800">
                  To exercise any of these rights, please contact us at{' '}
                  <a href="mailto:privacy@fleetopia.com" className="font-medium underline">
                    privacy@fleetopia.com
                  </a>{' '}
                  or through your account settings. We will respond within 30 days of receiving your request.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Data Security
              </h2>
              
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal data:
              </p>
              
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection</li>
                <li>Incident response and breach notification procedures</li>
                <li>Regular backups and disaster recovery planning</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. International Data Transfers
              </h2>
              
              <p className="text-gray-700 mb-4">
                Your personal data is primarily processed within the European Economic Area (EEA). If we transfer data outside the EEA, we ensure adequate protection through:
              </p>
              
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Adequacy decisions by the European Commission</li>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Binding Corporate Rules (BCRs)</li>
                <li>Certified data protection frameworks</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Cookies and Tracking
              </h2>
              
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience. For detailed information about our cookie practices, please see our Cookie Policy.
              </p>
              
              <p className="text-gray-700 mb-4">
                You can control cookie settings through your browser preferences or our cookie consent banner.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Children&apos;s Privacy
              </h2>
              
              <p className="text-gray-700 mb-4">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal data, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Changes to This Policy
              </h2>
              
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. We will notify you of material changes by:
              </p>
              
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Email notification to your registered address</li>
                <li>Prominent notice on our platform</li>
                <li>In-app notifications</li>
              </ul>
              
              <p className="text-gray-700">
                Your continued use of our services after notification constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Contact Information
              </h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Questions About This Policy?
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">General Privacy Inquiries</h4>
                    <p className="text-gray-700">
                      Email: <a href="mailto:privacy@fleetopia.com" className="text-blue-600 hover:text-blue-800">privacy@fleetopia.com</a><br />
                      Phone: [Privacy Team Phone]
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data Protection Officer</h4>
                    <p className="text-gray-700">
                      Email: <a href="mailto:dpo@fleetopia.com" className="text-blue-600 hover:text-blue-800">dpo@fleetopia.com</a><br />
                      Postal Address: [DPO Address]
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Supervisory Authority</h4>
                  <p className="text-gray-700">
                    If you have concerns about our data practices, you may contact the Romanian Data Protection Authority (ANSPDCP) at{' '}
                    <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      www.dataprotection.ro
                    </a>
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                This Privacy Policy was last updated on July 11, 2025. Version 1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
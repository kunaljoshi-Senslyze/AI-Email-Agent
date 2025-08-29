"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

const TITLE_TEXT = `
# Email AI-ssistant
`;
interface ProcessEmailResult {
  classification?: "respond" | "ignore" | "notify";
  reply?: string;
  notification?: string;
}

export default function Home() {
  // ✅ State for user input
  const [author, setAuthor] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [emailThread, setEmailThread] = useState<string>("");

  // ✅ Query: API Health (only when user email is provided)
  const healthCheck = useQuery({
    ...orpc.healthCheck.queryOptions({
      input: { email: author },
    }),
    enabled: Boolean(author && author.includes("@")), // Only run when valid email is entered
  });

  // ✅ Single workflow mutation
  const processEmailMutation = useMutation<ProcessEmailResult, Error, {
    author: string;
    to: string;
    subject: string;
    email_thread: string;
  }>({
    ...orpc.emailAssistant.processEmail.mutationOptions(),
  });

  const handleProcess = () => {
    if (!author || !to || !subject || !emailThread) {
      alert("Please fill in all fields");
      return;
    }

    processEmailMutation.mutate({
      author,
      to,
      subject,
      email_thread: emailThread,
    });
  };

  const handleClear = () => {
    setAuthor("");
    setTo("");
    setSubject("");
    setEmailThread("");
    processEmailMutation.reset();
  };

  // Sample email for testing
  const loadSampleEmail = () => {
    setAuthor("john.doe@company.com");
    setTo("support@company.com");
    setSubject("Urgent: Server downtime issue");
    setEmailThread(`Hi Support Team,

We're experiencing severe server downtime that started about 30 minutes ago. Our production environment is completely inaccessible, and this is affecting all our customers.

Can someone please look into this immediately? We need this resolved ASAP as it's causing significant business impact.

Thanks,
John`);
  };

  const isValidEmail = (email: string): boolean => {
    return email.length > 0 && email.includes("@");
  };

  const canProcess = (): boolean => {
    return Boolean(
      author && 
      isValidEmail(author) && 
      to && 
      subject && 
      emailThread &&
      Boolean(healthCheck.data)&&
      !processEmailMutation.isPending
    );
  };

  const getStatusColor = (): string => {
    if (!author || !isValidEmail(author)) return "bg-gray-400";
    if (healthCheck.isLoading) return "bg-yellow-500";
    if (healthCheck.data) return "bg-green-500";
    return "bg-red-500";
  };

  const getStatusText = (): string => {
    if (!author || !isValidEmail(author)) return "Enter your email to check connection";
    if (healthCheck.isLoading) return "Checking...";
    if (healthCheck.data) return "Connected";
    return "Disconnected";
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getClassificationStyle = (classification: string): string => {
    switch (classification) {
      case 'respond':
        return 'bg-green-100 text-green-800';
      case 'notify':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-2">
      <pre className="overflow-x-auto font-mono text-sm mb-6">{TITLE_TEXT}</pre>

      <div className="grid gap-6">
        {/* ✅ API Status */}
        <section className="rounded-lg border p-4 shadow-sm">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm text-muted-foreground">
              {getStatusText()}
            </span>
          </div>
        </section>

        {/* ✅ Email Input */}
        <section className="rounded-lg border p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Email Assistant</h2>
            <button
              onClick={loadSampleEmail}
              className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Load Sample
            </button>
          </div>
          
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Author (your email)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Recipient"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            <textarea
              placeholder="Email content..."
              value={emailThread}
              onChange={(e) => setEmailThread(e.target.value)}
              className="rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={6}
              required
            />

            <div className="flex gap-3">
              <button
                onClick={handleProcess}
                disabled={!canProcess()}
                className="flex-1 rounded bg-blue-600 px-4 py-3 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {processEmailMutation.isPending
                  ? "Processing..."
                  : "🤖 Analyze Email"}
              </button>
              
              <button
                onClick={handleClear}
                disabled={processEmailMutation.isPending}
                className="px-4 py-3 rounded border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </form>

          {/* ✅ Error Handling */}
          {processEmailMutation.error && (
            <div className="mt-4 p-3 rounded bg-red-50 border border-red-200">
              <h3 className="font-medium text-red-800">❌ Error</h3>
              <p className="text-sm text-red-600 mt-1">
                {processEmailMutation.error.message || "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          {/* ✅ Show Results */}
          {processEmailMutation.data && (
            <div className="mt-6 space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">📊 Analysis Results</h3>
              </div>

              {/* Classification */}
              {processEmailMutation.data.classification && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    📌 Triage Result
                  </h4>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      getClassificationStyle(processEmailMutation.data.classification)
                    }`}>
                      {processEmailMutation.data.classification.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Reply */}
              {processEmailMutation.data.reply && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-medium text-green-800 flex items-center gap-2">
                    ✉️ Suggested Response
                  </h4>
                  <div className="mt-3 bg-white rounded border p-3">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {processEmailMutation.data.reply}
                    </pre>
                  </div>
                  <button
                    onClick={() => copyToClipboard(processEmailMutation.data.reply || '')}
                    className="mt-2 text-sm px-3 py-1 rounded bg-green-100 hover:bg-green-200 transition-colors"
                  >
                    📋 Copy Response
                  </button>
                </div>
              )}

              {/* Notification */}
              {processEmailMutation.data.notification && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                    🔔 Notification Summary
                  </h4>
                  <div className="mt-3 bg-white rounded border p-3">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {processEmailMutation.data.notification}
                    </pre>
                  </div>
                  <button
                    onClick={() => copyToClipboard(processEmailMutation.data.notification || '')}
                    className="mt-2 text-sm px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200 transition-colors"
                  >
                    📋 Copy Summary
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
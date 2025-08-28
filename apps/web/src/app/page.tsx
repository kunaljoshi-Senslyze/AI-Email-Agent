"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

const TITLE_TEXT = `
# Email AI-ssistant
`;

export default function Home() {
  // ✅ Query: API Health
  const healthCheck = useQuery(
    orpc.healthCheck.queryOptions({
      input: { email: "test@example.com" },
    })
  );

  // ✅ State for user input
  const [author, setAuthor] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [emailThread, setEmailThread] = useState("");

  // ✅ Mutations
  const triageMutation = useMutation(
    orpc.emailAssistant.triage.mutationOptions()
  );
  const responseMutation = useMutation(
    orpc.emailAssistant.generateResponse.mutationOptions()
  );

  const handleTriage = () => {
    triageMutation.mutate({
      author,
      to,
      subject,
      email_thread: emailThread,
    });
  };

  const handleResponse = () => {
    responseMutation.mutate({
      author,
      to,
      subject,
      email_thread: emailThread,
    });
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>

      <div className="grid gap-6">
        {/* ✅ API Status */}
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                healthCheck.data ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {healthCheck.isLoading
                ? "Checking..."
                : healthCheck.data
                ? "Connected"
                : "Disconnected"}
            </span>
          </div>
        </section>

        {/* ✅ Email Input */}
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Email Assistant</h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-3"
          >
            <input
              type="email"
              placeholder="Author (your email)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="rounded border p-2"
              required
            />
            <input
              type="email"
              placeholder="Recipient"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded border p-2"
              required
            />
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded border p-2"
              required
            />
            <textarea
              placeholder="Email content..."
              value={emailThread}
              onChange={(e) => setEmailThread(e.target.value)}
              className="rounded border p-2"
              rows={5}
              required
            />

            <div className="flex gap-4">
              <button
                onClick={handleTriage}
                disabled={triageMutation.isPending}
                className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
              >
                {triageMutation.isPending ? "Triaging..." : "Triage Email"}
              </button>

              <button
                onClick={handleResponse}
                disabled={responseMutation.isPending}
                className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
              >
                {responseMutation.isPending
                  ? "Generating..."
                  : "Generate Response"}
              </button>
            </div>
          </form>

          {/* ✅ Show Results */}
          {triageMutation.data && (
            <div className="mt-4">
              <h3 className="font-medium">📌 Triage Result</h3>
              <pre className="mt-2 rounded bg-gray-100 p-2 text-sm">
                {JSON.stringify(triageMutation.data, null, 2)}
              </pre>
            </div>
          )}

          {responseMutation.data && (
            <div className="mt-4">
              <h3 className="font-medium">✉️ Suggested Response</h3>
              <pre className="mt-2 rounded bg-gray-100 p-2 text-sm">
                {JSON.stringify(responseMutation.data, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
